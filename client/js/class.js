const data = require("./data");
const methods = require("./methods");
const inquirer = require("inquirer");

class Try {
  constructor(action) {
    this.action = action;
  }
  async go() {
    try {
      await this.action;
    } catch (err) {
      console.error(err);
    }
  }
}

class Enter extends Try {
  constructor(log) {
    super(action(log));
    async function action(log) {
      const body = await inquirer.prompt(data.questions);
      const { sessionId, error } = await methods.send("post", data.command, body);
      if (sessionId) {
        methods.updateSessionFile(sessionId);
        console.log(log);
      } else {
        console.error(error);
      }
    }
  }
}

module.exports = {
  Try,
  Enter,
};
