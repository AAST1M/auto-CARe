export const logger = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(...args);
    }
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.debug(...args);
    }
  }
};
