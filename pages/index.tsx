import { Button, Card, Title, AreaChart, Grid, Text } from "@tremor/react";
import { useCallback, useState } from "react";
import { Select, SelectItem } from "@tremor/react";
import Head from "next/head";
import GithubCorner from "@/components/github-corner";

const NODE_AVAILABLE = ["neon-http", "neon-ws", "neon-drizzle-http"];
const NODE_ONLY = ["neon-tcp"];

type Region = "regional" | "global" | "node";

export default function Page() {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [shouldTestGlobal, setShouldTestGlobal] = useState(true);
  const [shouldTestRegional, setShouldTestRegional] = useState(true);
  const [shouldTestNode, setShouldTestNode] = useState(true);
  const [queryCount, setQueryCount] = useState(1);
  const [sampleCount, setSampleCount] = useState(50);
  const [dataService, setDataService] = useState("");
  const [data, setData] = useState({
    regional: [],
    global: [],
    node: [],
  });

  const runTest = useCallback(
    async (dataService: string, type: Region, queryCount: number) => {
      try {
        const start = Date.now();
        const res = await fetch(
          `/api/${dataService}-${type}?count=${queryCount}`,
        );
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
    setData({ regional: [], global: [], node: [] });

    for (let i = 0; i < sampleCount; i++) {
      let regionalValue = null;
      let globalValue = null;
      let nodeValue = null;

      if (shouldTestRegional) {
        regionalValue = await runTest(dataService, "regional", queryCount);
      }

      if (shouldTestGlobal) {
        globalValue = await runTest(dataService, "global", queryCount);
      }

      if (shouldTestNode) {
        nodeValue = await runTest(dataService, "node", queryCount);
      }

      setData((data) => {
        return {
          ...data,
          regional: [...data.regional, regionalValue],
          global: [...data.global, globalValue],
          node: [...data.node, nodeValue],
        };
      });
    }

    setIsTestRunning(false);
  }, [
    runTest,
    queryCount,
    dataService,
    shouldTestGlobal,
    shouldTestRegional,
    shouldTestNode,
    sampleCount,
  ]);

  return (
    <main className="p-6 max-w-5xl flex flex-col gap-3 m-auto">
      <Head>
        <title>Vercel Functions + Database Latency</title>
        <meta
          name="description"
          content="Observe the latency querying different data services from varying compute locations using the `edge` and `node` runtimes of Vercel Functions."
        />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:image:url" content="/og.png" />
        <meta name="twitter:image" content="/og.png" />
      </Head>
      <GithubCorner url="https://github.com/vercel-labs/function-database-latency" />

      <h1 className="text-2xl font-bold">
        Vercel Functions + Database Latency
      </h1>
      <p>
        Observe the latency querying different data services from varying
        compute locations using the <Code className="text-xs">edge</Code> and{" "}
        <Code className="text-xs">node</Code> runtimes of{" "}
        <a href="https://vercel.com/docs/functions">Vercel Functions</a>. We
        built this playground to demonstrate different data access patterns and
        how they can impact latency through sequential data requests (i.e.
        waterfalls).
      </p>
      <p>
        Learn more about{" "}
        <a
          href="https://vercel.com/docs/functions"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Vercel Functions
        </a>
        {" or "}
        <a
          href="https://vercel.com/templates"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          deploy a template
        </a>
        .
      </p>
      <form className="flex flex-col gap-5 bg-gray-100 dark:bg-gray-800 p-5 my-5 rounded">
        <div className="flex flex-col gap-1">
          <p className="font-bold">Data service</p>
          <div className="py-1 inline-flex">
            <Select
              data-testid="database-dropdown"
              className="max-w-xs"
              placeholder="Select Database"
              onValueChange={(v) => {
                // Reset all checkbox values
                setShouldTestGlobal(!NODE_ONLY.includes(v));
                setShouldTestRegional(!NODE_ONLY.includes(v));
                setShouldTestNode(
                  NODE_ONLY.includes(v) || NODE_AVAILABLE.includes(v),
                );
                setDataService(v);
              }}
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
          <p className="font-bold">Location</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Vercel Functions run in Edge or Node runtimes. In Edge runtimes,
            multiple regions are supported (by default they&apos;re global, but
            it&apos;s possible to express a region preference via the{" "}
            <Code className="text-xs">region</Code> setting).
          </p>
          <p className="text-sm flex gap-3 flex-wrap gap-y-1">
            {!NODE_ONLY.includes(dataService) && (
              <label className="flex items-center gap-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  name="region"
                  value="global"
                  checked={shouldTestGlobal}
                  onChange={(e) => setShouldTestGlobal(e.target.checked)}
                />{" "}
                Global function (Edge)
              </label>
            )}
            {!NODE_ONLY.includes(dataService) && (
              <label className="flex items-center gap-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  name="region"
                  value="regional"
                  checked={shouldTestRegional}
                  onChange={(e) => setShouldTestRegional(e.target.checked)}
                />{" "}
                Regional function (Edge | US East)
              </label>
            )}
            {(NODE_AVAILABLE.includes(dataService) ||
              NODE_ONLY.includes(dataService)) && (
              <label className="flex items-center gap-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  name="node"
                  value="node"
                  checked={shouldTestNode}
                  onChange={(e) => setShouldTestNode(e.target.checked)}
                />{" "}
                Serverless function (Node | US East)
              </label>
            )}
          </p>
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
            disabled={
              dataService === "" ||
              (!shouldTestGlobal && !shouldTestRegional && !shouldTestNode)
            }
          >
            Run Test
          </Button>
          {!shouldTestGlobal && !shouldTestRegional && !shouldTestNode && (
            <p className="text-gray-600 dark:text-gray-300 text-sm ml-4">
              You need to select at least one <strong>Location</strong> to run
              the benchmark.
            </p>
          )}
        </div>

        {data.regional.length || data.global.length || data.node.length ? (
          <Grid className="gap-5" numItems={1}>
            <Card>
              <Title>Latency distribution (processing time)</Title>
              <Text>
                This is how long it takes for the function to run the queries
                and return the result. Your internet connections <b>will not</b>{" "}
                influence these results.
              </Text>

              <AreaChart
                className="mt-6"
                data={new Array(sampleCount).fill(0).map((_, i) => {
                  return {
                    attempt: `#${i + 1}`,
                    "Regional Edge": data.regional[i]
                      ? data.regional[i].queryDuration
                      : null,
                    "Global Edge": data.global[i]
                      ? data.global[i].queryDuration
                      : null,
                    "Node.js": data.node[i] ? data.node[i].queryDuration : null,
                  };
                })}
                index="attempt"
                categories={["Global Edge", "Regional Edge", "Node.js"]}
                colors={["indigo", "cyan", "purple"]}
                valueFormatter={dataFormatter}
                yAxisWidth={48}
              />
            </Card>
            <Card>
              <Title>Latency distribution (end-to-end)</Title>
              <Text>
                This is the total latency from the client&apos;s perspective. It
                considers the total roundtrip between browser and compute
                location. Your internet connection and location <b>will</b>{" "}
                influence these results.
              </Text>

              <AreaChart
                className="mt-6"
                data={new Array(sampleCount).fill(0).map((_, i) => {
                  return {
                    attempt: `#${i + 1}`,
                    "Regional Edge": data.regional[i]
                      ? data.regional[i].elapsed
                      : null,
                    "Global Edge": data.global[i]
                      ? data.global[i].elapsed
                      : null,
                    "Node.js": data.node[i] ? data.node[i].elapsed : null,
                  };
                })}
                index="attempt"
                categories={["Global Edge", "Regional Edge", "Node.js"]}
                colors={["indigo", "cyan", "purple"]}
                valueFormatter={dataFormatter}
                yAxisWidth={48}
              />
            </Card>
          </Grid>
        ) : null}
      </form>
    </main>
  );
}

const dataFormatter = (number: number) =>
  `${Intl.NumberFormat("us").format(number).toString()}ms`;

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
