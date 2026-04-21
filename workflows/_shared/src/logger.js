function timestamp() {
  return new Date().toISOString();
}

export function createLogger(scope) {
  function format(level, message, extra) {
    const base = `[${timestamp()}] [${scope}] [${level}] ${message}`;
    if (extra === undefined) {
      return base;
    }
    return `${base} ${JSON.stringify(extra)}`;
  }

  return {
    info(message, extra) {
      console.log(format("INFO", message, extra));
    },
    warn(message, extra) {
      console.warn(format("WARN", message, extra));
    },
    error(message, extra) {
      console.error(format("ERROR", message, extra));
    },
  };
}
