import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env } from "../env";

const sqlite = new Database(env.DB_FILE_NAME);
export const db = drizzle({ client: sqlite, casing: "snake_case" });
