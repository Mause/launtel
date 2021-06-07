import Axios from "axios";
import { Tabletojson } from "tabletojson";
import { VercelRequest, VercelResponse, VercelApiHandler } from "@vercel/node";
import { CookieJar } from "tough-cookie";
import { URLSearchParams } from "url";
import axiosCookieJarSupport from "axios-cookiejar-support";
import joi from "joi";
import _ from "lodash";

const MONTHS =
  "January February March April May June July August October November December".split(
    " "
  );

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
  public date: Date;
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
    .groupBy(
      ({ date }) => `${MONTHS[date.getUTCMonth()]} ${date.getFullYear()}`
    )
    .entries()
    .map(([key, values]) => {
      let val = -_.sumBy(values, "amount");

      return [key, parseFloat(val.toString()) / 100];
    })
    .fromPairs()
    .value();

  const res = JSON.stringify({ perMonth, transactions }, (_, obj) =>
    typeof obj === 'bigint' ? obj.toString() : obj
  );
  response.setHeader("Content-Type", "application/json").send(res);
};

function parseDate(input: string) {
  const [day, month, year, time] = input.split(" ");

  const date = new Date(0);
  date.setFullYear(parseInt(year), MONTHS.indexOf(month), parseInt(day));
  const [hour, minute] = time.split(":").map((i) => parseInt(i));
  date.setHours(hour, minute);

  return date;
}

function money(obj: string): BigInt | undefined {
  return obj ? BigInt(obj.replace("$", "").replace(".", "")) : undefined;
}
