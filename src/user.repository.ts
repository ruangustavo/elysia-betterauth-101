import { Database } from "bun:sqlite";

export interface User {
	id?: number;
	name: string;
	email: string;
	age?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateUserData {
	name: string;
	email: string;
	age?: number;
}

export interface UpdateUserData {
	name?: string;
	email?: string;
	age?: number;
}

export class UserRepository {
	private db: Database;
	private readonly tableName = "users";

	constructor(databasePath: string = "users.db") {
		this.db = new Database(databasePath);
		this.initializeDatabase();
	}

	private initializeDatabase(): void {
		this.db.run("PRAGMA journal_mode = WAL;");

		const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

		this.db.run(createTableQuery);

		this.db.run(
			`CREATE INDEX IF NOT EXISTS idx_users_email ON ${this.tableName}(email);`,
		);
		this.db.run(
			`CREATE INDEX IF NOT EXISTS idx_users_name ON ${this.tableName}(name);`,
		);
	}

	async create(userData: CreateUserData): Promise<User> {
		try {
			const insertQuery = this.db.prepare(`
        INSERT INTO ${this.tableName} (name, email, age)
        VALUES (?, ?, ?)
      `);

			const result = insertQuery.run(
				userData.name,
				userData.email,
				userData.age ?? null,
			);

			const selectQuery = this.db.prepare(`
        SELECT id, name, email, age, created_at as createdAt, updated_at as updatedAt
        FROM ${this.tableName}
        WHERE id = ?
      `);

			const user = selectQuery.get(result.lastInsertRowid) as User;
			if (!user) {
				throw new Error("Failed to retrieve created user");
			}

			return user;
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("UNIQUE constraint failed")
			) {
				throw new Error("Email already exists");
			}
			throw error;
		}
	}

	async findById(id: number): Promise<User | null> {
		const query = this.db.prepare(`
      SELECT id, name, email, age, created_at as createdAt, updated_at as updatedAt
      FROM ${this.tableName}
      WHERE id = ?
    `);

		return query.get(id) as User | null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const query = this.db.prepare(`
      SELECT id, name, email, age, created_at as createdAt, updated_at as updatedAt
      FROM ${this.tableName}
      WHERE email = ?
    `);

		return query.get(email) as User | null;
	}

	async findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
		const query = this.db.prepare(`
      SELECT id, name, email, age, created_at as createdAt, updated_at as updatedAt
      FROM ${this.tableName}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);

		return query.all(limit, offset) as User[];
	}

	async findByName(name: string): Promise<User[]> {
		const query = this.db.prepare(`
      SELECT id, name, email, age, created_at as createdAt, updated_at as updatedAt
      FROM ${this.tableName}
      WHERE name LIKE ?
      ORDER BY name
    `);

		return query.all(`%${name}%`) as User[];
	}

	async update(id: number, userData: UpdateUserData): Promise<User | null> {
		try {
			const existingUser = await this.findById(id);
			if (!existingUser) {
				return null;
			}

			const updates: string[] = [];
			const params: (string | number | null)[] = [];

			if (userData.name !== undefined) {
				updates.push("name = ?");
				params.push(userData.name);
			}

			if (userData.email !== undefined) {
				updates.push("email = ?");
				params.push(userData.email);
			}

			if (userData.age !== undefined) {
				updates.push("age = ?");
				params.push(userData.age);
			}

			if (updates.length === 0) {
				return existingUser;
			}

			updates.push("updated_at = CURRENT_TIMESTAMP");
			params.push(id);

			const updateQuery = this.db.prepare(`
        UPDATE ${this.tableName}
        SET ${updates.join(", ")}
        WHERE id = ?
      `);

			updateQuery.run(...params);

			return await this.findById(id);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("UNIQUE constraint failed")
			) {
				throw new Error("Email already exists");
			}
			throw error;
		}
	}

	async delete(id: number): Promise<boolean> {
		const query = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
		const result = query.run(id);

		return result.changes > 0;
	}

	async count(): Promise<number> {
		const query = this.db.prepare(
			`SELECT COUNT(*) as count FROM ${this.tableName}`,
		);
		const result = query.get() as { count: number };

		return result.count;
	}

	async createMany(users: CreateUserData[]): Promise<User[]> {
		const transaction = this.db.transaction((userList: CreateUserData[]) => {
			const insertQuery = this.db.prepare(`
        INSERT INTO ${this.tableName} (name, email, age)
        VALUES (?, ?, ?)
      `);

			const createdUsers: User[] = [];

			for (const userData of userList) {
				const result = insertQuery.run(
					userData.name,
					userData.email,
					userData.age ?? null,
				);

				const selectQuery = this.db.prepare(`
          SELECT id, name, email, age, created_at as createdAt, updated_at as updatedAt
          FROM ${this.tableName}
          WHERE id = ?
        `);

				const user = selectQuery.get(result.lastInsertRowid) as User;
				if (user) {
					createdUsers.push(user);
				}
			}

			return createdUsers;
		});

		return transaction(users);
	}

	close(): void {
		this.db.close();
	}

	getDatabase(): Database {
		return this.db;
	}
}

export const userRepository = new UserRepository();
