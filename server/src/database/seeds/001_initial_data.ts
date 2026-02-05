import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data (in reverse order of dependencies)
  await knex('attendance_records').del();
  await knex('tasks').del();
  await knex('participants').del();
  await knex('sites').del();
  await knex('users').del();

  // Hash password for demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  // Insert users
  const users = await knex('users')
    .insert([
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@itsonfsm.com',
        password_hash: passwordHash,
        name: 'System Administrator',
        role: 'system-admin',
        status: 'active',
        phone: '+27123456789',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'manager@itsonfsm.com',
        password_hash: passwordHash,
        name: 'Project Manager',
        role: 'project-manager',
        status: 'active',
        phone: '+27123456790',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'supervisor@itsonfsm.com',
        password_hash: passwordHash,
        name: 'Site Supervisor',
        role: 'supervisor',
        status: 'active',
        phone: '+27123456791',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'worker1@itsonfsm.com',
        password_hash: passwordHash,
        name: 'John Worker',
        role: 'worker',
        status: 'active',
        phone: '+27123456792',
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        email: 'worker2@itsonfsm.com',
        password_hash: passwordHash,
        name: 'Jane Worker',
        role: 'worker',
        status: 'active',
        phone: '+27123456793',
      },
    ])
    .returning('*');

  console.log(`✅ Inserted ${users.length} users`);

  // Insert sites
  const sites = await knex('sites')
    .insert([
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Main Factory Site',
        address: '123 Industrial Road, Johannesburg, 2001',
        latitude: -26.2041,
        longitude: 28.0473,
        contact_person: 'John Smith',
        contact_phone: '+27119876543',
        contact_email: 'john.smith@factory.com',
        status: 'active',
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'City Office Hub',
        address: '456 Business Street, Sandton, 2196',
        latitude: -26.1076,
        longitude: 28.0567,
        contact_person: 'Sarah Johnson',
        contact_phone: '+27119876544',
        contact_email: 'sarah.johnson@office.com',
        status: 'active',
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        name: 'Warehouse Complex',
        address: '789 Logistics Avenue, Midrand, 1685',
        latitude: -25.9853,
        longitude: 28.1317,
        contact_person: 'Mike Brown',
        contact_phone: '+27119876545',
        contact_email: 'mike.brown@warehouse.com',
        status: 'active',
      },
    ])
    .returning('*');

  console.log(`✅ Inserted ${sites.length} sites`);

  // Insert participants
  const participants = await knex('participants')
    .insert([
      {
        id: '20000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000004',
        site_id: '10000000-0000-0000-0000-000000000001',
        full_name: 'John Worker',
        sa_id_number: '9001015800086',
        date_of_birth: '1990-01-01',
        gender: 'Male',
        address: '123 Main Road, Johannesburg',
        phone: '+27123456792',
        email: 'worker1@itsonfsm.com',
        emergency_contact_name: 'Mary Worker',
        emergency_contact_phone: '+27123456794',
        emergency_contact_relationship: 'Spouse',
        status: 'active',
        start_date: '2024-01-01',
        expected_end_date: '2024-12-31',
        popia_consent: true,
        popia_consent_date: '2024-01-01',
        code_of_conduct_signed: true,
        biometric_enrolled: true,
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000005',
        site_id: '10000000-0000-0000-0000-000000000002',
        full_name: 'Jane Worker',
        sa_id_number: '9505125800087',
        date_of_birth: '1995-05-12',
        gender: 'Female',
        address: '456 Second Street, Sandton',
        phone: '+27123456793',
        email: 'worker2@itsonfsm.com',
        emergency_contact_name: 'Bob Worker',
        emergency_contact_phone: '+27123456795',
        emergency_contact_relationship: 'Sibling',
        status: 'active',
        start_date: '2024-01-15',
        expected_end_date: '2024-12-31',
        popia_consent: true,
        popia_consent_date: '2024-01-15',
        code_of_conduct_signed: true,
        biometric_enrolled: true,
      },
    ])
    .returning('*');

  console.log(`✅ Inserted ${participants.length} participants`);

  // Insert tasks
  const tasks = await knex('tasks')
    .insert([
      {
        id: '30000000-0000-0000-0000-000000000001',
        title: 'Workshop Area Cleaning',
        description: 'Clean and organize workshop area 3. Ensure all tools are returned to their proper locations.',
        priority: 'high',
        status: 'in-progress',
        site_id: '10000000-0000-0000-0000-000000000001',
        assigned_to_id: '00000000-0000-0000-0000-000000000004',
        assigned_by_id: '00000000-0000-0000-0000-000000000003',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        requires_photo_evidence: true,
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        title: 'Equipment Inspection',
        description: 'Inspect safety equipment in storage room. Check for any damage or missing items.',
        priority: 'medium',
        status: 'pending',
        site_id: '10000000-0000-0000-0000-000000000001',
        assigned_to_id: '00000000-0000-0000-0000-000000000004',
        assigned_by_id: '00000000-0000-0000-0000-000000000003',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        requires_photo_evidence: true,
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        title: 'Office Desk Setup',
        description: 'Set up new desks in office area B. Arrange ergonomically and install cable management.',
        priority: 'urgent',
        status: 'pending',
        site_id: '10000000-0000-0000-0000-000000000002',
        assigned_to_id: '00000000-0000-0000-0000-000000000005',
        assigned_by_id: '00000000-0000-0000-0000-000000000003',
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        requires_photo_evidence: true,
      },
    ])
    .returning('*');

  console.log(`✅ Inserted ${tasks.length} tasks`);

  // Insert attendance records (for today)
  const today = new Date().toISOString().split('T')[0];
  const attendanceRecords = await knex('attendance_records')
    .insert([
      {
        participant_id: '20000000-0000-0000-0000-000000000001',
        site_id: '10000000-0000-0000-0000-000000000001',
        date: today,
        check_in_time: new Date(new Date().setHours(8, 0, 0, 0)),
        check_in_location: { latitude: -26.2041, longitude: 28.0473, accuracy: 10 },
        check_in_method: 'face',
        biometric_confidence: 0.95,
        status: 'present',
        synced: true,
      },
      {
        participant_id: '20000000-0000-0000-0000-000000000002',
        site_id: '10000000-0000-0000-0000-000000000002',
        date: today,
        check_in_time: new Date(new Date().setHours(8, 15, 0, 0)),
        check_in_location: { latitude: -26.1076, longitude: 28.0567, accuracy: 12 },
        check_in_method: 'face',
        biometric_confidence: 0.92,
        status: 'present',
        synced: true,
      },
    ])
    .returning('*');

  console.log(`✅ Inserted ${attendanceRecords.length} attendance records`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('   Admin:      admin@itsonfsm.com / password123');
  console.log('   Manager:    manager@itsonfsm.com / password123');
  console.log('   Supervisor: supervisor@itsonfsm.com / password123');
  console.log('   Worker 1:   worker1@itsonfsm.com / password123');
  console.log('   Worker 2:   worker2@itsonfsm.com / password123');
}
