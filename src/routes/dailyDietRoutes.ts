import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessinIdExists } from '../middewares/check-session-id-exists'

export async function dailyDietRoutes(app: FastifyInstance) {
  // create an user
  app.post('/user', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
    })
    const { name } = createUserBodySchema.parse(request.body)
    let sessionId = request.cookies.sessionId
    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }
    await knex('users').insert({
      id: randomUUID(),
      name,
      session_id: sessionId,
    })
    return reply.status(201).send()
  })

  // list all users
  app.get('/user', async (request, reply) => {
    const users = await knex('users').select()
    return { users }
  })

  // create a meal
  app.post(
    '/meal',
    {
      preHandler: [checkSessinIdExists],
    },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnDiet: z.boolean(),
      })
      const { name, description, isOnDiet } = createMealBodySchema.parse(
        request.body,
      )
      const { sessionId } = request.cookies
      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        is_on_diet: isOnDiet,
        session_id: sessionId,
      })
      return reply.status(201).send()
    },
  )

  // update infos from a meal
  app.put(
    '/meal/:id',
    {
      preHandler: [checkSessinIdExists],
    },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const { id } = getMealParamsSchema.parse(request.params)
      const createMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isOnDiet: z.boolean().optional(),
      })
      const { name, description, isOnDiet } = createMealBodySchema.parse(
        request.body,
      )
      const { sessionId } = request.cookies
      await knex('meals')
        .where({
          id,
          session_id: sessionId,
        })
        .update({
          name,
          description,
          is_on_diet: isOnDiet,
          updated_at: new Date(),
        })
      return reply.status(201).send()
    },
  )

  // get all meals from an user
  app.get(
    '/meal',
    {
      preHandler: [checkSessinIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const meals = await knex('meals').where('session_id', sessionId).select()
      return { meals }
    },
  )

  // get infos from a meal
  app.get(
    '/meal/:id',
    {
      preHandler: [checkSessinIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const { id } = getMealParamsSchema.parse(request.params)
      const meal = await knex('meals')
        .where({
          session_id: sessionId,
          id,
        })
        .first()
      return { meal }
    },
  )

  // delete a meal
  app.delete(
    '/meal/:id',
    {
      preHandler: [checkSessinIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const { id } = getMealParamsSchema.parse(request.params)
      await knex('meals').delete().where({
        session_id: sessionId,
        id,
      })
      return reply.status(204).send()
    },
  )

  // get all metrics from an user
  app.get(
    '/meal/metrics',
    {
      preHandler: [checkSessinIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const meals = await knex('meals')
        .where('session_id', sessionId)
        .select()
        .orderBy('created_at', 'asc')

      let counter = 0
      let bestDietSequel = 0
      for (const meal of meals) {
        if (meal.is_on_diet) {
          counter++
          if (counter > bestDietSequel) {
            bestDietSequel = counter
          }
        } else {
          counter = 0
        }
      }

      const mealsOnDiet = await knex('meals')
        .where({
          session_id: sessionId,
          is_on_diet: true,
        })
        .select()
      const mealsOffDiet = await knex('meals')
        .where({
          session_id: sessionId,
          is_on_diet: false,
        })
        .select()
      const metrics = {
        registeredMeals: meals.length,
        registeredMealsOnDiet: mealsOnDiet.length,
        registeredMealsOffDiet: mealsOffDiet.length,
        bestDietSequel,
      }
      return { metrics }
    },
  )
}
