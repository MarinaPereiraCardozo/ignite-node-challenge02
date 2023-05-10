// eslint-disable-next-line
import { knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      name: string
      session_id: string
      created_at: string
      updated_at: string
    }
    meals: {
      id: string
      name: string
      description: string
      created_at: Date
      updated_at: Date
      is_on_diet: boolean
      session_id: string
    }
  }
}
