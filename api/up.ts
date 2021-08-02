import Axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";

interface Amount {
  valueInBaseUnits: number;
}

interface Transaction {
  attributes: {
    amount: Amount
  }
}

export default async (request: VercelRequest, response: VercelResponse) => {
  let transactions = (
      await Axios.get<{data: Transaction[]}>("https://api.up.com.au/api/v1/transactions", {
        headers: { Authorization: "Bearer " + process.env.UP_TOKEN },
      })
    ).data.data;

  response.json(
    transactions.filter(trans => trans.attributes.amount.valueInBaseUnits > 0)    
  );
};
