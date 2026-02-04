import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enum types
  await knex.raw(`
    CREATE TYPE user_role AS ENUM (
      'worker',
      'supervisor',
      'project-manager',
      'property-point',
      'idc-admin',
      'system-admin'
    );
  `);

  await knex.raw(`
    CREATE TYPE user_status AS ENUM (
      'active',
      'inactive',
      'suspended'
    );
  `);

  // Create users table
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.specificType('role', 'user_role').notNullable().defaultTo('worker');
    table.specificType('status', 'user_status').notNullable().defaultTo('active');
    table.string('phone', 50);
    table.string('profile_picture');
    table.timestamp('last_login');
    table.timestamp('password_changed_at');
    table.timestamps(true, true); // created_at, updated_at
    table.timestamp('deleted_at'); // soft delete

    // Indexes
    table.index('email');
    table.index('role');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS user_role');
  await knex.raw('DROP TYPE IF EXISTS user_status');
}
