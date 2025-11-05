import type { NextApiRequest, NextApiResponse } from "next";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const start = Date.now();
// Create pool at module level to reuse connections across warm invocations (fluid compute)
// This is crucial for TCP to demonstrate connection reuse benefits
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL! });
attachDatabasePool(pool);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { count } = req.query;

  const time = Date.now();

  let data = null;
  for (let i = 0; i < toNumber(count); i++) {
    const result = await pool.query(
      `SELECT "emp_no", "first_name", "last_name" 
       FROM "employees" 
       LIMIT 10`,
    );
    data = result.rows;
  }

  // Don't end the pool - keep connections alive for reuse

  return res.status(200).json({
    data,
    queryDuration: Date.now() - time,
    invocationIsCold: start === time,
  });
}

// convert a query parameter to a number, applying a min and max, defaulting to 1
function toNumber(queryParam: string | string[] | null, min = 1, max = 5) {
  const num = Number(queryParam);
  return Number.isNaN(num) ? 1 : Math.min(Math.max(num, min), max);
}
