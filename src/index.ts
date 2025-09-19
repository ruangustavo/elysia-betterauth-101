import { openapi } from '@elysiajs/openapi'
import { fromTypes } from '@elysiajs/openapi/gen'
import { Elysia } from 'elysia'
import { toJSONSchema } from 'zod/v4'
import { auth, OpenAPI } from './auth'
import { requiredRole } from './plugins/better-auth'
import { cors } from './plugins/cors'
import {
  watchesCustomersRoutes,
  watchesWatchmakersRoutes,
} from './routes/watches'

const app = new Elysia()
  .use(requiredRole)
  .use(cors)
  .use(
    openapi({
      references: fromTypes(
        process.env.NODE_ENV === 'production'
          ? 'dist/index.d.ts'
          : 'src/index.ts',
      ),
      mapJsonSchema: {
        zod: toJSONSchema,
      },
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths('/auth'),
      },
    }),
  )
  .mount(auth.handler)
  .use(watchesCustomersRoutes)
  .use(watchesWatchmakersRoutes)
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
