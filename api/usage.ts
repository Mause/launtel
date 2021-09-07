import { VercelRequest, VercelResponse } from "@vercel/node";
import { getCookie as getSession } from "./transactions";
import authenticate from "../support/auth";
import { IsNotEmpty } from "class-validator";

class UsageResponse {
  constructor(@IsNotEmpty() private usage: Record<string, string>) {}
}

export default authenticate(
  async (request: VercelRequest, response: VercelResponse) => {
    const date = new Date();

    const session = await getSession();

    return (
      await session.get(
        `/day-usage?date=${date.getFullYear()}-${date.getUTCMonth()}-${date.getDay()}`
      )
    ).data;
  }
);
