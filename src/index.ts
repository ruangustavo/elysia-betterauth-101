import { openapi } from "@elysiajs/openapi";
import { fromTypes } from "@elysiajs/openapi/gen";
import { Elysia } from "elysia";
import z, { toJSONSchema } from "zod/v4";
import { auth } from "./auth";
import { cors } from "./plugins/cors";
import { userRepository } from "./user.repository";

const app = new Elysia()
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
		}),
	)
	.get("/users", async () => {
		const users = await userRepository.findAll();
		return users;
	})
	.mount(auth.handler)
	.get(
		"/users/:id",
		async ({ params, status }) => {
			const user = await userRepository.findById(params.id);
			if (!user)
				return status("Not Found", {
					success: false,
					message: "User with this id not found",
				});
			return user;
		},
		{
			params: z.object({
				id: z.coerce.number(),
			}),
		},
	)
	.post(
		"/users",
		async ({ body, status }) => {
			if (await userRepository.findByEmail(body.email)) {
				return status("Bad Request", {
					success: false,
					message: "User with this e-mail already exists",
				});
			}

			await userRepository.create({
				name: body.name,
				email: body.email,
				age: body.age,
			});

			return status("Created");
		},
		{
			body: z.object({
				name: z.string().min(1),
				email: z.email(),
				age: z.number().min(1).optional(),
			}),
		},
	)
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
