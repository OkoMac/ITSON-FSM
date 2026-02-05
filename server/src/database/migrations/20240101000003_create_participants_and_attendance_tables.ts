import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enum types
  await knex.raw(`
    CREATE TYPE participant_status AS ENUM ('onboarding', 'active', 'exited', 'suspended');
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
    CREATE TYPE biometric_method AS ENUM ('face', 'fingerprint');
  `);

  // Participants table
  await knex.schema.createTable('participants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('site_id').references('id').inTable('sites').onDelete('SET NULL');

    // Personal information
    table.string('full_name', 255).notNullable();
    table.string('sa_id_number', 13).unique();
    table.date('date_of_birth');
    table.string('gender', 20);
    table.text('address');
    table.string('phone', 50);
    table.string('email', 255);

    // Emergency contact
    table.string('emergency_contact_name', 255);
    table.string('emergency_contact_phone', 50);
    table.string('emergency_contact_relationship', 100);

    // Program details
    table.specificType('status', 'participant_status').notNullable().defaultTo('onboarding');
    table.date('start_date');
    table.date('expected_end_date');
    table.date('actual_end_date');

    // Compliance
    table.boolean('popia_consent').defaultTo(false);
    table.timestamp('popia_consent_date');
    table.boolean('code_of_conduct_signed').defaultTo(false);

    // Documents
    table.jsonb('documents'); // Store document URLs/metadata

    // Biometric data (encrypted/hashed)
    table.boolean('biometric_enrolled').defaultTo(false);
    table.jsonb('biometric_data');

    table.timestamps(true, true);
    table.timestamp('deleted_at');

    table.index('user_id');
    table.index('site_id');
    table.index('status');
    table.index('sa_id_number');
  });

  // Attendance records table
  await knex.schema.createTable('attendance_records', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('participant_id').notNullable().references('id').inTable('participants').onDelete('CASCADE');
    table.uuid('site_id').notNullable().references('id').inTable('sites').onDelete('CASCADE');

    // Date
    table.date('date').notNullable();

    // Check-in
    table.timestamp('check_in_time');
    table.jsonb('check_in_location'); // { latitude, longitude, accuracy }
    table.specificType('check_in_method', 'biometric_method');
    table.text('check_in_photo'); // Base64 or URL
    table.decimal('biometric_confidence', 4, 3); // 0.000 to 1.000

    // Check-out
    table.timestamp('check_out_time');
    table.jsonb('check_out_location');
    table.specificType('check_out_method', 'biometric_method');
    table.text('check_out_photo');

    // Status
    table.specificType('status', 'attendance_status').notNullable();

    // Notes
    table.text('notes');

    // Sync status
    table.boolean('synced').defaultTo(false);
    table.timestamp('synced_at');

    table.timestamps(true, true);

    table.index('participant_id');
    table.index('site_id');
    table.index('date');
    table.index('status');
    table.index(['participant_id', 'date']); // Composite index for quick lookups
  });

  return Promise.resolve();
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('attendance_records');
  await knex.schema.dropTableIfExists('participants');
  await knex.raw('DROP TYPE IF EXISTS biometric_method');
  await knex.raw('DROP TYPE IF EXISTS attendance_status');
  await knex.raw('DROP TYPE IF EXISTS participant_status');
}
