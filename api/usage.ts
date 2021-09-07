import { VercelRequest, VercelResponse } from "@vercel/node";
import { getCookie as getSession } from "./transactions";
import authenticate from "../support/auth";
import { IsNotEmptyObject } from "class-validator";

type Usage = { [key: string]: string };

class UsageResponse {
  @IsNotEmptyObject()
  public usage: Usage;
  constructor(usage: Usage) {
    this.usage = usage;
  }
}
export const responseShape = UsageResponse.name;

export default authenticate(
  async (request: VercelRequest, response: VercelResponse) => {
    const date = new Date();

    const session = await getSession();

    response.json(
      new UsageResponse(
        (
          await session.get(
            `/day-usage?date=${date.getFullYear()}-${date.getUTCMonth()}-${date.getDay()}`
          )
        ).data
      )
    );
  }
);
