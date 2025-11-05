import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "@neondatabase/serverless";

const start = Date.now();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { count } = req.query;

  const time = Date.now();

  const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL! });

  let data = null;
  for (let i = 0; i < toNumber(count); i++) {
    const result = await pool.query(
      `SELECT "emp_no", "first_name", "last_name" 
       FROM "employees" 
       LIMIT 10`,
    );
    data = result.rows;
  }

  await pool.end();

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
