import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { dailyDietRoutes } from './routes/dailyDietRoutes'

export const app = fastify()

app.register(cookie)

app.register(dailyDietRoutes, {
  prefix: 'daily-diet',
})
