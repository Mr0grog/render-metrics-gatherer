const { Readable } = require("node:stream");
const { queryServiceEvents, queryServiceLogs } = require("./queries");

class RenderPrivateApi {
  #graphQlUrl = "https://api.render.com/graphql";
  #sessionToken = null;

  static fromEnv () {
    return new RenderPrivateApi(process.env.RENDER_SESSION_TOKEN);
  }

  constructor (sessionToken) {
    if (!sessionToken) {
      throw new TypeError("You must specify a Render session token");
    }
    this.#sessionToken = sessionToken;
  }

  async queryGraphQl(operationName, query, variables) {
    const response = await fetch(this.#graphQlUrl, {
      "body": JSON.stringify({ operationName, variables, query }),
      "cache": "default",
      "credentials": "include",
      "headers": {
          "Authorization": `Bearer ${this.#sessionToken}`,
          "Cache-Control": "no-cache",
          "Content-Type": "application/json",
          "Pragma": "no-cache",
      },
      "method": "POST",
      "mode": "cors",
      "redirect": "follow",
    });
    
    if (!response.headers.get("Content-Type")?.startsWith("application/json")) {
      const text = await response.text();
      throw new Error(`Render GraphQL error (status ${response.status}): ${text}`);
    }

    const results = await response.json();
    // TODO: check for errors

    const data = results?.data?.[operationName];
    if (data) {
      return data;
    } else {
      console.warn(`Couldn't find results for ${operationName} in returned data`);
      return results;
    }
  }

  async getLogs(serviceId) {
    return this.queryGraphQl("serviceLogs", queryServiceLogs, { serviceId });
  }

  // __typename: 'CronJobRunStarted' | 'CronJobRunEnded' | 'ServiceSuspended' | 'SuspenderAdded' | 'ServiceResumed' | 'SuspenderRemoved' | 'BuildStarted' | 'BuildEnded'
  // status: 1 (ok) | 2 (error) | 3 (canceled)
  // reason: object (present if error)
  async * listEvents(serviceId, fromTimestamp, toTimestamp = null) {
    const limit = 100;
    let before = toTimestamp;
    while (true) {
      const variables = { serviceId, limit };
      if (before) {
        variables.before = before;
      }
      const data = await this.queryGraphQl("serviceEvents", queryServiceEvents, variables);
      if (!data.events.length) {
        return;
      }
      for (const event of data.events) {
        if (event.timestamp < fromTimestamp) {
          return;
        }
        before = event.timestamp;
        yield event;
      }
    }
  }

  async getEvents(serviceId, fromTimestamp, toTimestamp = null) {
    return Readable.from(this.listEvents(serviceId, fromTimestamp, toTimestamp)).toArray();
  }
}

module.exports = {
  RenderPrivateApi,
};
