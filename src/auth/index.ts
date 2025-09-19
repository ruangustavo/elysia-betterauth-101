import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, createAuthMiddleware, openAPI } from "better-auth/plugins";
import { db } from "../db";
import schema from "../db/schemas";

// For some reason stacktraces isn't displayed in betterAuth (prob a skill issue, I'm gonna research it better later)
// This is after server generated a response and before to send it to the client
const logStacktraceAfter = createAuthMiddleware(async (ctx) => {
	const result = ctx.context.returned;
	if (result instanceof Error) {
		console.error(result.stack ?? result);
	}
});

export const auth = betterAuth({
	basePath: "/auth",
	database: drizzleAdapter(db, { provider: "sqlite", usePlural: true, schema }),
	hooks: {
		after: logStacktraceAfter,
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes (btw, this is the default value, I've rewrited this to improve readability)
		},
	},
	advanced: {
		database: {
			generateId: false,
		},
	},
	plugins: [
		openAPI(),
		admin({
			defaultRole: "customer",
		}),
	],
});

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>;
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema());

export const OpenAPI = {
	getPaths: (prefix = "/auth/api") =>
		getSchema().then(({ paths }) => {
			const reference: typeof paths = Object.create(null);

			for (const path of Object.keys(paths)) {
				const key = prefix + path;
				reference[key] = paths[path];

				for (const method of Object.keys(paths[path])) {
					const operation = (reference[key] as any)[method];

					operation.tags = ["Better Auth"];
				}
			}

			return reference;
		}) as Promise<any>,
	components: getSchema().then(({ components }) => components) as Promise<any>,
} as const;
