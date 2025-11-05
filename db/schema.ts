import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

/**
 * Employees table schema
 * This table stores employee information for latency testing
 */
export const employees = pgTable("employees", {
  id: serial("emp_no").primaryKey(),
  first_name: varchar("first_name", { length: 256 }),
  last_name: varchar("last_name", { length: 256 }),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
