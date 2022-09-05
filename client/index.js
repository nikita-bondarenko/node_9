const { command, sessionFileName } = require("./js/data");
const client = require("./js/client");
require("draftlog").into(console);
console.log("File to keep the session ID:", sessionFileName);
client[command]();
