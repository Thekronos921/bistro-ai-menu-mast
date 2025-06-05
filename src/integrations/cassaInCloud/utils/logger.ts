export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

export class Logger {
  private context: string;
  private static minLevel: LogLevel = LogLevel.INFO;
  
  constructor(context: string) {
    this.context = context;
  }
  
  static setLogLevel(level: LogLevel): void {
    Logger.minLevel = level;
  }
  
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }
  
  error(message: string, error?: Error, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...(error ? [error, ...args] : args));
  }
  
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < Logger.minLevel) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${LogLevel[level]}] [${this.context}]`;
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
    }
  }
}