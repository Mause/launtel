import Axios from "axios";
import { Tabletojson } from "tabletojson";
import { VercelRequest, VercelResponse, VercelApiHandler } from "@vercel/node";
import { CookieJar } from "tough-cookie";
import { URLSearchParams } from "url";
import axiosCookieJarSupport from "axios-cookiejar-support";
import joi from "joi";

const config = joi
  .object({ LAUNTEL_EMAIL: joi.string(), LAUNTEL_PASSWORD: joi.string() })
  .validate(process.env).value;

async function getCookie() {
  const session = Axios.create({
    baseURL: "https://residential.launtel.net.au",
    withCredentials: true,
  });
  axiosCookieJarSupport(session);
  session.defaults.jar = new CookieJar();

  const form_data = new URLSearchParams();
  form_data.append("username", config.value.LAUNTEL_EMAIL);
  form_data.append("password", config.value.LAUNTEL_PASSWORD);

  const res = await session.post("/login", form_data, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (res.config.url?.includes("login")) {
    throw new Error("login failed");
  }

  return session;
}

const thing: VercelApiHandler = async (
  request: VercelRequest,
  response: VercelResponse
) => {
  const session = await getCookie();

  const transactions = await session.get("/transactions");

  response.json({
    transactions: Tabletojson.convert(transactions.data, {})[0],
  });
};

export default thing;
