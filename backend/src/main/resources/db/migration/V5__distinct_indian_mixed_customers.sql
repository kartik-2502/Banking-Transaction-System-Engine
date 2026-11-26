-- ==============================================================================
-- Apex Banking System: V5 Distinct Customers (Mix of Indian & International Names)
-- Ensures every account has a distinct account holder instead of repeating John Doe / Jane Smith
-- Keeps ACC1001 on CUST1001 (Aarav Sharma) and ACC2004 on CUST1002 (Priya Patel)
-- ==============================================================================

INSERT INTO customers (customer_number, user_id, first_name, last_name, email, phone, address)
VALUES
    ('CUST1003', NULL, 'Vikram',    'Mehta',       'vikram.mehta@apexbank.com',       '+91 9876543212', '14 MG Road, Bengaluru'),
    ('CUST1004', NULL, 'Ananya',    'Verma',       'ananya.verma@apexbank.com',       '+91 9876543213', '22 Connaught Place, New Delhi'),
    ('CUST1005', NULL, 'Rohan',     'Kulkarni',    'rohan.kulkarni@apexbank.com',     '+91 9876543214', '88 FC Road, Pune'),
    ('CUST1006', NULL, 'Kavya',     'Nair',        'kavya.nair@apexbank.com',         '+91 9876543215', '19 Marine Drive, Kochi'),
    ('CUST1007', NULL, 'Elena',     'Rostova',     'elena.rostova@apexbank.com',      '+91 9876543216', '45 Bandra West, Mumbai'),
    ('CUST1008', NULL, 'Siddharth', 'Rao',         'siddharth.rao@apexbank.com',      '+91 9876543217', '302 Banjara Hills, Hyderabad'),
    ('CUST1009', NULL, 'Marcus',    'Vance',       'marcus.vance@apexbank.com',       '+91 9876543218', '17 Koramangala, Bengaluru'),
    ('CUST1010', NULL, 'Meera',     'Iyer',        'meera.iyer@apexbank.com',         '+91 9876543219', '9 Adyar Seaface, Chennai'),
    ('CUST1011', NULL, 'Daniel',    'Brooks',      'daniel.brooks@apexbank.com',      '+91 9876543220', '72 Park Street, Kolkata'),
    ('CUST1012', NULL, 'Aditya',    'Joshi',       'aditya.joshi@apexbank.com',       '+91 9876543221', '51 Civil Lines, Jaipur'),
    ('CUST1013', NULL, 'Neha',      'Kapoor',      'neha.kapoor@apexbank.com',        '+91 9876543222', '12 Sector 17, Chandigarh'),
    ('CUST1014', NULL, 'Arjun',     'Deshmukh',    'arjun.deshmukh@apexbank.com',     '+91 9876543223', '63 Shivaji Nagar, Nagpur'),
    ('CUST1015', NULL, 'Olivia',    'Bennett',     'olivia.bennett@apexbank.com',     '+91 9876543224', '28 Indiranagar, Bengaluru'),
    ('CUST1016', NULL, 'Divya',     'Menon',       'divya.menon@apexbank.com',        '+91 9876543225', '34 Panampilly Nagar, Kochi'),
    ('CUST1017', NULL, 'Liam',      'Carter',      'liam.carter@apexbank.com',        '+91 9876543226', '55 Worli Sea Face, Mumbai'),
    ('CUST1018', NULL, 'Karthik',   'Subramanian', 'karthik.subramanian@apexbank.com','+91 9876543227', '41 Anna Nagar, Chennai'),
    ('CUST1019', NULL, 'Sanya',     'Malhotra',    'sanya.malhotra@apexbank.com',     '+91 9876543228', '83 Vasant Vihar, New Delhi'),
    ('CUST1020', NULL, 'Kabir',     'Kapoor',      'kabir.kapoor@apexbank.com',       '+91 9876543229', '66 Gomti Nagar, Lucknow'),
    ('CUST1021', NULL, 'Ethan',     'Miller',      'ethan.miller@apexbank.com',       '+91 9876543230', '11 Salt Lake, Kolkata'),
    ('CUST1022', NULL, 'Ishita',    'Sengupta',    'ishita.sengupta@apexbank.com',    '+91 9876543231', '90 Ballygunge, Kolkata'),
    ('CUST1023', NULL, 'Nikhil',    'Bansal',      'nikhil.bansal@apexbank.com',      '+91 9876543232', '15 Cyber Hub, Gurugram'),
    ('CUST1024', NULL, 'Pooja',     'Choudhary',   'pooja.choudhary@apexbank.com',    '+91 9876543233', '44 C-Scheme, Jaipur'),
    ('CUST1025', NULL, 'Harsh',     'Vardhan',     'harsh.vardhan@apexbank.com',      '+91 9876543234', '77 Satellite Road, Ahmedabad'),
    ('CUST1026', NULL, 'Sophia',    'Laurent',     'sophia.laurent@apexbank.com',     '+91 9876543235', '33 Whitefield, Bengaluru'),
    ('CUST1027', NULL, 'Pranav',    'Kulkarni',    'pranav.kulkarni@apexbank.com',    '+91 9876543236', '8 Kothrud, Pune'),
    ('CUST1028', NULL, 'Tanvi',     'Deshpande',   'tanvi.deshpande@apexbank.com',    '+91 9876543237', '21 Dadar West, Mumbai'),
    ('CUST1029', NULL, 'Varun',     'Khanna',      'varun.khanna@apexbank.com',       '+91 9876543238', '61 Rajouri Garden, New Delhi'),
    ('CUST1030', NULL, 'Sneha',     'Nair',        'sneha.nair@apexbank.com',         '+91 9876543239', '39 Jubilee Hills, Hyderabad')
ON CONFLICT (customer_number) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    email      = EXCLUDED.email;

-- Assign distinct customer_id to each account so no account list repeats a single name
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1003') WHERE account_number = 'ACC3005';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1004') WHERE account_number = 'ACC9999';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1005') WHERE account_number = 'ACC9457';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1006') WHERE account_number = 'ACC4246';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1007') WHERE account_number = 'ACC2180';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1008') WHERE account_number = 'ACC7202';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1009') WHERE account_number = 'ACC1596';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1010') WHERE account_number = 'ACC6460';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1011') WHERE account_number = 'ACC1542';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1012') WHERE account_number = 'ACC4931';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1013') WHERE account_number = 'ACC2706';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1014') WHERE account_number = 'ACC5567';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1015') WHERE account_number = 'ACC4353';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1016') WHERE account_number = 'ACC7719';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1017') WHERE account_number = 'ACC3890';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1018') WHERE account_number = 'ACC6969';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1019') WHERE account_number = 'ACC9328';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1020') WHERE account_number = 'ACC5527';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1021') WHERE account_number = 'ACC1223';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1022') WHERE account_number = 'ACC5066';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1023') WHERE account_number = 'ACC_BM_001';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1024') WHERE account_number = 'ACC_BM_002';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1025') WHERE account_number = 'ACC_BM_003';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1026') WHERE account_number = 'ACC_BM_004';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1027') WHERE account_number = 'ACC_BM_005';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1028') WHERE account_number = 'ACC_BM_006';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1029') WHERE account_number = 'ACC_BM_007';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1030') WHERE account_number = 'ACC_BM_008';
