const { readFile, writeFile, stat, mkdir } = require("node:fs/promises");
const { dirname } = require("node:path");
const { RenderPrivateApi } = require("./lib/render-private-api");
const { createCronRuns } = require("./lib/cron");

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

function formatMinutes (ms) {
  const minutes = ms / 1000 / 60;
  return minutes.toFixed(2);
}

function formatMinutesHumane (ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString(10).padStart(2, "0")}s`;
}

function timeBar(ms, totalSize, maxValue = 30 * 60 * 1000, threshold = 10 * 60 * 1000) {
  if (!ms) return "";

  const thresholdIndex = Math.floor(totalSize * threshold / maxValue);
  const barSize = Math.min(totalSize * ms / maxValue, totalSize);
  let bar = "/".repeat(Math.min(barSize, thresholdIndex));
  if (barSize > thresholdIndex) {
    bar += "#".repeat(barSize - thresholdIndex);
  }
  return bar.padEnd(totalSize);
}

function padAlign(text, size, alignment) {
  if (alignment === "right") {
    return text.padStart(size);
  } else {
    return text.padEnd(size);
  }
}

function formatTable(fields, rows) {
  const baseDefinition = { name: "", width: 10, align: "left" };
  const fieldDefinitions = fields.map((field, index) => {
    let definition;
    if (typeof field === "string") {
      definition = { ...baseDefinition, name: field };
    } else {
      definition = { ...baseDefinition, ...field };
    }
    if (!field.width && Array.isArray(rows)) {
      definition.width = Math.max(
        10,
        definition.name.length,
        ...rows.map(r => (r[index]?.toString() ?? "").length)
      );
    }
    return definition;
  });

  const formattedRows = [
    `| ${fieldDefinitions.map(f => padAlign(f.name, f.width, f.align)).join(" | ")} |`,
    `| ${fieldDefinitions.map(f => "-".repeat(f.width)).join(" | ")} |`,
  ];

  for (const row of rows) {
    const formatted = row.map((cell, index) => {
      const text = cell?.toString() ?? "";
      const field = fieldDefinitions[index];
      return padAlign(text, field.width, field.align);
    });
    formattedRows.push(`| ${formatted.join(" | ")} |`);
  }

  return formattedRows.join("\n");
}

/**
 * @param {ReturnType<createCronRuns>} runs
 */
function logRuns(runs) {
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
  const serviceId = args[0];
  const fromTime = new Date(Date.now() - 21 * DAY).toISOString();

  console.error("Getting metrics for services:", serviceId);
  console.error(`Since ${fromTime}`);

  const { events, logs } = await getCachedData(serviceId, 30 * MINUTE, async () => {
    const privateApi = RenderPrivateApi.fromEnv();

    console.error("Querying events and logs...");
    const [events, logs] = await Promise.all([
      privateApi.getEvents(serviceId, fromTime),
      privateApi.getLogs(serviceId),
    ]);

    return { events, logs };
  });

  const runs = await createCronRuns(events, logs);
  logRuns(runs);
  // console.log(JSON.stringify(runs, null, 2));
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
