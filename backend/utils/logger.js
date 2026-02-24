class Logger {
  constructor(name = 'App') {
    this.name = name;
  }

  _log(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? JSON.stringify(meta) : '';
    console.log(`[${timestamp}] [${level}] [${this.name}] ${message} ${metaStr}`);
  }

  info(message, meta) { this._log('INFO', message, meta); }
  warn(message, meta) { this._log('WARN', message, meta); }
  error(message, meta) { this._log('ERROR', message, meta); }
  debug(message, meta) { this._log('DEBUG', message, meta); }
  success(message, meta) { this._log('SUCCESS', message, meta); }
}

module.exports = Logger;
