import type { NextApiRequest, NextApiResponse } from "next";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { employees } from "@/db/schema";

const client = neon(process.env.NEON_DATABASE_URL!);
const db = drizzle(client);

const startupMemory: Record<string, number | undefined> = {
  "neon-drizzle-http": undefined,
};

function isWarm(id: string): boolean {
  return !!startupMemory[id];
}

function setWarm(id: string): void {
  startupMemory[id] = Date.now();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { count } = req.query;

  const connectionId = "neon-drizzle-http";
  const invocationIsCold = !isWarm(connectionId);

  const time = Date.now();

  let data = null;
  for (let i = 0; i < toNumber(count); i++) {
    data = await db.select().from(employees).limit(10);
  }

  setWarm(connectionId);

  return res.status(200).json({
    data,
    queryDuration: Date.now() - time,
    invocationIsCold,
  });
}

// convert a query parameter to a number, applying a min and max, defaulting to 1
function toNumber(queryParam: string | string[] | null, min = 1, max = 5) {
  const num = Number(queryParam);
  return Number.isNaN(num) ? 1 : Math.min(Math.max(num, min), max);
}
