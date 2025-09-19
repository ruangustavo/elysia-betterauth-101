import { and, eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod/v4";
import { db } from "../db";
import { watches as watchesTable } from "../db/schemas/watches";
import { requiredRole } from "../plugins/better-auth";

export const watchesCustomersRoutes = new Elysia().use(requiredRole).group(
	"/customers",
	{
		requiredRole: "customer",
	},
	(app) =>
		app
			.get("/watches", async ({ user }) => {
				const watches = await db
					.select({ id: watchesTable.id, name: watchesTable.name })
					.from(watchesTable)
					.where(eq(watchesTable.userId, user.id));
				return watches;
			})
			.post(
				"/watches",
				async ({ user, status, body: { name } }) => {
					const [createdWatch] = await db
						.insert(watchesTable)
						.values({
							name,
							userId: user.id,
						})
						.returning();
					return status("Created", createdWatch);
				},
				{
					body: z.object({
						name: z.string().min(1),
					}),
				},
			),
);

export const watchesWatchmakersRoutes = new Elysia().use(requiredRole).group(
	"/watchmakers",
	{
		requiredRole: "watchmaker",
	},
	(app) =>
		app
			.get("/watches", async ({ user }) => {
				const watches = await db
					.select({
						id: watchesTable.id,
						name: watchesTable.name,
						repairStatus: watchesTable.repairStatus,
					})
					.from(watchesTable)
					.where(eq(watchesTable.userId, user.id));
				return watches;
			})
			.put(
				"/watches/:watchId",
				async ({ params, user, status }) => {
					const watch = db
						.select({
							id: watchesTable.id,
							name: watchesTable.name,
							repairStatus: watchesTable.repairStatus,
						})
						.from(watchesTable)
						.where(
							and(
								eq(watchesTable.userId, user.id),
								eq(watchesTable.id, params.watchId),
							),
						)
						.get();

					if (!watch) status("Not Found");

					db.update(watchesTable)
						.set({
							repairStatus: "completed",
						})
						.run();

					status("No Content");
				},
				{
					params: z.object({
						watchId: z.string(),
					}),
				},
			),
);
