import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create teams table
  await knex.schema.createTable('teams', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description');
    table.uuid('supervisor_id').notNullable();
    table.uuid('site_id').references('id').inTable('sites').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Foreign key for supervisor
    table.foreign('supervisor_id').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index('supervisor_id');
    table.index('site_id');
    table.index(['deleted_at']);
  });

  // Create team_members table
  await knex.schema.createTable('team_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable();
    table.uuid('user_id').notNullable();
    table.uuid('added_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('removed_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamp('removed_at');

    // Foreign keys
    table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Composite unique constraint (user can only be in team once)
    table.unique(['team_id', 'user_id', 'removed_at']);

    // Indexes
    table.index('team_id');
    table.index('user_id');
    table.index(['removed_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('team_members');
  await knex.schema.dropTableIfExists('teams');
}
