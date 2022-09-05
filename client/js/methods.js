require("dotenv").config();
const { sessionFileName, description } = require("./data");
const fs = require("fs").promises;
const Table = require("cli-table");
const URL_BASE = process.env.SERVER;
const axios = require("axios");

module.exports = {
  deleteSessionFile() {
    return fs.unlink(`${sessionFileName}.txt`);
  },
  async updateSessionFile(sessionId) {
    await this.deleteSessionFile;
    await fs.writeFile(`${sessionFileName}.txt`, sessionId, "utf-8");
  },
  getSessionId() {
    return fs.readFile(`${sessionFileName}.txt`, "utf-8");
  },
  async send(method, pathname, body) {
    const res = await axios[method](`${URL_BASE}/${pathname}`, body);
    return res.data;
  },
  async sendWithSession(method, pathname, body = {}) {
    const sessionId = await this.getSessionId();
    return this.send(method, `${pathname}/?sessionId=${sessionId}`, body);
  },
  table: new Table({ head: ["ID", "Task", "Time"], colWidths: [40, 40, 20] }),
  showTable(res) {
    const arr = res.map((item) => [
      item._id,
      item.description + ` ${item.isActive || description === "old" ? "" : "(stopped)"}`,
      this.formatTime(!item.isActive ? item.duration : item.progress),
    ]);
    arr.forEach((item) => this.table.push(item));
    console.log(this.table.toString());
  },
  formatTime(ts) {
    const hours = Math.floor(ts / 1000 / 60 / 60);
    const minuts = Math.floor(ts / 1000 / 60);
    const seconds = Math.floor(ts / 1000);

    const timeString = (number) => (number > 0 ? (number < 10 ? "0" + number : String(number)) + ":" : "00:");

    const hoursString = timeString(hours);
    const minutsString = timeString(minuts - hours * 60);
    const secondsString = timeString(seconds - minuts * 60);
    return hoursString + minutsString + secondsString.slice(0, -1);
  },
};
