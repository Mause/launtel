import Axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";

interface Amount {
  valueInBaseUnits: number;
}

interface Transaction {
  attributes: {
    amount: Amount;
    rawText: string | null;
  };
}

export default async (request: VercelRequest, response: VercelResponse) => {
  let transactions = (
    await Axios.get<{
      data: Transaction[];
      links: { next: string | null; prev: string | null };
    }>("https://api.up.com.au/api/v1/transactions", {
      headers: { Authorization: "Bearer " + process.env.UP_TOKEN },
    })
  ).data.data;

  response.json(
    transactions.filter(
      (trans) =>
        trans.attributes.amount.valueInBaseUnits > 0 && trans.attributes.rawText
    )
  );
};
