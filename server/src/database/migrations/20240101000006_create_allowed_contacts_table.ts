import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create allowed_contacts table
  await knex.schema.createTable('allowed_contacts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('email');
    table.string('phone');
    table.enum('method', ['app', 'whatsapp']).notNullable().defaultTo('app');
    table.enum('status', ['pending', 'invited', 'completed', 'expired']).notNullable().defaultTo('pending');
    table.string('invite_code').unique();
    table.text('invite_link');
    table.uuid('participant_id').references('id').inTable('participants').onDelete('SET NULL');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('invited_at');
    table.timestamp('completed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('deleted_at');

    // Indexes
    table.index('invite_code');
    table.index('status');
    table.index('method');
    table.index(['deleted_at']);
    table.index('email');
    table.index('phone');

    // Check constraint: must have at least email or phone
    table.check('(email IS NOT NULL) OR (phone IS NOT NULL)', 'check_contact_info');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('allowed_contacts');
}
