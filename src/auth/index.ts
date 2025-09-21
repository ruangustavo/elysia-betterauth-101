import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import {
  admin,
  createAuthMiddleware,
  openAPI,
  organization,
} from 'better-auth/plugins'
import { randomUUIDv7 } from 'bun'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import schema from '../db/schemas'

const { members, organizations } = schema

// For some reason stacktraces isn't displayed in betterAuth (prob a skill issue, I'm gonna research it better later)
// This is after server generated a response and before to send it to the client
const logStacktraceAfter = createAuthMiddleware(async (ctx) => {
  const result = ctx.context.returned
  if (result instanceof Error) {
    console.error(result.stack ?? result)
  }
})

export const auth = betterAuth({
  basePath: '/auth',
  database: drizzleAdapter(db, { provider: 'sqlite', usePlural: true, schema }),
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
      defaultRole: 'customer',
    }),
    organization(),
  ],
})

// Combined signup and organization creation endpoint
export const createAccountWithOrganization = async (data: {
  email: string
  password: string
  name: string
  organizationName: string
  organizationSlug: string
}) => {
  // First, create the user account
  const signupResult = await auth.api.signUpEmail({
    body: {
      email: data.email,
      password: data.password,
      name: data.name,
    },
  })

  const user = signupResult.user

  const existingOrg = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, data.organizationSlug))
    .limit(1)

  if (existingOrg.length > 0) {
    throw new Error('Organization slug already exists')
  }

  const [newOrg] = await db
    .insert(organizations)
    .values({
      id: randomUUIDv7(),
      name: data.organizationName,
      slug: data.organizationSlug,
      createdAt: new Date(),
    })
    .returning()

  await db.insert(members).values({
    id: randomUUIDv7(),
    organizationId: newOrg.id,
    userId: user.id,
    role: 'owner',
    createdAt: new Date(),
  })

  return {
    user,
    organization: newOrg,
    membership: {
      role: 'owner',
      organizationId: newOrg.id,
    },
  }
}

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema>
const getSchema = async () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  getPaths: (prefix = '/auth/api') =>
    getSchema().then(({ paths }) => {
      const reference: typeof paths = Object.create(null)

      for (const path of Object.keys(paths)) {
        const key = prefix + path
        reference[key] = paths[path]

        for (const method of Object.keys(paths[path])) {
          const operation = (reference[key] as any)[method]

          operation.tags = ['Better Auth']
        }
      }

      return reference
    }) as Promise<any>,
  components: getSchema().then(({ components }) => components) as Promise<any>,
} as const
