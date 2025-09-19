import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { z } from "zod/v4";
import { db } from "../db";
import { watches as watchesTable } from "../db/schemas/watches";
import { betterAuth } from "../plugins/better-auth";

export const watchesRoutes = new Elysia()
	.use(betterAuth)
	.get(
		"/watches",
		async ({ user }) => {
			const watches = await db
				.select({ id: watchesTable.id, name: watchesTable.name })
				.from(watchesTable)
				.where(eq(watchesTable.userId, user.id));
			return watches;
		},
		{
			requiredRole: "costumer",
		},
	)
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
			requiredRole: "costumer",
			body: z.object({
				name: z.string().min(1),
			}),
		},
	);
