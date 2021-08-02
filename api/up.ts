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

async function get<T>(url: string): Promise<T> {
  return (
    await Axios.get<T>(url, {
      headers: { Authorization: "Bearer " + process.env.UP_TOKEN },
    })
  ).data;
}

interface TransactionResponse {
  data: Transaction[];
  links: { next: string | null; prev: string | null };
}

export default async (request: VercelRequest, response: VercelResponse) => {
  let data = await get<TransactionResponse>(
    "https://api.up.com.au/api/v1/transactions"
  );
  let transactions = data.data;
  transactions.push(...(await get<TransactionResponse>(data.links.next)).data);

  response.json(
    transactions.filter(
      (trans) =>
        trans.attributes.amount.valueInBaseUnits > 0 && trans.attributes.rawText
    )
  );
};
