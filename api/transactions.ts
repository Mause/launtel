import Axios from "axios";
import { Tabletojson } from "tabletojson";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { CookieJar } from "tough-cookie";
import { URLSearchParams } from "url";
import axiosCookieJarSupport from "axios-cookiejar-support";
import joi from "joi";
import _ from "lodash";
import {
  LocalDate,
  LocalDateTime,
  LocalTime,
  Month,
  YearMonth,
} from "@js-joda/core";

const validation = joi
  .object({
    LAUNTEL_EMAIL: joi.string().email(),
    LAUNTEL_PASSWORD: joi.string(),
  })
  .options({ stripUnknown: true })
  .validate(process.env);
if (validation.error) {
  throw validation.error;
}
const config = validation.value;

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
    throw new Error("login failed");
  }

  return session;
}

class Transaction {
  public date: LocalDateTime;
  public description: string;
  public amount: BigInt;
  public balance: BigInt;

  constructor(obj: { [key: string]: string }) {
    this.date = parseDate(obj.Date);
    this.description = obj.Description;
    this.amount = money(obj.Amount)!;
    this.balance = money(obj.Balance)!;
  }
}

export default async (request: VercelRequest, response: VercelResponse) => {
  const session = await getCookie();

  const transactions: Transaction[] = Tabletojson.convert(
    (await session.get("/transactions")).data
  )[0].map((row: Record<string, string>) => new Transaction(row));

  const perMonth = _.chain(transactions)
    .filter((transaction) => transaction.amount < BigInt(0))
    .groupBy(({ date }) => YearMonth.from(date).toJSON())
    .entries()
    .map(([key, values]) => {
      let val = -_.sumBy(values, "amount");

      return [key, bigintToString(val as unknown as BigInt)];
    })
    .fromPairs()
    .value();

  const res = JSON.stringify(
    { perMonth, transactions, numTransactions: transactions.length },
    (_, obj) => (typeof obj === "bigint" ? bigintToString(obj) : obj)
  );
  response.setHeader("Content-Type", "application/json").send(res);
};

function bigintToString(val: BigInt): string | number {
  return parseFloat(val.toString()) / 100;
}

function parseDate(input: string) {
  const [day, month, year, time] = input.split(" ");
  const [hour, minute] = time.split(":").map((i) => parseInt(i, 10));

  return LocalDateTime.of(
    LocalDate.of(
      parseInt(year, 10),
      Month.valueOf(month.toUpperCase()),
      parseInt(day, 10)
    ),
    LocalTime.of(hour, minute)
  );
}

function money(obj: string): BigInt | undefined {
  return obj ? BigInt(obj.replace("$", "").replace(".", "")) : undefined;
}
