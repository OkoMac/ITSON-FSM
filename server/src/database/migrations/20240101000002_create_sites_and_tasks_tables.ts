import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enum types
  await knex.raw(`
    CREATE TYPE site_status AS ENUM ('active', 'inactive', 'maintenance');
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    CREATE TYPE task_status AS ENUM ('pending', 'in-progress', 'completed', 'approved', 'rejected', 'requires-changes');
  `);

  // Sites table
  await knex.schema.createTable('sites', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.text('address').notNullable();
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.string('contact_person', 255);
    table.string('contact_phone', 50);
    table.string('contact_email', 255);
    table.specificType('status', 'site_status').notNullable().defaultTo('active');
    table.jsonb('metadata'); // Store additional site info
    table.timestamps(true, true);
    table.timestamp('deleted_at');

    table.index('status');
    table.index(['latitude', 'longitude']);
  });

  // Tasks table
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 500).notNullable();
    table.text('description');
    table.specificType('priority', 'task_priority').notNullable().defaultTo('medium');
    table.specificType('status', 'task_status').notNullable().defaultTo('pending');

    // Foreign keys
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE');
    table.uuid('assigned_to_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('assigned_by_id').references('id').inTable('users').onDelete('SET NULL');

    // Dates
    table.timestamp('due_date');
    table.timestamp('completed_at');

    // Photo evidence
    table.boolean('requires_photo_evidence').defaultTo(false);
    table.jsonb('proof_photos'); // Array of photo URLs

    // Completion details
    table.text('completion_note');
    table.text('supervisor_feedback');
    table.integer('quality_rating').checkBetween([1, 5]);

    table.timestamps(true, true);
    table.timestamp('deleted_at');

    table.index('site_id');
    table.index('assigned_to_id');
    table.index('status');
    table.index('priority');
    table.index('due_date');
  });

  return Promise.resolve();
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('sites');
  await knex.raw('DROP TYPE IF EXISTS task_status');
  await knex.raw('DROP TYPE IF EXISTS task_priority');
  await knex.raw('DROP TYPE IF EXISTS site_status');
}
