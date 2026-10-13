-- Mirror of root supabase/seed.sql
DELETE FROM alerts WHERE room_id IN (
    '11111111-1111-4111-a111-111111111101',
    '11111111-1111-4111-a111-111111111102',
    '11111111-1111-4111-a111-111111111103',
    '11111111-1111-4111-a111-111111111104',
    '11111111-1111-4111-a111-111111111105',
    '11111111-1111-4111-a111-111111111106',
    '11111111-1111-4111-a111-111111111107',
    '11111111-1111-4111-a111-111111111108'
);

DELETE FROM readings WHERE room_id IN (
    '11111111-1111-4111-a111-111111111101',
    '11111111-1111-4111-a111-111111111102',
    '11111111-1111-4111-a111-111111111103',
    '11111111-1111-4111-a111-111111111104',
    '11111111-1111-4111-a111-111111111105',
    '11111111-1111-4111-a111-111111111106',
    '11111111-1111-4111-a111-111111111107',
    '11111111-1111-4111-a111-111111111108'
);

DELETE FROM timetables WHERE room_id IN (
    '11111111-1111-4111-a111-111111111101',
    '11111111-1111-4111-a111-111111111102',
    '11111111-1111-4111-a111-111111111103',
    '11111111-1111-4111-a111-111111111104',
    '11111111-1111-4111-a111-111111111105',
    '11111111-1111-4111-a111-111111111106',
    '11111111-1111-4111-a111-111111111107',
    '11111111-1111-4111-a111-111111111108'
);

DELETE FROM rooms WHERE id IN (
    '11111111-1111-4111-a111-111111111101',
    '11111111-1111-4111-a111-111111111102',
    '11111111-1111-4111-a111-111111111103',
    '11111111-1111-4111-a111-111111111104',
    '11111111-1111-4111-a111-111111111105',
    '11111111-1111-4111-a111-111111111106',
    '11111111-1111-4111-a111-111111111107',
    '11111111-1111-4111-a111-111111111108'
);

INSERT INTO rooms (id, room_code, building, floor, capacity) VALUES
('11111111-1111-4111-a111-111111111101', 'AEH-101', 'Aryabhata Engineering Hall', 1, 60),
('11111111-1111-4111-a111-111111111102', 'AEH-204', 'Aryabhata Engineering Hall', 2, 45),
('11111111-1111-4111-a111-111111111103', 'STC-102', 'Science & Technology Complex', 1, 80),
('11111111-1111-4111-a111-111111111104', 'STC-305', 'Science & Technology Complex', 3, 40),
('11111111-1111-4111-a111-111111111105', 'RCC-201', 'Ramanujan Computing Centre', 2, 50),
('11111111-1111-4111-a111-111111111106', 'RCC-105', 'Ramanujan Computing Centre', 1, 35),
('11111111-1111-4111-a111-111111111107', 'NHB-101', 'Nalanda Humanities Block', 1, 75),
('11111111-1111-4111-a111-111111111108', 'NHB-202', 'Nalanda Humanities Block', 2, 50);

INSERT INTO timetables (id, room_id, class_name, start_time, end_time, status) VALUES
('22222222-2222-4222-a222-222222222201', '11111111-1111-4111-a111-111111111101', 'CS301: Distributed Systems', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', 'scheduled'),
('22222222-2222-4222-a222-222222222202', '11111111-1111-4111-a111-111111111102', 'ME202: Fluid Mechanics', NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '15 minutes', 'cancelled'),
('22222222-2222-4222-a222-222222222203', '11111111-1111-4111-a111-111111111103', 'CH101: General Chemistry', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'completed'),
('22222222-2222-4222-a222-222222222204', '11111111-1111-4111-a111-111111111104', 'PH205: Optics Lab Prep', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours', 'scheduled'),
('22222222-2222-4222-a222-222222222205', '11111111-1111-4111-a111-111111111105', 'AI401: Deep Learning', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '5 hours', 'scheduled'),
('22222222-2222-4222-a222-222222222206', '11111111-1111-4111-a111-111111111106', 'Reserved: Faculty Meeting', NOW() + INTERVAL '5 hours', NOW() + INTERVAL '6 hours', 'scheduled'),
('22222222-2222-4222-a222-222222222207', '11111111-1111-4111-a111-111111111107', 'ENG102: Technical Writing', NOW() + INTERVAL '10 minutes', NOW() + INTERVAL '70 minutes', 'scheduled'),
('22222222-2222-4222-a222-222222222208', '11111111-1111-4111-a111-111111111108', 'HIS201: Modern Indian History', NOW() - INTERVAL '105 minutes', NOW() - INTERVAL '45 minutes', 'completed');

INSERT INTO readings (id, room_id, recorded_at, estimated_occupancy, class_scheduled, ac_on, lights_on, projector_on, power_watts, data_source) VALUES
('33333333-3333-4333-a333-333333333301', '11111111-1111-4111-a111-111111111101', NOW() - INTERVAL '2 minutes', 42, true, true, true, true, 2450.00, 'sensor'),
('33333333-3333-4333-a333-333333333302', '11111111-1111-4111-a111-111111111102', NOW() - INTERVAL '5 minutes', 0, false, true, true, false, 1920.00, 'sensor'),
('33333333-3333-4333-a333-333333333303', '11111111-1111-4111-a111-111111111103', NOW() - INTERVAL '4 minutes', 0, false, false, false, false, 35.00, 'sensor'),
('33333333-3333-4333-a333-333333333304', '11111111-1111-4111-a111-111111111104', NOW() - INTERVAL '3 minutes', 0, false, false, true, false, 280.00, 'sensor'),
('33333333-3333-4333-a333-333333333305', '11111111-1111-4111-a111-111111111105', NOW() - INTERVAL '210 minutes', 0, false, true, false, false, 1500.00, 'sensor'),
('33333333-3333-4333-a333-333333333306', '11111111-1111-4111-a111-111111111106', NOW() - INTERVAL '6 minutes', 0, false, false, false, false, 25.00, 'simulated'),
('33333333-3333-4333-a333-333333333307', '11111111-1111-4111-a111-111111111107', NOW() - INTERVAL '1 minute', 5, true, true, true, false, 1850.00, 'sensor'),
('33333333-3333-4333-a333-333333333308', '11111111-1111-4111-a111-111111111108', NOW() - INTERVAL '8 minutes', 0, false, true, true, true, 2680.00, 'sensor');

INSERT INTO alerts (id, room_id, reading_id, severity, alert_type, title, explanation, recommendation, estimated_wasted_kwh, estimated_cost_inr, status) VALUES
('44444444-4444-4444-a444-444444444401',
 '11111111-1111-4111-a111-111111111102',
 '33333333-3333-4333-a333-333333333302',
 'high',
 'AC_AND_LIGHTS_EMPTY_ROOM',
 'High Waste: HVAC and Lights Active in Vacant Room AEH-204',
 'Estimated occupancy is 0 with no active class scheduled (cancelled). The HVAC unit and overhead lighting are drawing ~1920 Watts.',
 'Turn off classroom HVAC and lighting remotely or dispatch floor staff to verify.',
 1.885,
 15.08,
 'open'),
('44444444-4444-4444-a444-444444444402',
 '11111111-1111-4111-a111-111111111104',
 '33333333-3333-4333-a333-333333333304',
 'low',
 'LIGHTS_EMPTY_ROOM',
 'Lighting Left On in Unoccupied Room STC-305',
 'Classroom lights are consuming ~280 Watts while the room is unoccupied and unscheduled.',
 'Switch off lighting fixtures or inspect motion sensor timer.',
 0.245,
 1.96,
 'open'),
('44444444-4444-4444-a444-444444444403',
 '11111111-1111-4111-a111-111111111105',
 '33333333-3333-4333-a333-333333333305',
 'medium',
 'STALE_SENSOR_DATA',
 'Stale Telemetry Feed in RCC-201',
 'The last sensor transmission was received over 3.5 hours ago. Readings may not reflect actual classroom conditions.',
 'Check IoT gateway connectivity and power status for sensor node RCC-201.',
 0.000,
 0.00,
 'open'),
('44444444-4444-4444-a444-444444444404',
 '11111111-1111-4111-a111-111111111108',
 '33333333-3333-4333-a333-333333333308',
 'high',
 'ALL_EQUIPMENT_ACTIVE_EMPTY_ROOM',
 'Critical Waste: All Equipment Running in Empty Room NHB-202',
 'Previous class ended 45 minutes ago. Room is vacant (occupancy 0), but HVAC, lighting, and high-wattage projector remain fully powered (~2680 Watts).',
 'Immediate remote shutdown recommended for HVAC, projector, and lighting circuits.',
 2.645,
 21.16,
 'open');
