import { VercelRequest, VercelResponse } from "@vercel/node";
import { getCookie as getSession } from "./transactions";
import authenticate from "../support/auth";
import { IsNotEmpty } from "class-validator";

class UsageResponse {
  @IsNotEmpty() private usage: Record<string, string>;
  constructor(usage: Record<string, string>) {
    this.usage = usage;
  }
}
export const responseShape = UsageResponse.name;

export default authenticate(async (
  request: VercelRequest,
  response: VercelResponse
) => {
  const date = new Date();

  const session = await getSession();

  return (
    await session.get(
      `/day-usage?date=${date.getFullYear()}-${date.getUTCMonth()}-${date.getDay()}`
    )
  ).data;
});
