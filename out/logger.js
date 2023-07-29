"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("node:fs");
class Logger {
    constructor() {
        this.logFile = fs.createWriteStream(`helix-snippets-ls-${new Date().toISOString()}.log`, { flags: 'a' });
    }
    log(msg) {
        const message = `${this.getTimeStamp()}: ${msg}`;
        this.logFile.write(message + '\n');
    }
    info(msg) {
        const message = `${this.getTimeStamp()}: ${msg}`;
        this.logFile.write(message + '\n');
    }
    warning(msg) {
        const message = `${this.getTimeStamp()}: ${msg}`;
        this.logFile.write(message + '\n');
    }
    success(msg) {
        const message = `${this.getTimeStamp()}: ${msg}`;
        this.logFile.write(message + '\n');
    }
    error(msg) {
        const message = `${this.getTimeStamp()}: ${msg}`;
        this.logFile.write(message + '\n');
    }
    getTimeStamp() {
        const timestamp = new Date().toLocaleString();
        const [, time] = timestamp.split(',');
        return time.trim();
    }
}
exports.default = Logger;
//# sourceMappingURL=logger.js.map