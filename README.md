# Render Metrics Gatherer

This is a *very* hacky tool for gathering metrics about your services on Render.com.

Since Render doesn't publish this data via it's public API or to metrics providers, it uses the private GraphQL APIs that power the Render dashboard in your browser, and is likely to break.

I built this as a quick and dirty way to look into some problematic delays between queuing and actual execution of crons, since Render doesn't provide any useful metrics, and getting this info requires combining data from multiple sources. Similar techniques would undoubtedly be useful in getting other metrics from Render (e.g. deploy frequency, deploy successes vs. failures, service suspensions, or even just combining the metrics from multiple services in one place).

**I don’t currently have plans to expand this, but am happy to take PRs if you are interested in adding to it. Please feel free to contribute or fork if this would be useful to you!**


## CLI Usage

For now, this only gathers metrics about Cron service runs (if this is useful, it's definitely worth extending), and only runs in POSIX-style systems (if you’re on Windows, use WSL!).

1. Make sure you have Node.js 18+. If you need to have other Node.js versions for other projects, [Nodenv][] is a great tool for managing them!

2. Get your Render session token. This isn't your API key — it's an auth token tied to your browser session on the web UI. To find it:

    1. Log into the Render dashboard (https://dashboard.render.com/).
    2. Open the developer tools in your browser and view the network panel.
    3. Find any request for `/graphql` and get the token from the `Authorization` request header. The header is formatted like:
       `Authorization: Bearer <token>`.
    4. ⚠️ **This token is good for 1 week!** You'll need to refresh it regularly.

3. Get the service IDs for the services you want to check out. Right now, only crons are supported, and this only gets stats about cron *runs*, not deploys or other things.

    The easiest way to get service IDs is to browse to the service the in Render dashboard, and then pull it from the URL in your browser’s address bar. The URL will be something like: `https://dashboard.render.com/cron/<serviceId>`

2. Run the `render-cron-metrics.js` script:

    ```sh
    # Set your session token:
    export RENDER_SESSION_TOKEN='abcxyz'

    # Pretty print nice tables with metrics for two crons:
    ./render-cron-metrics.js --pretty crn-abc123 crn-xyz456

    # Outputs:
    # | Queued Time              | Start Delay | Start Delay Bar |   Duration | Duration Bar    | Queue Duration | Time Since Previous | Error?     |
    # | ------------------------ | ----------- | --------------- | ---------- | --------------- | -------------- | ------------------- | ---------- |
    # | 2022-10-05T19:48:00.843Z |      0m 16s |                 |     0m 22s |                 |         0m 38s |              7m 57s |            |
    # | 2022-10-05T17:18:00.203Z |      1m 17s | ▒               |     0m 20s |                 |         1m 38s |              8m 13s |            |
    # | 2022-10-05T17:08:00.197Z |      0m 19s |                 |     1m 26s | ▒               |         1m 46s |              5m 45s | error      |
    # | 2022-10-05T16:58:00.158Z |      2m 11s | ▒▓              |     2m 02s | ▒▒              |         4m 14s |              8m 56s |            |
    # | 2022-10-05T14:28:18.946Z |      1m 41s | ▒               |     1m 25s | ▒               |         3m 06s |              0m 00s |            |
    # | 2022-10-05T14:18:51.828Z |      6m 35s | ▒▓▓▓▓▓          |     2m 51s | ▒▒              |         9m 27s |              0m 00s |            |
    # | 2022-10-05T14:09:49.395Z |      5m 49s | ▒▓▓▓▓           |     3m 13s | ▒▒▒             |         9m 02s |             11m 12s |            |
    # | 2022-10-04T21:22:34.473Z |      1m 58s | ▒               |     1m 14s | ▒               |         3m 13s |              0m 00s |            |
    # | 2022-10-04T21:03:58.064Z |     10m 14s | ▒▓▓▓▓▓▓▓▓▓      |     8m 22s | ▒▒▒▒▒▓▓▓        |        18m 36s |              0m 00s |            |
    # | 2022-10-04T20:45:20.612Z |     10m 28s |                 |     8m 08s | ▒▒▒▒▒▓▓▓        |        18m 37s |              0m 00s | cancel     |
    # | 2022-10-04T20:32:03.392Z |     12m 07s | ▒▓▓▓▓▓▓▓▓▓▓▓    |     1m 09s | ▒               |        13m 17s |              0m 00s |            |


    # Or just print raw JSON data about each cron run:
    ./render-cron-metrics.js crn-abc123 crn-xyz456

    # Or pipe that data somewhere:
    ./render-cron-metrics.js crn-abc123 crn-xyz456 | jq '<your_query_here>' > metrics.json

    # Non-pretty output:
    # [
    #   {
    #     "serviceId": "crn-abc123",
    #     "runId": "crn-abc123-789",
    #     "sinceLastRunFinished": 271932,
    #     "duration": 8175,
    #     "queueDuration": 25246,
    #     "startDelay": 17071,
    #     "status": 1,
    #     "reason": null,
    #     "queueTime": "2022-10-05T18:53:00.168Z",
    #     "startTime": "2022-10-05T18:53:17.239Z",
    #     "endTime": "2022-10-05T18:53:25.414Z"
    #   },
    #   {
    #     "serviceId": "crn-abc123",
    #     "runId": "crn-abc123-456",
    #     // ...etc...
    #   }
    # ]
    ```


## License & Copyright

Render Metrics Gatherer is open source software. It is (c) 2022 Rob Brackett and licensed under the BSD license. The full license text is in the [`LICENSE` file](./LICENSE).
