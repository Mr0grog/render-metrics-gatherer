const { readFile, writeFile, stat, mkdir } = require("node:fs/promises");
const { dirname } = require("node:path");
const { RenderPrivateApi } = require("./lib/render-private-api");
const { createCronRuns } = require("./lib/cron");
const {
  MINUTE,
  DAY,
  formatTable,
  formatMinutesHumane,
  timeBar,
} = require("./lib/format");

/**
 * @param {ReturnType<createCronRuns>} runs
 */
function logRunsTable(runs) {
  console.log(formatTable([
    { name: "Queued Time", width: 24 },
    // { name: "Start Time", width: 24 },
    // { name: "End Time", width: 24 },
    { name: "Start Delay", align: "right" },
    { name: "Start Delay Bar", align: "left" },
    { name: "Duration", align: "right" },
    { name: "Duration Bar", align: "left" },
    { name: "Queue Duration", align: "right" },
    { name: "Time Since Previous", align: "right" },
    "Error?"
  ], runs.map(run => [
    run.queueTime?.toISOString(),
    // run.startTime?.toISOString(),
    // run.endTime?.toISOString(),
    formatMinutesHumane(run.startDelay),
    timeBar(run.startDelay, 15, 15 * MINUTE, 1 * MINUTE),
    formatMinutesHumane(run.duration),
    timeBar(run.duration, 15, 15 * MINUTE, 5 * MINUTE),
    formatMinutesHumane(run.queueDuration),
    formatMinutesHumane(run.sinceLastRunFinished),
    run.status === 2 ? "error" : run.status === 3 ? "cancel" : ""
  ])));
}

async function getCachedData (key, expirationMs, fetchData) {
  const cachePath = `./.cache/c-${key}.json`;
  let isCached = false;
  try {
    const fileInfo = await stat(cachePath);
    isCached = Date.now() - fileInfo.mtimeMs < expirationMs;
  } catch (error) {}

  if (isCached) {
    const fileText = await readFile(cachePath, {encoding: "utf-8"});
    return JSON.parse(fileText);
  } else {
    const data = await fetchData();
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), { encoding: "utf-8" });
    return data;
  }
}

async function main(args) {
  const serviceIds = args.filter(arg => !arg.startsWith("-"));
  const pretty = args.includes("--pretty");

  let fromTime = new Date(Date.now() - 21 * DAY).toISOString();
  for (const arg of args) {
    const match = arg.match(/^--from=(\d{4}-\d\d-\d\d.*)$/);
    if (match) {
      fromTime = new Date(match[1]).toISOString();
      break;
    }
  }

  console.error("Getting metrics for services:", serviceIds);
  console.error(`Since ${fromTime}`);

  for (const serviceId of serviceIds) {
    const { events, logs } = await getCachedData(serviceId, 30 * MINUTE, async () => {
      const privateApi = RenderPrivateApi.fromEnv();

      console.error("Querying events and logs...");
      const [events, logs] = await Promise.all([
        privateApi.getEvents(serviceId, fromTime),
        privateApi.getLogs(serviceId),
      ]);

      return { events, logs };
    });

    const runs = await createCronRuns(serviceId, events, logs);
    if (pretty) {
      console.log("=".repeat(75));
      console.log(`Cron Runs for ${serviceId}\n`);
      logRunsTable(runs);
      console.log("");
    } else {
      console.log(JSON.stringify(runs, null, 2));
    }
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  main(args).catch(error => {
    if (!process.exitCode || process.exitCode < 1) {
      process.exitCode = 1;
    }
    console.error(error);
  });
}
