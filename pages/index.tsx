import { Button, Card, Title, AreaChart, Grid, Text } from "@tremor/react";
import { useCallback, useState } from "react";
import { Select, SelectItem } from "@tremor/react";
import Head from "next/head";

const DATA_SERVICE_NAMES = {
  "neon-tcp": "Neon pg (TCP)",
  "neon-http": "Neon HTTP",
  "neon-ws": "Neon WebSocket",
  "neon-drizzle-http": "Neon Drizzle HTTP",
};

const CHART_COLORS = [
  "purple",
  "blue",
  "cyan",
  "emerald",
  "amber",
  "rose",
  "indigo",
  "pink",
];

export default function Page() {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [queryCount, setQueryCount] = useState(1);
  const [sampleCount, setSampleCount] = useState(50);
  const [dataService, setDataService] = useState("");
  const [data, setData] = useState<Record<string, any[]>>({});
  const [isColdStart, setIsColdStart] = useState<Record<string, boolean>>({});
  const [lastParams, setLastParams] = useState({
    queryCount: 1,
    sampleCount: 50,
  });

  const runTest = useCallback(
    async (dataService: string, queryCount: number) => {
      try {
        const start = Date.now();
        const res = await fetch(`/api/${dataService}-node?count=${queryCount}`);
        const data = await res.json();
        const end = Date.now();
        return {
          ...data,
          elapsed: end - start,
        };
      } catch (e) {
        // instead of retrying we just give up
        return null;
      }
    },
    [],
  );

  const onRunTest = useCallback(async () => {
    setIsTestRunning(true);

    // Check if parameters have changed - if so, clear all data
    if (
      lastParams.queryCount !== queryCount ||
      lastParams.sampleCount !== sampleCount
    ) {
      setData({});
      setIsColdStart({});
      setLastParams({ queryCount, sampleCount });
    }

    // Clear data for this specific service if it exists (rerun scenario)
    setData((prevData) => {
      const newData = { ...prevData };
      delete newData[dataService];
      return newData;
    });

    // Run the test and collect data
    const results = [];
    let firstInvocationIsCold = false;

    for (let i = 0; i < sampleCount; i++) {
      const nodeValue = await runTest(dataService, queryCount);
      results.push(nodeValue);

      // Capture the cold start status from the first invocation
      if (i === 0 && nodeValue && nodeValue.invocationIsCold !== undefined) {
        firstInvocationIsCold = nodeValue.invocationIsCold;
        setIsColdStart((prev) => ({
          ...prev,
          [dataService]: firstInvocationIsCold,
        }));
      }

      // Update data incrementally for live feedback
      setData((prevData) => ({
        ...prevData,
        [dataService]: [...(prevData[dataService] || []), nodeValue],
      }));
    }

    setIsTestRunning(false);
  }, [runTest, queryCount, dataService, sampleCount, lastParams]);

  return (
    <main className="p-6 max-w-5xl flex flex-col gap-3 m-auto">
      <Head>
        <title>Neon Database Latency - Vercel Fluid Compute</title>
        <meta
          name="description"
          content="Observe the latency querying Neon with different connection methods from Vercel Fluid Compute"
        />
        <link rel="icon" href="/favicon.ico" />
        <meta
          property="og:title"
          content="Neon Database Latency - Vercel Fluid Compute"
        />
        <meta
          property="og:description"
          content="Observe the latency querying Neon with different connection methods from Vercel Fluid Compute"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta
          name="twitter:title"
          content="Neon Database Latency - Vercel Fluid Compute"
        />
        <meta
          name="twitter:description"
          content="Observe the latency querying Neon with different connection methods from Vercel Fluid Compute"
        />
      </Head>

      <h1 className="text-2xl font-bold">
        Neon Database Latency - Vercel Fluid Compute
      </h1>
      <p>
        Observe the latency querying Neon Serverless Postgres with different
        connection methods from Vercel Fluid Compute using the{" "}
        <Code className="text-xs">node</Code> runtime.
      </p>
      <form className="flex flex-col gap-5 bg-gray-100 dark:bg-gray-800 p-5 my-5 rounded">
        <div className="flex flex-col gap-1">
          <p className="font-bold">Data service</p>
          <div className="py-1 inline-flex">
            <Select
              data-testid="database-dropdown"
              className="max-w-xs"
              placeholder="Select Database"
              onValueChange={(v) => setDataService(v)}
            >
              <SelectItem
                data-testid="neon-tcp"
                value="neon-tcp"
                icon={NeonIcon}
              >
                Neon pg (TCP transport)
              </SelectItem>
              <SelectItem
                data-testid="neon-http"
                value="neon-http"
                icon={NeonIcon}
              >
                Neon @neondatabase/serverless (HTTP transport)
              </SelectItem>
              <SelectItem data-testid="neon-ws" value="neon-ws" icon={NeonIcon}>
                Neon @neondatabase/serverless (WebSocket transport)
              </SelectItem>
              <SelectItem
                data-testid="neon-drizzle-http"
                value="neon-drizzle-http"
                icon={NeonIcon}
              >
                Neon Drizzle (HTTP transport)
              </SelectItem>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-bold">Waterfall</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Executing complex API routes globally can be slow when the database
            is single-region, due to having multiple roundtrips to a single
            server that&apos;s distant from the user.
          </p>
          <p className="text-sm flex gap-3 flex-wrap gap-y-1">
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="queries"
                value="1"
                onChange={() => setQueryCount(1)}
                checked={queryCount === 1}
              />{" "}
              Single query (no waterfall)
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="queries"
                value="2"
                onChange={() => setQueryCount(2)}
                checked={queryCount === 2}
              />{" "}
              2 serial queries
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="queries"
                value="5"
                onChange={() => setQueryCount(5)}
                checked={queryCount === 5}
              />{" "}
              5 serial queries
            </label>
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-bold">Samples</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            The number of samples to run for each location. A larger number of
            samples provides a clearer pattern of the average latency.
          </p>
          <p className="text-sm flex gap-3 flex-wrap gap-y-1">
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="samples"
                value="50"
                onChange={() => setSampleCount(50)}
                checked={sampleCount === 50}
              />{" "}
              50
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="samples"
                value="25"
                onChange={() => setSampleCount(25)}
                checked={sampleCount === 25}
              />{" "}
              25
            </label>
            <label className="flex items-center gap-2 whitespace-nowrap">
              <input
                type="radio"
                name="samples"
                value="10"
                onChange={() => setSampleCount(10)}
                checked={sampleCount === 10}
              />{" "}
              10
            </label>
          </p>
        </div>

        <div className="flex items-center">
          <Button
            type="button"
            data-testid="run-test"
            onClick={onRunTest}
            loading={isTestRunning}
            disabled={dataService === ""}
          >
            Run Test
          </Button>
        </div>

        {Object.keys(data).length > 0 ? (
          <Grid className="gap-5" numItems={1}>
            <Card>
              <Title>Latency distribution (processing time)</Title>
              <Text>
                This is how long it takes for the function to run the queries
                and return the result. Your internet connections <b>will not</b>{" "}
                influence these results.
              </Text>
              <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Settings:{" "}
                {queryCount === 1
                  ? "Single query (no waterfall)"
                  : `${queryCount} serial queries`}{" "}
                • {sampleCount} samples
              </Text>

              <AreaChart
                className="mt-6"
                data={new Array(sampleCount).fill(0).map((_, i) => {
                  const dataPoint: any = { attempt: `#${i + 1}` };
                  Object.keys(data).forEach((service) => {
                    const serviceName = DATA_SERVICE_NAMES[service] || service;
                    dataPoint[serviceName] = data[service][i]
                      ? data[service][i].queryDuration
                      : null;
                  });
                  return dataPoint;
                })}
                index="attempt"
                categories={Object.keys(data).map(
                  (service) => DATA_SERVICE_NAMES[service] || service,
                )}
                colors={CHART_COLORS.slice(0, Object.keys(data).length)}
                valueFormatter={dataFormatter}
                yAxisWidth={48}
              />

              <div className="mt-4 flex flex-col gap-2">
                {Object.keys(data).map((service, index) => {
                  const serviceName = DATA_SERVICE_NAMES[service] || service;
                  const validData = data[service].filter(
                    (d) => d !== null && d.queryDuration,
                  );
                  const wasCold = isColdStart[service];

                  // For warm computes, include all samples in average
                  // For cold starts, show overall avg and avg after first (excluding connection overhead)
                  const avg =
                    validData.length > 0
                      ? validData.reduce((sum, d) => sum + d.queryDuration, 0) /
                        validData.length
                      : 0;
                  const avgAfterFirst =
                    validData.length > 1
                      ? validData
                          .slice(1)
                          .reduce((sum, d) => sum + d.queryDuration, 0) /
                        (validData.length - 1)
                      : avg;

                  return (
                    <div key={service} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getColorValue(CHART_COLORS[index]),
                          }}
                        />
                        <span className="text-sm">
                          {serviceName}: <strong>{avg.toFixed(2)}ms avg</strong>
                          {wasCold && validData.length > 1 && (
                            <span>
                              {" "}
                              ({avgAfterFirst.toFixed(2)}ms avg after
                              connecting)
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                        {wasCold
                          ? "• Cold start - includes connection establishment"
                          : "• Warm compute - reusing connection pool"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <Title>Latency distribution (end-to-end)</Title>
              <Text>
                This is the total latency from the client&apos;s perspective. It
                considers the total roundtrip between browser and compute
                location. Your internet connection and location <b>will</b>{" "}
                influence these results.
              </Text>
              <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Settings:{" "}
                {queryCount === 1
                  ? "Single query (no waterfall)"
                  : `${queryCount} serial queries`}{" "}
                • {sampleCount} samples
              </Text>

              <AreaChart
                className="mt-6"
                data={new Array(sampleCount).fill(0).map((_, i) => {
                  const dataPoint: any = { attempt: `#${i + 1}` };
                  Object.keys(data).forEach((service) => {
                    const serviceName = DATA_SERVICE_NAMES[service] || service;
                    dataPoint[serviceName] = data[service][i]
                      ? data[service][i].elapsed
                      : null;
                  });
                  return dataPoint;
                })}
                index="attempt"
                categories={Object.keys(data).map(
                  (service) => DATA_SERVICE_NAMES[service] || service,
                )}
                colors={CHART_COLORS.slice(0, Object.keys(data).length)}
                valueFormatter={dataFormatter}
                yAxisWidth={48}
              />

              <div className="mt-4 flex flex-col gap-2">
                {Object.keys(data).map((service, index) => {
                  const serviceName = DATA_SERVICE_NAMES[service] || service;
                  const validData = data[service].filter(
                    (d) => d !== null && d.elapsed,
                  );
                  const wasCold = isColdStart[service];

                  // For warm computes, include all samples in average
                  // For cold starts, show overall avg and avg after first (excluding connection overhead)
                  const avg =
                    validData.length > 0
                      ? validData.reduce((sum, d) => sum + d.elapsed, 0) /
                        validData.length
                      : 0;
                  const avgAfterFirst =
                    validData.length > 1
                      ? validData
                          .slice(1)
                          .reduce((sum, d) => sum + d.elapsed, 0) /
                        (validData.length - 1)
                      : avg;

                  return (
                    <div key={service} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getColorValue(CHART_COLORS[index]),
                          }}
                        />
                        <span className="text-sm">
                          {serviceName}: <strong>{avg.toFixed(2)}ms avg</strong>
                          {wasCold && validData.length > 1 && (
                            <span>
                              {" "}
                              ({avgAfterFirst.toFixed(2)}ms avg after
                              connecting)
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                        {wasCold
                          ? "• Cold start - includes connection establishment"
                          : "• Warm compute - reusing connection pool"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Grid>
        ) : null}
      </form>
    </main>
  );
}

const dataFormatter = (number: number) =>
  `${Intl.NumberFormat("us").format(number).toString()}ms`;

function getColorValue(colorName: string): string {
  const colorMap: Record<string, string> = {
    purple: "#9333ea",
    blue: "#3b82f6",
    cyan: "#06b6d4",
    emerald: "#10b981",
    amber: "#f59e0b",
    rose: "#f43f5e",
    indigo: "#6366f1",
    pink: "#ec4899",
  };
  return colorMap[colorName] || "#6366f1";
}

function Code({ className = "", children }) {
  return (
    <code
      className={`bg-gray-200 dark:bg-gray-700 text-sm p-1 rounded ${className}`}
    >
      {children}
    </code>
  );
}

function NeonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="flex-none h-5 w-5 mr-3"
      width="20"
      height="20"
      viewBox="0 0 36 36"
      fill="none"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M0 6.207A6.207 6.207 0 0 1 6.207 0h23.586A6.207 6.207 0 0 1 36 6.207v20.06c0 3.546-4.488 5.085-6.664 2.286l-6.805-8.754v10.615A5.586 5.586 0 0 1 16.945 36H6.207A6.207 6.207 0 0 1 0 29.793V6.207Zm6.207-1.241c-.686 0-1.241.555-1.241 1.24v23.587c0 .686.555 1.242 1.24 1.242h10.925c.343 0 .434-.278.434-.621V16.18c0-3.547 4.488-5.086 6.665-2.286l6.805 8.753V6.207c0-.686.064-1.241-.621-1.241H6.207Z"
        fill="rgb(186 193 205)"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M0 6.207A6.207 6.207 0 0 1 6.207 0h23.586A6.207 6.207 0 0 1 36 6.207v20.06c0 3.546-4.488 5.085-6.664 2.286l-6.805-8.754v10.615A5.586 5.586 0 0 1 16.945 36H6.207A6.207 6.207 0 0 1 0 29.793V6.207Zm6.207-1.241c-.686 0-1.241.555-1.241 1.24v23.587c0 .686.555 1.242 1.24 1.242h10.925c.343 0 .434-.278.434-.621V16.18c0-3.547 4.488-5.086 6.665-2.286l6.805 8.753V6.207c0-.686.064-1.241-.621-1.241H6.207Z"
        fill="rgb(186 193 205)"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M0 6.207A6.207 6.207 0 0 1 6.207 0h23.586A6.207 6.207 0 0 1 36 6.207v20.06c0 3.546-4.488 5.085-6.664 2.286l-6.805-8.754v10.615A5.586 5.586 0 0 1 16.945 36H6.207A6.207 6.207 0 0 1 0 29.793V6.207Zm6.207-1.241c-.686 0-1.241.555-1.241 1.24v23.587c0 .686.555 1.242 1.24 1.242h10.925c.343 0 .434-.278.434-.621V16.18c0-3.547 4.488-5.086 6.665-2.286l6.805 8.753V6.207c0-.686.064-1.241-.621-1.241H6.207Z"
        fill="rgb(186 193 205)"
      />
      <path
        d="M29.793 0A6.207 6.207 0 0 1 36 6.207v20.06c0 3.546-4.488 5.085-6.664 2.286l-6.805-8.754v10.615A5.586 5.586 0 0 1 16.945 36a.62.62 0 0 0 .62-.62v-19.2c0-3.547 4.488-5.086 6.665-2.286l6.805 8.753V1.241C31.035.556 30.479 0 29.793 0Z"
        fill="rgb(156 163 175)"
      />
    </svg>
  );
}
