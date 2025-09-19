import Elysia from "elysia";
import { auth } from "../auth";
import {
	type Action,
	type Resource,
	rolePermissions,
} from "../auth/permissions";
import type { Role } from "../db/schemas/users";

export const requiredRole = new Elysia({
	name: "requiredRole",
}).macro({
	requiredRole: (expectedRole: Role | Role[]) => ({
		resolve: async ({ status, request: { headers } }) => {
			const session = await auth.api.getSession({ headers });
			if (!session) return status("Unauthorized");

			const role = session.user?.role;

			const roles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];

			console.log({ roles, role });

			if (!roles.includes(role as Role)) {
				return status("Forbidden");
			}

			return session;
		},
	}),
});

export const requiredPermission = new Elysia({
	name: "requiredPermission",
}).macro({
	requiredPermission: <T extends Role>({
		resource,
		action,
	}: {
		resource: Resource;
		action: Action<T>;
	}) => ({
		async resolve({ status, request: { headers } }) {
			const session = await auth.api.getSession({ headers });
			if (!session) return status("Unauthorized");

			const role = session.user?.role;
			if (!role) return status("Unauthorized");

			const userPermissions = rolePermissions[role as Role];

			if (!userPermissions || !userPermissions[resource]) {
				return status("Forbidden");
			}

			const allowedActions = userPermissions[resource] as readonly string[];
			if (!allowedActions.includes(action as string)) {
				return status("Forbidden");
			}

			return session;
		},
	}),
});
