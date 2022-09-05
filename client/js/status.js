const methods = require("./methods");
const { description } = require("./data");

const status = async () => {
  if (description) {
    const getData = (type) => methods.sendWithSession("get", "api/timers", { params: { isActive: type } });
    if (description === "old") {
      const arr = await getData("false");
      if (arr.length === 0) return console.log(`You have no old tomers.`);
      methods.showTable(arr);
    } else {
      const resActive = await getData("true");
      const resOld = await getData("false");
      const arr = [resActive, resOld].reduce((arr, item) => {
        item.forEach((timer) => (timer._id === description ? arr.push(timer) : 1));
        return arr;
      }, []);

      if (arr.length === 0) return console.log(`Unknown timer ID ${description}.`);
      methods.showTable(arr);
    }
  } else {
    const res = await methods.sendWithSession("get", "api/timers", { params: { isActive: "true" } });
    if (!res.length) return console.log("You have no active timers.");
    methods.showTable(res);
  }
};

module.exports = status;
