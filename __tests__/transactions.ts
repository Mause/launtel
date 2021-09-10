import { createServer } from "vercel-node-server";
import listen from "test-listen";
import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { Server } from "net";
import moxios from "moxios";
import { sign } from "jsonwebtoken";

let server: Server;
let url: string;
let instance: AxiosInstance;

const SECRET = "SECRET";
process.env.JWT_SECRET = SECRET;

beforeAll(async () => {
  jest.mock("../support/axios");
  const axios = require("../support/axios");
  axios.default.create = (config?: AxiosRequestConfig) => {
    instance = Axios.create(config);
    moxios.install(instance);
    return instance;
  };

  const routeUnderTest = require("../api/transactions");
  server = createServer(routeUnderTest.default);
  url = await listen(server);
});

afterAll(() => {
  server.close();
  moxios.uninstall(instance);
});

it("should return the expected response", async () => {
  moxios.stubOnce("POST", /login/, {
    response: "",
    status: 307,
    statusText: "Redirect",
    headers: {
      location: "https://fake/redirected",
    },
  });
  moxios.stubOnce("POST", /redirected/, {
    status: 200,
    response: "",
    headers: {
      "set-cookie": "hello=world",
    },
  });
  moxios.stubOnce("GET", /.*/, {
    status: 200,
    statusText: "Ok",
    headers: {},
    response: `
    <div>
      <table>
        <thead>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th/>
          <th>Balance</th>
        </thead>
        <tbody>
          <tr>
            day, month, year, time
            <td>1 January 2021 11:00</td>
            <td>Debit</td>
            <td>-1.99</td>
            <td/>
            <td>20.00</td>
          </tr>
        </tbody>
      </table>
    </div>
      `,
  });
  const response = await Axios.get(url, {
    headers: {
      Authorization: "Bearer " + sign({ aud: "authenticated" }, SECRET),
    },
  });
  expect(response.status).toBe(200);
  expect(response.data).toMatchSnapshot();
});
