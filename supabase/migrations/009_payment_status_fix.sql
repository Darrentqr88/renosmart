-- Migration: Fix payment_phases status constraint and values
-- Old constraint: status IN ('pending', 'due', 'paid')
-- New constraint: status IN ('not_due', 'pending', 'collected')

-- Drop old constraint
ALTER TABLE payment_phases DROP CONSTRAINT IF EXISTS payment_phases_status_check;

-- Migrate existing data to new status values
UPDATE payment_phases SET status = 'collected' WHERE status = 'paid';
UPDATE payment_phases SET status = 'pending'   WHERE status = 'due';
UPDATE payment_phases SET status = 'not_due'   WHERE status NOT IN ('collected', 'pending');

-- Add new constraint
ALTER TABLE payment_phases ADD CONSTRAINT payment_phases_status_check
  CHECK (status IN ('not_due', 'pending', 'collected'));

-- Update default
ALTER TABLE payment_phases ALTER COLUMN status SET DEFAULT 'not_due';
