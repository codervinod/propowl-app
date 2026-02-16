-- Reset migration tracking for production
-- This will mark all current migrations as applied

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
);

-- Clear existing migration records
DELETE FROM __drizzle_migrations;

-- Mark the base migration as applied (since enums and tables exist)
INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES
    (0, '0000_tense_chat', extract(epoch from now()) * 1000);

-- Add street_line_2 column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'street_line_2'
    ) THEN
        ALTER TABLE "properties" ADD COLUMN "street_line_2" text;
    END IF;
END $$;

-- Mark the street_line_2 migration as applied
INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES
    (1, '0001_famous_makkari', extract(epoch from now()) * 1000);