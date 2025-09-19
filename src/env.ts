import { z } from "zod/v4";

const envSchema = z.object({
	DB_FILE_NAME: z.string(),
});

export const env = envSchema.parse(process.env);
