const methods = require("./methods");
const { description } = require("./data");
const kleur = require("kleur");

const { Enter, Try } = require("./class");

const login = async () => {
  new Enter("Logged in successfully!").go;
};

const signup = async () => {
  new Enter("Signed up successfully!").go;
};

const logout = async () => {
  new Try(
    (async () => {
      await methods.sendWithSession("get", "logout");
      await methods.deleteSessionFile();
      console.log("Logged out successfully!");
    })()
  ).go;
};

const start = async () => {
  new Try(
    (async () => {
      if (!description) {
        console.log(
          `To start the timer you must input its name as 3rd argument. \nLike: ${kleur.green(
            `"node index status 'First timer'"`
          )} `
        );
      } else {
        const { id } = await methods.sendWithSession("post", "api/timers", { description });
        console.log(`Started timer "${description}", ID: ${id}.`);
      }
    })()
  ).go;
};

const stop = async () => {
  try {
    const res = methods.sendWithSession("post", `api/timers/${description}/stop`);
    if (res) console.log(`Timer ${description} stopped`);
  } catch (err) {
    console.log(`Unknown timer ID ${description}.`);
  }
};

module.exports = {
  login,
  signup,
  logout,
  start,
  status: require("./status"),
  stop,
};
