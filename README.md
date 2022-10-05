# Render Metrics Gatherer

This is a *very* hacky tool for gathering metrics about your services on Render.com.

Since Render doesn't publish this data via it's public API or to metrics providers, it uses the private GraphQL APIs that power the Render dashboard in your browser, and is likely to break.


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

    # Or just print raw JSON data about each cron run:
    ./render-cron-metrics.js crn-abc123 crn-xyz456

    # Or pipe that data somewhere:
    ./render-cron-metrics.js crn-abc123 crn-xyz456 | jq '<your_query_here>' > metrics.json
    ```


## License & Copyright

Render Metrics Gatherer is open source software. It is (c) 2022 Rob Brackett and licensed under the BSD license. The full license text is in the [`LICENSE` file](./LICENSE).
