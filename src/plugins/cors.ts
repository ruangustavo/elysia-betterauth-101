import { cors as elysiaCors } from '@elysiajs/cors'
import Elysia from 'elysia'

export const cors = new Elysia().use(
  elysiaCors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
