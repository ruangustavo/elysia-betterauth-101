import { openapi } from "@elysiajs/openapi";
import { fromTypes } from "@elysiajs/openapi/gen";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { toJSONSchema, z } from "zod/v4";
import { auth, OpenAPI } from "./auth";
import { db } from "./db";
import { watches as watchesTable } from "./db/schemas/watches";
import { betterAuth } from "./plugins/better-auth";
import { cors } from "./plugins/cors";

const app = new Elysia()
	.use(betterAuth)
	.use(cors)
	.use(
		openapi({
			references: fromTypes(
				process.env.NODE_ENV === "production"
					? "dist/index.d.ts"
					: "src/index.ts",
			),
			mapJsonSchema: {
				zod: toJSONSchema,
			},
			documentation: {
				components: await OpenAPI.components,
				paths: await OpenAPI.getPaths("/auth"),
			},
		}),
	)
	.mount(auth.handler)
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
			auth: true,
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
			auth: true,
			body: z.object({
				name: z.string().min(1),
			}),
		},
	)
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
