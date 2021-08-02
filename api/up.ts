import Axios from "axios";
import { VercelRequest, VercelResponse } from "@vercel/node";

export default async (request: VercelRequest, response: VercelResponse) => {
  res.json(
    await Axios.get("https://api.up.com.au/api/v1/util/ping", {
      headers: { Authorization: "Bearer " + process.env.UP_TOKEN },
    })
  );
}
