import Elysia from 'elysia'
import { auth } from '../auth'

export const organizationsPlugin = new Elysia({
  name: 'organizations',
}).macro({
  organizations: () => ({
    resolve: async ({ status, request: { headers } }) => {
      const session = await auth.api.getSession({ headers })
      if (!session) return status('Unauthorized')

      const { activeOrganizationId } = session.session
      if (!activeOrganizationId) return status('Forbidden')

      return { activeOrganizationId }
    },
  }),
})
