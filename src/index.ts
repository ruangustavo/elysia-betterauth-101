import { openapi } from "@elysiajs/openapi";
import { fromTypes } from "@elysiajs/openapi/gen";
import { Elysia } from "elysia";
import { toJSONSchema } from "zod/v4";
import { auth, OpenAPI } from "./auth";
import { betterAuth } from "./plugins/better-auth";
import { cors } from "./plugins/cors";
import { watchesRoutes } from "./routes/watches";

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
	.use(watchesRoutes)
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
