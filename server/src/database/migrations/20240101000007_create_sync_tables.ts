import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create sync_records table
  await knex.schema.createTable('sync_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('record_type').notNullable(); // 'participant', 'attendance', 'task', etc.
    table.uuid('record_id').notNullable(); // ID of the record being synced
    table.string('target_system').notNullable(); // 'kwantu', 'hr_system', etc.
    table.jsonb('payload').notNullable(); // Data being synced
    table.string('status').notNullable().defaultTo('pending'); // 'pending', 'synced', 'failed'
    table.text('error_message'); // Error details if sync failed
    table.integer('attempts').defaultTo(0); // Number of sync attempts
    table.timestamp('synced_at'); // When sync completed
    table.uuid('created_by').references('id').inTable('users');
    table.timestamps(true, true);

    // Indexes
    table.index('record_id');
    table.index('target_system');
    table.index('status');
    table.index(['record_type', 'record_id']);
  });

  // Create sync_configurations table
  await knex.schema.createTable('sync_configurations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('target_system').notNullable().unique(); // 'kwantu', 'hr_system', etc.
    table.boolean('enabled').notNullable().defaultTo(true);
    table.boolean('auto_sync').notNullable().defaultTo(false);
    table.string('sync_frequency').defaultTo('daily'); // 'hourly', 'daily', 'weekly', 'manual'
    table.string('webhook_url'); // Webhook URL for target system
    table.text('api_key'); // API key for target system (should be encrypted)
    table.jsonb('config_options'); // Additional configuration options
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamps(true, true);
  });

  console.log('✅ Created sync tables');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sync_configurations');
  await knex.schema.dropTableIfExists('sync_records');

  console.log('✅ Dropped sync tables');
}
