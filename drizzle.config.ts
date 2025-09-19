import { defineConfig } from "drizzle-kit";
import { env } from "./src/env";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schemas",
	out: "./src/db/migrations",
	dbCredentials: { url: env.DB_FILE_NAME },
});
