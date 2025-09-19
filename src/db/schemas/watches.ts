import { randomUUIDv7 } from "bun";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";

export const watches = sqliteTable("watches", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => randomUUIDv7()),
	name: text("name").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
});
