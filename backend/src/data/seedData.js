/**
 * In-memory seed data for Phantom Classrooms
 * Corresponds exactly with the PostgreSQL seed definitions in supabase/seed.sql
 */

// Base ISO timestamps generated dynamically relative to module load time
const now = Date.now();
const minutesAgo = (m) => new Date(now - m * 60 * 1000).toISOString();
const minutesFromNow = (m) => new Date(now + m * 60 * 1000).toISOString();

export function getInitialSeedData() {
  const rooms = [
    {
      id: '11111111-1111-4111-a111-111111111101',
      room_code: 'AEH-101',
      building: 'Aryabhata Engineering Hall',
      floor: 1,
      capacity: 60,
      created_at: minutesAgo(1440)
    },
    {
      id: '11111111-1111-4111-a111-111111111102',
      room_code: 'AEH-204',
      building: 'Aryabhata Engineering Hall',
      floor: 2,
      capacity: 45,
      created_at: minutesAgo(1440)
    },
    {
      id: '11111111-1111-4111-a111-111111111103',
      room_code: 'STC-102',
      building: 'Science & Technology Complex',
      floor: 1,
      capacity: 80,
      created_at: minutesAgo(1440)
    },
    {
      id: '11111111-1111-4111-a111-111111111104',
      room_code: 'STC-305',
      building: 'Science & Technology Complex',
      floor: 3,
      capacity: 40,
      created_at: minutesAgo(1440)
    },
    {
      id: '11111111-1111-4111-a111-111111111105',
      room_code: 'RCC-201',
      building: 'Ramanujan Computing Centre',
      floor: 2,
      capacity: 50,
      created_at: minutesAgo(1440)
    },
    {
      id: '11111111-1111-4111-a111-111111111106',
      room_code: 'RCC-105',
      building: 'Ramanujan Computing Centre',
      floor: 1,
      capacity: 35,
      created_at: minutesAgo(1440)
    },
    {
      id: '11111111-1111-4111-a111-111111111107',
      room_code: 'NHB-101',
      building: 'Nalanda Humanities Block',
      floor: 1,
      capacity: 75,
      created_at: minutesAgo(1440)
    },
    {
      id: '11111111-1111-4111-a111-111111111108',
      room_code: 'NHB-202',
      building: 'Nalanda Humanities Block',
      floor: 2,
      capacity: 50,
      created_at: minutesAgo(1440)
    }
  ];

  const timetables = [
    {
      id: '22222222-2222-4222-a222-222222222201',
      room_id: '11111111-1111-4111-a111-111111111101',
      class_name: 'CS301: Distributed Systems',
      start_time: minutesAgo(30),
      end_time: minutesFromNow(30),
      status: 'scheduled',
      created_at: minutesAgo(1440)
    },
    {
      id: '22222222-2222-4222-a222-222222222202',
      room_id: '11111111-1111-4111-a111-111111111102',
      class_name: 'ME202: Fluid Mechanics',
      start_time: minutesAgo(45),
      end_time: minutesFromNow(15),
      status: 'cancelled',
      created_at: minutesAgo(1440)
    },
    {
      id: '22222222-2222-4222-a222-222222222203',
      room_id: '11111111-1111-4111-a111-111111111103',
      class_name: 'CH101: General Chemistry',
      start_time: minutesAgo(120),
      end_time: minutesAgo(60),
      status: 'completed',
      created_at: minutesAgo(1440)
    },
    {
      id: '22222222-2222-4222-a222-222222222204',
      room_id: '11111111-1111-4111-a111-111111111104',
      class_name: 'PH205: Optics Lab Prep',
      start_time: minutesFromNow(120),
      end_time: minutesFromNow(240),
      status: 'scheduled',
      created_at: minutesAgo(1440)
    },
    {
      id: '22222222-2222-4222-a222-222222222205',
      room_id: '11111111-1111-4111-a111-111111111105',
      class_name: 'AI401: Deep Learning',
      start_time: minutesFromNow(180),
      end_time: minutesFromNow(300),
      status: 'scheduled',
      created_at: minutesAgo(1440)
    },
    {
      id: '22222222-2222-4222-a222-222222222206',
      room_id: '11111111-1111-4111-a111-111111111106',
      class_name: 'Reserved: Faculty Meeting',
      start_time: minutesFromNow(300),
      end_time: minutesFromNow(360),
      status: 'scheduled',
      created_at: minutesAgo(1440)
    },
    {
      id: '22222222-2222-4222-a222-222222222207',
      room_id: '11111111-1111-4111-a111-111111111107',
      class_name: 'ENG102: Technical Writing',
      start_time: minutesFromNow(10),
      end_time: minutesFromNow(70),
      status: 'scheduled',
      created_at: minutesAgo(1440)
    },
    {
      id: '22222222-2222-4222-a222-222222222208',
      room_id: '11111111-1111-4111-a111-111111111108',
      class_name: 'HIS201: Modern Indian History',
      start_time: minutesAgo(105),
      end_time: minutesAgo(45),
      status: 'completed',
      created_at: minutesAgo(1440)
    }
  ];

  const readings = [
    {
      id: '33333333-3333-4333-a333-333333333301',
      room_id: '11111111-1111-4111-a111-111111111101',
      recorded_at: minutesAgo(2),
      estimated_occupancy: 42,
      class_scheduled: true,
      ac_on: true,
      lights_on: true,
      projector_on: true,
      power_watts: 2450.0,
      data_source: 'sensor',
      created_at: minutesAgo(2)
    },
    {
      id: '33333333-3333-4333-a333-333333333302',
      room_id: '11111111-1111-4111-a111-111111111102',
      recorded_at: minutesAgo(5),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: true,
      lights_on: true,
      projector_on: false,
      power_watts: 1920.0,
      data_source: 'sensor',
      created_at: minutesAgo(5)
    },
    {
      id: '33333333-3333-4333-a333-333333333303',
      room_id: '11111111-1111-4111-a111-111111111103',
      recorded_at: minutesAgo(4),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: false,
      lights_on: false,
      projector_on: false,
      power_watts: 35.0,
      data_source: 'sensor',
      created_at: minutesAgo(4)
    },
    {
      id: '33333333-3333-4333-a333-333333333304',
      room_id: '11111111-1111-4111-a111-111111111104',
      recorded_at: minutesAgo(3),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: false,
      lights_on: true,
      projector_on: false,
      power_watts: 280.0,
      data_source: 'sensor',
      created_at: minutesAgo(3)
    },
    {
      id: '33333333-3333-4333-a333-333333333305',
      room_id: '11111111-1111-4111-a111-111111111105',
      recorded_at: minutesAgo(210), // 3.5 hours ago -> Stale!
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: true,
      lights_on: false,
      projector_on: false,
      power_watts: 1500.0,
      data_source: 'sensor',
      created_at: minutesAgo(210)
    },
    {
      id: '33333333-3333-4333-a333-333333333306',
      room_id: '11111111-1111-4111-a111-111111111106',
      recorded_at: minutesAgo(6),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: false,
      lights_on: false,
      projector_on: false,
      power_watts: 25.0,
      data_source: 'simulated',
      created_at: minutesAgo(6)
    },
    {
      id: '33333333-3333-4333-a333-333333333307',
      room_id: '11111111-1111-4111-a111-111111111107',
      recorded_at: minutesAgo(1),
      estimated_occupancy: 5,
      class_scheduled: true,
      ac_on: true,
      lights_on: true,
      projector_on: false,
      power_watts: 1850.0,
      data_source: 'sensor',
      created_at: minutesAgo(1)
    },
    {
      id: '33333333-3333-4333-a333-333333333308',
      room_id: '11111111-1111-4111-a111-111111111108',
      recorded_at: minutesAgo(8),
      estimated_occupancy: 0,
      class_scheduled: false,
      ac_on: true,
      lights_on: true,
      projector_on: true,
      power_watts: 2680.0,
      data_source: 'sensor',
      created_at: minutesAgo(8)
    }
  ];

  const alerts = [
    {
      id: '44444444-4444-4444-a444-444444444401',
      room_id: '11111111-1111-4111-a111-111111111102',
      reading_id: '33333333-3333-4333-a333-333333333302',
      severity: 'high',
      alert_type: 'AC_AND_LIGHTS_EMPTY_ROOM',
      title: 'High Waste: HVAC and Lights Active in Vacant Room AEH-204',
      explanation: 'Estimated occupancy is 0 with no active class scheduled (cancelled). The HVAC unit and overhead lighting are drawing ~1920 Watts.',
      recommendation: 'Turn off classroom HVAC and lighting remotely or dispatch floor staff to verify.',
      estimated_wasted_kwh: 1.885,
      estimated_cost_inr: 15.08,
      status: 'open',
      created_at: minutesAgo(5)
    },
    {
      id: '44444444-4444-4444-a444-444444444402',
      room_id: '11111111-1111-4111-a111-111111111104',
      reading_id: '33333333-3333-4333-a333-333333333304',
      severity: 'low',
      alert_type: 'LIGHTS_EMPTY_ROOM',
      title: 'Lighting Left On in Unoccupied Room STC-305',
      explanation: 'Classroom lights are consuming ~280 Watts while the room is unoccupied and unscheduled.',
      recommendation: 'Switch off lighting fixtures or inspect motion sensor timer.',
      estimated_wasted_kwh: 0.245,
      estimated_cost_inr: 1.96,
      status: 'open',
      created_at: minutesAgo(3)
    },
    {
      id: '44444444-4444-4444-a444-444444444403',
      room_id: '11111111-1111-4111-a111-111111111105',
      reading_id: '33333333-3333-4333-a333-333333333305',
      severity: 'medium',
      alert_type: 'STALE_SENSOR_DATA',
      title: 'Stale Telemetry Feed in RCC-201',
      explanation: 'The last sensor transmission was received over 3.5 hours ago. Readings may not reflect actual classroom conditions.',
      recommendation: 'Check IoT gateway connectivity and power status for sensor node RCC-201.',
      estimated_wasted_kwh: 0.0,
      estimated_cost_inr: 0.0,
      status: 'open',
      created_at: minutesAgo(210)
    },
    {
      id: '44444444-4444-4444-a444-444444444404',
      room_id: '11111111-1111-4111-a111-111111111108',
      reading_id: '33333333-3333-4333-a333-333333333308',
      severity: 'high',
      alert_type: 'ALL_EQUIPMENT_ACTIVE_EMPTY_ROOM',
      title: 'Critical Waste: All Equipment Running in Empty Room NHB-202',
      explanation: 'Previous class ended 45 minutes ago. Room is vacant (occupancy 0), but HVAC, lighting, and high-wattage projector remain fully powered (~2680 Watts).',
      recommendation: 'Immediate remote shutdown recommended for HVAC, projector, and lighting circuits.',
      estimated_wasted_kwh: 2.645,
      estimated_cost_inr: 21.16,
      status: 'open',
      created_at: minutesAgo(8)
    }
  ];

  return { rooms, timetables, readings, alerts };
}
