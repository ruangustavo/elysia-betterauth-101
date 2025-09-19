import Database from "bun:sqlite";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
	database: new Database("users.db"),
	emailAndPassword: {
		enabled: true,
	},
});
