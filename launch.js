const axios = require("axios");
const dotenv = require("dotenv");

Object.assign(process.env, dotenv.config().parsed);
const endpoint = process.argv[2];
process.env["VERCEL_DEV_ENTRYPOINT"] = `api/${endpoint}.ts`;

process.send = function ({ address, port }) {
  axios
    .get(`http://${address}:${port}/api/${endpoint}`)
    .then((res) => console.log(res.data));
};

const path =
  process.env.APPDATA +
  "/npm/node_modules/vercel/node_modules/@vercel/node/dist/dev-server.js";
console.log("launching", path);
require(path);
