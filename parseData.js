const fs = require("fs");
const path = require("path");
const Table = require("cli-table");

const args = process.argv.splice(2);
const absolutePath = path.resolve(args[0]);
const data = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));

main();

function main() {
  if (args.includes("--apps-per-count")) {
    getAppCountsPerEventCount();
  } else if (args.includes("--app-info")) {
    getAppInfo();
  }
}

function drawTable(head, values) {
  const table = new Table({
    head
  });

  values.forEach(value => table.push(value));

  console.log(table.toString());
}

function getAppCountsPerEventCount() {
  const headers = ["Unique count", "Total Apps", "Percent of total"];
  const total = data.length;
  const uniqueCounts = new Set(data.map(event => event.COUNT));
  const values = [];

  uniqueCounts.forEach(uniqueCount => {
    const filteredData = data.filter(event => event.COUNT === uniqueCount);
    const totalAppsAtCount = filteredData.length;
    const percent = Number(totalAppsAtCount / total).toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 2
    });
    values.push([uniqueCount, totalAppsAtCount, percent]);
  });

  drawTable(headers, values);
}

function getAppInfo() {
  const headers = [
    "AppId",
    "Event Counts",
    "Highest Discrepency",
    "Lowest Discrepency"
  ];
  const uniqueAppIds = getUniqueAppIds(data.map(event => event.appId));
  const report = uniqueAppIds.map(appId => {
    let eventCounts = 0;
    let highestDiscrepency = 0;
    let lowestDiscrepency = null;

    data.forEach(event => {
      if (event.appId !== appId) {
        return;
      }

      if (event.appId === appId) {
        eventCounts += event.COUNT;
      }

      const { remoteCount, localCount } = event;

      if (remoteCount && localCount) {
        const discrepency = Math.abs(remoteCount - localCount);

        if (discrepency > highestDiscrepency) {
          highestDiscrepency = discrepency;
        }

        if (lowestDiscrepency === null) {
          // set initial low
          lowestDiscrepency = discrepency;
        } else if (discrepency < lowestDiscrepency) {
          lowestDiscrepency = discrepency;
        }
      }
    });

    return [appId, eventCounts, highestDiscrepency, lowestDiscrepency];
  });

  drawTable(headers, report);
}

function getUniqueAppIds(appIds) {
  const uniqueAppIds = new Set(appIds);

  return Array.from(uniqueAppIds);
}
