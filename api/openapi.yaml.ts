import { VercelRequest, VercelResponse } from "@vercel/node";
import { readFileSync } from "fs";

export default async (request: VercelRequest, response: VercelResponse) => {
  response.status(200).json(readFileSync(__dirname + "/openapi.yaml").toString());
};
