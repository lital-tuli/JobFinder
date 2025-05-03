import morgan from "morgan";
import chalk from "chalk";

const currentTime = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: String(now.getMonth() + 1).padStart(2, "0"),
    day: String(now.getDate()).padStart(2, "0"),
    hours: String(now.getHours()).padStart(2, "0"),
    minutes: String(now.getMinutes()).padStart(2, "0"),
    seconds: String(now.getSeconds()).padStart(2, "0"),
  };
};

const morganLogger = morgan(function (tokens, req, res) {
  const { year, month, day, hours, minutes, seconds } = currentTime();
  let message = [
    `[${year}/${month}/${day} ${hours}:${minutes}:${seconds}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    "-",
    tokens["response-time"](req, res),
    "ms",
  ].join(" ");

  if (res.statusCode >= 400) return chalk.redBright(message);
  else return chalk.cyanBright(message);
});

export default morganLogger;