import chalk from "chalk";
import logger from "./logger.js";

const createError = (validator, error) => {
  error.message = `${validator} Error: ${error.message}`;
  error.status = error.status || 400;
  throw error;
};

const handleError = (res, status, message = "") => {
  logger.error(`HTTP ${status}: ${message}`);
  return res.status(status).send(message);
};

export { createError, handleError };