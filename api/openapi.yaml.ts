import { VercelRequest, VercelResponse } from "@vercel/node";

export default async (_request: VercelRequest, response: VercelResponse) =>
  response
    .status(200)
    .send((await readFile(__dirname + "/openapi.yaml")).toString());
