-- Add 'proposal_sent' to activity_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'proposal_sent' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type')
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'proposal_sent';
  END IF;
END $$;