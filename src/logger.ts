import * as fs from 'node:fs';

class Logger {
  logFile: any;
  
  constructor() {
    this.logFile = fs.createWriteStream(`helix-snippets-ls-${new Date().toISOString()}.log`, { flags: 'a' });
  }

  log(msg: string) {
    const message = `${this.getTimeStamp()}: ${msg}`;
    this.logFile.write(message + '\n');
  }

  info(msg: string) {
    const message = `${this.getTimeStamp()}: ${msg}`;
    this.logFile.write(message + '\n');
  }

  warning(msg: string) {
    const message = `${this.getTimeStamp()}: ${msg}`;
    this.logFile.write(message + '\n');
  }

  success(msg: string) {
    const message = `${this.getTimeStamp()}: ${msg}`;
    this.logFile.write(message + '\n');
  }

  error(msg: string) {
    const message = `${this.getTimeStamp()}: ${msg}`;
    this.logFile.write(message + '\n');
  }

  getTimeStamp() {
    const timestamp = new Date().toLocaleString();
    const [, time] = timestamp.split(',');
    return time.trim();
  }
}

export default Logger;
