const axios = require('axios');
const dotenv = require('dotenv');

Object.assign(process.env, dotenv.config().parsed);
process.env['VERCEL_DEV_ENTRYPOINT'] = 'api/transactions.ts';

process.send = function ({ address, port }) {
  axios.get(`http://${address}:${port}/api/transactions`);
};

const path =
  process.env.APPDATA +
  '/npm/node_modules/vercel/node_modules/@vercel/node/dist/dev-server.js';
console.log('launching', path);
require(path);