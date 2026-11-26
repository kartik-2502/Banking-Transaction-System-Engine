-- ==============================================================================
-- Apex Banking System: V4 Update Seeded Customer Names to Indian Names
-- Preserves login usernames while updating customer display names & emails
-- ==============================================================================

UPDATE customers
SET first_name = 'Aarav',
    last_name  = 'Sharma',
    email      = 'aarav.sharma@apexbank.com'
WHERE customer_number = 'CUST1001';

UPDATE customers
SET first_name = 'Priya',
    last_name  = 'Patel',
    email      = 'priya.patel@apexbank.com'
WHERE customer_number = 'CUST1002';
