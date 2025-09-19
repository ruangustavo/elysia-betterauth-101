import type { Role } from "../db/schemas/users";

export const rolePermissions: Record<Role, { watch: string[] }> = {
	watchmaker: { watch: ["listAll", "markRepaired"] },
	costumer: { watch: ["readOwn"] },
};
