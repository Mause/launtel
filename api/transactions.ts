import Axios from "../support/axios";
import { AxiosInstance } from "axios";
import { Tabletojson } from "tabletojson";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { CookieJar } from "tough-cookie";
import { URLSearchParams } from "url";
import axiosCookieJarSupport from "axios-cookiejar-support";
import _ from "lodash";
import { Instant, LocalDateTime, YearMonth } from "@js-joda/core";
import * as cheerio from "cheerio";
import authenticate from "../support/auth";
import config from "../support/config";
import { IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { log } from "../support/log";

const ZERO = BigInt(0);

export async function getCookie() {
  const session = Axios.create({
    baseURL: "https://residential.launtel.net.au",
    withCredentials: true,
  });
  axiosCookieJarSupport(session);
  session.defaults.jar = new CookieJar();

  const form_data = new URLSearchParams();
  form_data.append("username", config.LAUNTEL_EMAIL);
  form_data.append("password", config.LAUNTEL_PASSWORD);

  const res = await session.post("/login", form_data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (res.config.url?.includes("login")) {
    log.error({ url: res.config.url }, "Login failed");
    throw new Error("login failed");
  }

  return session;
}

class LauntelTransaction {
  public date: LocalDateTime;
  public description: string;
  public amount: bigint;
  public balance: bigint;
  public isCCCharge: boolean;

  constructor(obj: { [key: string]: string }) {
    this.isCCCharge = obj["3"] === "Refund";
    this.date = parseDate(obj.Date);
    this.description = obj.Description;
    this.amount = money(obj.Amount)!;
    this.balance = money(obj.Balance)!;
  }
}

class Discount {
  constructor(private _discount: bigint) {}

  discount(amount: bigint) {
    if (amount > this._discount) {
      const res = amount - this._discount;
      this._discount = ZERO;
      return res;
    } else if (this._discount == amount) {
      this._discount = ZERO;
      return ZERO;
    } else if (amount < this._discount) {
      this._discount -= amount;
      return ZERO;
    }
  }
}

class PerMonth {
  @IsString()
  discounted: string;
  constructor(discounted: string) {
    this.discounted = discounted;
  }
}

class LauntelTransactionResponse {
  @Type(() => PerMonth)
  @ValidateNested({ each: true })
  public perMonth: Map<string, PerMonth>;
  constructor(perMonth: Map<string, PerMonth>) {
    this.perMonth = perMonth;
  }
}
export const responseShape = LauntelTransactionResponse.name;

async function getTransactions(session: AxiosInstance, page: number) {
  log.info("On page", page);
  let data = (await session.get("/transactions", { params: { p: page } })).data;

  const transactions: LauntelTransaction[] = Tabletojson.convert(data)[0].map(
    (row: Record<string, string>) => new LauntelTransaction(row)
  );
  /*
  let html = cheerio.load(data);
  if (html('.page-link:contains("Next")').length) {
    transactions.push(...(await getTransactions(session, page + 1)));
  }
  */

  return transactions;
}
export default authenticate(
  async (request: VercelRequest, response: VercelResponse) => {
    log.info("Getting cookie");
    const session = await getCookie();
    log.info("Got cookie");

    const transactions = await getTransactions(session, 1);
    log.info("Got transactions: ", transactions.length);

    const discount = new Discount(BigInt(2500));

    const perMonth = _.chain(transactions)
      .filter((transaction) => transaction.amount < BigInt(0))
      .groupBy(({ date }) => YearMonth.from(date).toJSON())
      .entries()
      .sortBy(0)
      .map(([key, values]) => {
        let val = -_.sumBy(values, "amount");

        return [
          key,
          {
            amount: bigintToString(val as unknown as BigInt),
            discounted: discount.discount(BigInt(val)),
          },
        ];
      })
      .fromPairs()
      .value();

    const res = JSON.stringify(
      { perMonth, transactions, numTransactions: transactions.length },
      (_, obj) => (typeof obj === "bigint" ? bigintToString(obj) : obj),
      2
    );
    response.setHeader("Content-Type", "application/json");
    response.send(res);
  }
);

function bigintToString(val: BigInt): string | number {
  return parseFloat(val.toString()) / 100;
}

function parseDate(input: string) {
  return LocalDateTime.ofInstant(Instant.ofEpochMilli(Date.parse(input)));
}

function money(obj: string): bigint | undefined {
  return obj ? BigInt(obj.replace("$", "").replace(".", "")) : undefined;
}
