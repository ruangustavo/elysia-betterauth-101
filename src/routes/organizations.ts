import { Elysia } from 'elysia'
import { z } from 'zod/v4'
import { createAccountWithOrganization } from '../auth'

export const organizationsRoutes = new Elysia().post(
  '/signup-with-organization',
  async ({ body, status }) => {
    try {
      const result = await createAccountWithOrganization({
        email: body.email,
        password: body.password,
        name: body.name,
        organizationName: body.organizationName,
        organizationSlug: body.organizationSlug,
      })

      status('Created', {
        user: result.user,
        organization: result.organization,
        membership: result.membership,
        message: 'Account and organization created successfully',
      })
    } catch (error) {
      status('Bad Request', {
        error: error instanceof Error ? error.message : 'An error occurred',
      })
    }
  },
  {
    body: z.object({
      email: z.email(),
      password: z.string().min(8),
      name: z.string().min(1),
      organizationName: z.string().min(1).max(100),
      organizationSlug: z
        .string()
        .min(3)
        .max(50)
        .regex(/^[a-z0-9-]+$/, {
          message:
            'Slug can only contain lowercase letters, numbers, and hyphens',
        }),
    }),
  },
)
