import { LogtailStream } from "@logtail/bunyan";
import { Logtail } from "@logtail/node";
import bunyan from "bunyan";
import config from "./config";

const streams: bunyan.Stream[] = [{ stream: process.stdout }];

if (config.LOGTAIL_SOURCE_TOKEN && false) {
  console.log("adding logtail stream");
  const logtail = new Logtail(config.LOGTAIL_SOURCE_TOKEN, {
    batchInterval: 1,
    ignoreExceptions: false,
  });
  logtail.info("Starting up...");
  streams.push({ stream: new LogtailStream(logtail), reemitErrorEvents: true });
}

export const log = bunyan.createLogger({
  name: "launtel",
  level: "debug",
  streams,
});
