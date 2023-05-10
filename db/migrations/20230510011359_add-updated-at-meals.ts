import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meals', (table) => {
    table.timestamp('updated_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meals', (table) => {
    table.dropColumn('updated_at')
  })
}
