import chalk from "chalk";

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Current timestamp for logs
  getTimestamp() {
    const now = new Date();
    return `[${now.toISOString()}]`;
  }

  // Format log message
  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    let formattedMessage = `${timestamp} [${level}] ${message}`;
    
    if (data) {
      formattedMessage += ` ${JSON.stringify(data)}`;
    }
    
    return formattedMessage;
  }

  // Info level logging (replaces most console.log)
  info(message, data = null) {
    console.log(chalk.blue(this.formatMessage('INFO', message, data)));
  }

  // Success level logging
  success(message, data = null) {
    console.log(chalk.green(this.formatMessage('SUCCESS', message, data)));
  }

  // Warning level logging
  warn(message, data = null) {
    console.log(chalk.yellow(this.formatMessage('WARN', message, data)));
  }

  // Error level logging (replaces console.error)
  error(message, error = null) {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined,
      code: error.code,
      status: error.status
    } : null;

    console.error(chalk.red(this.formatMessage('ERROR', message, errorData)));
  }

  // Debug level logging (only in development)
  debug(message, data = null) {
    if (this.isDevelopment) {
      console.log(chalk.gray(this.formatMessage('DEBUG', message, data)));
    }
  }

  // Database operation logging
  db(operation, collection, data = null) {
    this.info(`DB ${operation.toUpperCase()} on ${collection}`, data);
  }

  // Authentication logging
  auth(action, userId = null, details = null) {
    this.info(`AUTH ${action.toUpperCase()}`, { userId, ...details });
  }

  // Server startup logging
  server(message, data = null) {
    this.success(`SERVER: ${message}`, data);
  }

  // Connection logging
  connection(message, data = null) {
    this.info(`CONNECTION: ${message}`, data);
  }
}

// Create singleton instance
const logger = new Logger();

export default logger;