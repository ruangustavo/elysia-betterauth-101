import Elysia from "elysia";
import { auth } from "../auth";

export const betterAuth = new Elysia().mount(auth.handler).macro({
	auth: {
		async resolve({ status, request: { headers } }) {
			const session = await auth.api.getSession({ headers });
			if (!session) return status("Unauthorized");
			return { user: session.user, session: session.session };
		},
	},
});
