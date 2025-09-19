import Elysia from "elysia";
import { auth } from "../auth";
import type { Role } from "../db/schemas/users";

export const betterAuth = new Elysia({
	name: "betterAuth",
})
	.mount(auth.handler)
	.macro({
		requiredRole: (expectedRole: Role | Role[]) => ({
			resolve: async ({ status, request: { headers } }) => {
				const session = await auth.api.getSession({ headers });
				if (!session) return status("Unauthorized");

				const role = session.user?.role;

				const roles = Array.isArray(expectedRole)
					? expectedRole
					: [expectedRole];

				if (!roles.includes(role as Role)) {
					return status("Forbidden");
				}

				return session;
			},
		}),
	});
