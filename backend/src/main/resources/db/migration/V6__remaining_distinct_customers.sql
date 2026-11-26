-- ==============================================================================
-- Apex Banking System: V6 Distinct Customers for Remaining Benchmark & Test Accounts
-- Ensures zero repeated names in account transfer dropdowns (mixed Indian & international names)
-- ==============================================================================

INSERT INTO customers (customer_number, user_id, first_name, last_name, email, phone, address)
VALUES
    ('CUST1031', NULL, 'Riya',     'Sen',         'riya.sen@apexbank.com',         '+91 9876543240', '12 Park Circus, Kolkata'),
    ('CUST1032', NULL, 'Devansh',  'Gupta',       'devansh.gupta@apexbank.com',    '+91 9876543241', '74 Vaishali Nagar, Jaipur'),
    ('CUST1033', NULL, 'Claire',   'Martin',      'claire.martin@apexbank.com',    '+91 9876543242', '29 Koregaon Park, Pune'),
    ('CUST1034', NULL, 'Ishaan',   'Malik',       'ishaan.malik@apexbank.com',     '+91 9876543243', '55 Hauz Khas, New Delhi'),
    ('CUST1035', NULL, 'Nandini',  'Krishnan',    'nandini.krishnan@apexbank.com', '+91 9876543244', '18 Besant Nagar, Chennai'),
    ('CUST1036', NULL, 'Lucas',    'Fernandez',   'lucas.fernandez@apexbank.com',  '+91 9876543245', '40 Panaji Waterfront, Goa'),
    ('CUST1037', NULL, 'Kunal',    'Bhatia',      'kunal.bhatia@apexbank.com',     '+91 9876543246', '92 Model Town, Ludhiana'),
    ('CUST1038', NULL, 'Shruti',   'Agarwal',     'shruti.agarwal@apexbank.com',   '+91 9876543247', '67 Hazratganj, Lucknow'),
    ('CUST1039', NULL, 'Noah',     'anderson',    'noah.anderson@apexbank.com',    '+91 9876543248', '15 HSR Layout, Bengaluru'),
    ('CUST1040', NULL, 'Aayush',   'Tiwari',      'aayush.tiwari@apexbank.com',    '+91 9876543249', '81 Arera Colony, Bhopal'),
    ('CUST1041', NULL, 'Tara',     'Desai',       'tara.desai@apexbank.com',       '+91 9876543250', '31 Navrangpura, Ahmedabad'),
    ('CUST1042', NULL, 'Hannah',   'Kim',         'hannah.kim@apexbank.com',       '+91 9876543251', '26 Powai Lake, Mumbai'),
    ('CUST1043', NULL, 'Vivaan',   'Reddy',       'vivaan.reddy@apexbank.com',     '+91 9876543252', '48 Gachibowli, Hyderabad'),
    ('CUST1044', NULL, 'Sakshi',   'Chauhan',     'sakshi.chauhan@apexbank.com',   '+91 9876543253', '60 Rajpur Road, Dehradun'),
    ('CUST1045', NULL, 'Oliver',   'Wright',      'oliver.wright@apexbank.com',    '+91 9876543254', '104 Jayanagar, Bengaluru'),
    ('CUST1046', NULL, 'Yash',     'Patwardhan',  'yash.patwardhan@apexbank.com',  '+91 9876543255', '36 Deccan Gymkhana, Pune'),
    ('CUST1047', NULL, 'Amrita',   'Pillai',      'amrita.pillai@apexbank.com',    '+91 9876543256', '24 Kowdiar, Thiruvananthapuram'),
    ('CUST1048', NULL, 'Deepak',   'Solanki',     'deepak.solanki@apexbank.com',   '+91 9876543257', '58 Vijay Nagar, Indore')
ON CONFLICT (customer_number) DO UPDATE
SET first_name = INITCAP(EXCLUDED.first_name),
    last_name  = INITCAP(EXCLUDED.last_name),
    email      = EXCLUDED.email;

UPDATE customers SET last_name = 'Anderson' WHERE customer_number = 'CUST1039';

UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1031') WHERE account_number = 'ACC_BM_009';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1032') WHERE account_number = 'ACC_BM_010';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1033') WHERE account_number = 'ACC_BM_011';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1034') WHERE account_number = 'ACC_BM_012';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1035') WHERE account_number = 'ACC_BM_013';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1036') WHERE account_number = 'ACC_BM_014';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1037') WHERE account_number = 'ACC_BM_015';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1038') WHERE account_number = 'ACC_BM_016';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1039') WHERE account_number = 'ACC_BM_017';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1040') WHERE account_number = 'ACC_BM_018';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1041') WHERE account_number = 'ACC_BM_019';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1042') WHERE account_number = 'ACC_BM_020';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1043') WHERE account_number = 'ACC3555';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1044') WHERE account_number = 'ACC3048';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1045') WHERE account_number = 'ACC5269';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1046') WHERE account_number = 'ACC9477';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1047') WHERE account_number = 'ACC4710';
UPDATE accounts SET customer_id = (SELECT id FROM customers WHERE customer_number = 'CUST1048') WHERE account_number = 'ACC2210';
