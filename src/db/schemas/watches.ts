import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const watches = sqliteTable("watches", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
});
