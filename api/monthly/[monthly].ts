import { getCookie } from "../transactions";
import AxiosStatic, { AxiosResponse } from "axios";
import { Tabletojson } from "tabletojson";
import { IsNumber } from "class-validator";
import { VercelRequest, VercelResponse } from "@vercel/node";
import { log } from "../../support/log";
import { toFinite, round, last } from "lodash";
import wrap from "../../support/auth";

class Shape {
  @IsNumber()
  amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }
}

interface Row {
  Qty: string;
  Price: string;
  Total: string;
  "Statement & Payments": string;
}
const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const NUMBER_OF_PEOPLE = 4;
export const responseShape = Shape.name;

export default wrap(async (request: VercelRequest, res: VercelResponse) => {
  const monthly = request.query.monthly;
  if (
    !(monthly && typeof monthly == "string" && /^\d{4}-\d{2}$/.exec(monthly))
  ) {
    return res.json({ error: "bad month format, try something like 2020-01" });
  }

  const session = await getCookie();

  let axiosRes: AxiosResponse<string>;
  try {
    log.info("Getting invoice");
    axiosRes = await session.get(
      `https://residential.launtel.net.au/invoice/${monthly}`,
      {
        timeout: 500,
        timeoutErrorMessage: "Couldn't reach launtel",
      }
    );
    log.info("Got invoice");
  } catch (e) {
    let message;
    if (AxiosStatic.isAxiosError(e)) {
      if (e.response?.status == 500) {
        message = "upstream server error";
      } else {
        message = e.message;
      }
    } else {
      message = (e as Error).message;
    }
    return res.json({ message });
  }

  const header = Tabletojson.convert(axiosRes!.data, {
    id: ["header"],
  })[0] as string[][];

  const [invoiceNumber, , startDate, endDate] = header[0][3]
    .split("\n")
    .map(value);

  const invlines = Tabletojson.convert(axiosRes!.data, {
    id: ["invlines"],
  })[0] as Row[];

  const row = invlines.find(
    (row) =>
      row.Total && !(row["Qty"] || row["Price"] || row["Statement & Payments"])
  );

  const issueDate = value((last(header) || [])[0]);

  const total = toFinite(value(row?.Total)?.slice(1));
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const daysInMonth = daysBetween(end, start);

  res.json({
    total,
    totalPerPerson: round(total / NUMBER_OF_PEOPLE, 2),
    invoiceNumber,
    startDate: start,
    endDate: end,
    daysInMonth,
    dailyCost: round(total / daysInMonth, 2),
    dailyCostPerPerson: round(total / NUMBER_OF_PEOPLE / daysInMonth, 2),
    issueDate: parseDate(issueDate),
  });
});

function daysBetween(end: Date, st: Date): number {
  return (end.getTime() - st.getTime()) / MILLISECONDS_IN_DAY;
}

function parseDate(dt: string | undefined): Date {
  return new Date(Date.parse(dt!));
}

function value(row: string | undefined): string | undefined {
  return row?.trim().split(": ")[1];
}
