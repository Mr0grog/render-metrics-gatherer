const { RenderPrivateApi } = require("./lib/render-private-api");
const { createCronRuns } = require("./lib/cron");

const DAY = 24 * 60 * 60 * 1000;

async function main(args) {
  const serviceId = args[0];
  const fromTime = new Date(Date.now() - 21 * DAY).toISOString();

  console.error("Getting metrics for services:", serviceId);
  console.error(`Since ${fromTime}`);

  const privateApi = RenderPrivateApi.fromEnv();

  console.error("Querying events and logs...");
  const [events, logs] = await Promise.all([
    privateApi.getEvents(serviceId, fromTime),
    privateApi.getLogs(serviceId),
  ]);

  const runs = await createCronRuns(events, logs);
  console.log(JSON.stringify(runs, null, 2));
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
