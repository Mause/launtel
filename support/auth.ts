import { factory } from "vercel-jwt-auth";
import config from "./config";

export default factory(config.JWT_SECRET);
