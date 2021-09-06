import { VercelRequest, VercelResponse } from "@vercel/node";
import { getCookie as getSession } from "./transactions";
import authenticate from "../support/auth";

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
