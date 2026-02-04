import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create whatsapp_sessions table
  await knex.schema.createTable('whatsapp_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('phone_number').notNullable().unique();
    table.string('whatsapp_id').nullable(); // WhatsApp Business API ID
    table.enum('status', ['active', 'paused', 'completed']).notNullable().defaultTo('active');
    table.enum('stage', [
      'initial',
      'waiting_name',
      'waiting_sa_id',
      'waiting_dob',
      'waiting_gender',
      'waiting_address',
      'waiting_emergency_contact',
      'waiting_emergency_phone',
      'waiting_emergency_relationship',
      'waiting_photo',
      'waiting_sa_id_document',
      'waiting_proof_of_residence',
      'waiting_popia_consent',
      'waiting_code_of_conduct',
      'completed',
    ]).notNullable().defaultTo('initial');
    table.uuid('participant_id').nullable().references('id').inTable('participants').onDelete('SET NULL');
    table.jsonb('session_data').nullable(); // Store partial form data
    table.integer('retry_count').notNullable().defaultTo(0);
    table.timestamp('last_message_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    // Indexes
    table.index('phone_number');
    table.index('status');
    table.index('stage');
    table.index(['status', 'stage']);
  });

  // Create whatsapp_messages table for message history
  await knex.schema.createTable('whatsapp_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').notNullable().references('id').inTable('whatsapp_sessions').onDelete('CASCADE');
    table.enum('direction', ['inbound', 'outbound']).notNullable();
    table.text('message').notNullable();
    table.string('message_type').notNullable().defaultTo('text'); // text, image, document
    table.string('media_url').nullable();
    table.string('whatsapp_message_id').nullable(); // WhatsApp's message ID
    table.jsonb('metadata').nullable();
    table.boolean('delivered').notNullable().defaultTo(false);
    table.boolean('read').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('session_id');
    table.index('created_at');
  });

  console.log('✅ Created whatsapp_sessions and whatsapp_messages tables');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('whatsapp_messages');
  await knex.schema.dropTableIfExists('whatsapp_sessions');
  console.log('✅ Dropped whatsapp_sessions and whatsapp_messages tables');
}
