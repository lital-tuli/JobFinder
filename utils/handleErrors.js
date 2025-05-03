import chalk from "chalk";

const createError = (validator, error) => {
  error.message = `${validator} Error: ${error.message}`;
  error.status = error.status || 400;
  throw error;
};

const handleError = (res, status, message = "") => {
  console.log(chalk.bgYellowBright.red(message));
  return res.status(status).send(message);
};

export { createError, handleError };