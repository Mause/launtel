import Axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";
import authenticate from "../support/auth";

interface Amount {
  valueInBaseUnits: number;
}

interface Transaction {
  attributes: {
    amount: Amount;
    rawText: string | null;
  };
}

export const axios = Axios.create({
  headers: { Authorization: "Bearer " + process.env.UP_TOKEN },
});

async function get<T>(url: string): Promise<T> {
  return (await axios.get<T>(url)).data;
}

interface TransactionResponse {
  data: Transaction[];
  links: { next: string | null; prev: string | null };
}

export default authenticate(
  async (request: VercelRequest, response: VercelResponse) => {
    let url = "https://api.up.com.au/api/v1/transactions";
    const transactions = [];
    let i = 10;

    while (i > 0) {
      console.log(i);
      let res = await get<TransactionResponse>(url);
      transactions.push(...res.data);
      url = res.links.next!;
      i--;
    }

    response.status(200);
    response.json(
      transactions.filter(
        (trans) =>
          trans.attributes.amount.valueInBaseUnits > 0 &&
          trans.attributes.rawText
      )
    );
  }
);
