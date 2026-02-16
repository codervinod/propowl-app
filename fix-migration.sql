-- Fix migration for production
-- Only add the street_line_2 column if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name = 'street_line_2'
    ) THEN
        ALTER TABLE "properties" ADD COLUMN "street_line_2" text;

        -- Insert into migration tracking table if it exists
        INSERT INTO __drizzle_migrations (id, hash, created_at)
        VALUES (1, '0001_famous_makkari', NOW())
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;