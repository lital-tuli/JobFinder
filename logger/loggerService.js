import morganLogger from "./loggers/morganLogger.js";
import config from "config";

const logger = config.get("LOGGER");

const loggerMiddleware = () => {
  if (logger === "morgan") {
    return morganLogger;
  }
  return (req, res, next) => next();
};

export { loggerMiddleware };