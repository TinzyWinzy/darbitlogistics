-- Create UUID extension for better IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate ENUM for mineral types to include a comprehensive list
-- This is done in a transaction to ensure data integrity during migration
DO $$
BEGIN
    -- Step 0: Drop the dependent view
    DROP VIEW IF EXISTS booking_progress;

    -- Step 1: Temporarily convert the column to TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parent_bookings' AND column_name = 'mineral_type'
    ) THEN
        ALTER TABLE parent_bookings ALTER COLUMN mineral_type TYPE TEXT;
    END IF;

    -- Step 1.5: Drop the default value
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parent_bookings' AND column_name = 'mineral_type'
    ) THEN
        ALTER TABLE parent_bookings ALTER COLUMN mineral_type DROP DEFAULT;
    END IF;

    -- Step 2: Drop the old ENUM type if it exists
    DROP TYPE IF EXISTS mineral_type;

    -- Step 3: Create the new, comprehensive ENUM type
    CREATE TYPE mineral_type AS ENUM (
        'Agate', 'Adamite', 'Andalusite', 'Anhydrite', 'Angelisite', 'Anthophyllite', 'Antimony', 'Aragonite', 'Arucite', 'Arsenic', 
        'Bauxite', 'Beryl', 'Bismuth', 'Bornite', 'Calcite', 'Chalcocite', 'Chalcopyrite', 'Chromite', 'Coal', 'Cobalt', 'Copper', 
        'Copper Ore', 'Corundum', 'Corndian', 'Diamond', 'Dolomite', 'Fireclay', 'Galena', 'Galena (Lead)', 'Gold', 'Gold Ore', 'Graphite', 'Gypsum', 'Hematite', 'Hematite (Iron ore)',
        'Iron Ore', 'Jasper', 'Kaolinite Clay', 'Kyanite', 'Lead', 'Lepidolite', 'Limestone', 'Limonite Clay', 'Magnesite', 'Manganese', 
        'Marble', 'Mercury', 'Modalite', 'Molybdenum', 'Monazite', 'Mtorolite', 'Muscovite', 'Nickel', 'Orthoclase', 'PGMs', 'Platinum/PGMs', 'Phosphate', 'Phyllite', 
        'Platinum', 'Pollucite', 'Pyrite', 'Quartz', 'Rutile', 'Rutile (Titanium)', 'Scheelite', 'Schorl', 'Serpentine', 'Sillimanite', 'Silver', 'Slates', 
        'Sphalerite', 'Tantalite-columbite', 'Titanium', 'Tungsten', 'Wolfram', 'Other'
    );

    -- Step 4: Convert the column back to the new ENUM type with a default
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parent_bookings' AND column_name = 'mineral_type'
    ) THEN
        ALTER TABLE parent_bookings 
        ALTER COLUMN mineral_type TYPE mineral_type 
        USING mineral_type::mineral_type;
        
        -- Reset the default value
        ALTER TABLE parent_bookings 
        ALTER COLUMN mineral_type SET DEFAULT 'Other';
    END IF;
END$$;

-- Create ENUM for mineral grade
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mineral_grade') THEN
        CREATE TYPE mineral_grade AS ENUM (
            'Premium',
            'Standard',
            'Low Grade',
            'Mixed',
            'Ungraded'
        );
    END IF;
END$$;

-- Create ENUM for delivery status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') THEN
        CREATE TYPE delivery_status AS ENUM (
            'Pending',
            'At Mine',
            'In Transit',
            'At Border',
            'At Port',
            'At Port of Destination',
            'At Warehouse',
            'Delivered',
            'Cancelled'
        );
    END IF;
END$$;

-- Create ENUM for checkpoint type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkpoint_type') THEN
        CREATE TYPE checkpoint_type AS ENUM (
            'Location Update',
            'Status Change',
            'Issue Report',
            'Weight Update',
            'Sample Collection',
            'Documentation',
            'Environmental Check',
            'Other'
        );
    END IF;
END$$;

-- Parent Bookings table
CREATE TABLE IF NOT EXISTS parent_bookings (
    id TEXT PRIMARY KEY DEFAULT 'PB-' || substr(md5(random()::text), 1, 8),
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    total_tonnage DECIMAL(10,2) NOT NULL CHECK (total_tonnage > 0),
    mineral_type mineral_type NOT NULL DEFAULT 'Other',
    mineral_grade mineral_grade NOT NULL DEFAULT 'Ungraded',
    moisture_content DECIMAL(4,2) CHECK (moisture_content >= 0 AND moisture_content <= 100),
    particle_size TEXT,
    loading_point TEXT NOT NULL,
    destination TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    requires_analysis BOOLEAN DEFAULT false,
    analysis_certificate TEXT,
    special_handling_notes TEXT,
    environmental_concerns TEXT,
    booking_code TEXT UNIQUE NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    remaining_tonnage DECIMAL(10,2),
    completed_tonnage DECIMAL(10,2) DEFAULT 0,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_tonnage CHECK (completed_tonnage <= total_tonnage),
    CONSTRAINT valid_remaining CHECK (remaining_tonnage >= 0)
);

-- Add missing columns to parent_bookings if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'mineral_type') THEN
        ALTER TABLE parent_bookings ADD COLUMN mineral_type mineral_type NOT NULL DEFAULT 'Other';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'mineral_grade') THEN
        ALTER TABLE parent_bookings ADD COLUMN mineral_grade mineral_grade NOT NULL DEFAULT 'Ungraded';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'moisture_content') THEN
        ALTER TABLE parent_bookings ADD COLUMN moisture_content DECIMAL(4,2) CHECK (moisture_content >= 0 AND moisture_content <= 100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'particle_size') THEN
        ALTER TABLE parent_bookings ADD COLUMN particle_size TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'requires_analysis') THEN
        ALTER TABLE parent_bookings ADD COLUMN requires_analysis BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'analysis_certificate') THEN
        ALTER TABLE parent_bookings ADD COLUMN analysis_certificate TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'special_handling_notes') THEN
        ALTER TABLE parent_bookings ADD COLUMN special_handling_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'environmental_concerns') THEN
        ALTER TABLE parent_bookings ADD COLUMN environmental_concerns TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'created_by_user_id') THEN
        ALTER TABLE parent_bookings ADD COLUMN created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Clean up legacy columns that may exist in older database versions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parent_bookings' AND column_name = 'commodity') THEN
        ALTER TABLE parent_bookings DROP COLUMN commodity;
    END IF;
END $$;

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    tracking_id TEXT PRIMARY KEY,
    parent_booking_id TEXT REFERENCES parent_bookings(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    current_status delivery_status NOT NULL DEFAULT 'Pending',
    vehicle_type TEXT NOT NULL DEFAULT 'Standard Truck',
    vehicle_capacity DECIMAL(10,2) NOT NULL CHECK (vehicle_capacity > 0),
    tonnage DECIMAL(10,2) NOT NULL CHECK (tonnage > 0),
    container_count INTEGER NOT NULL CHECK (container_count > 0),
    has_weighbridge_cert BOOLEAN DEFAULT false,
    weighbridge_ref TEXT,
    tare_weight DECIMAL(10,2),
    net_weight DECIMAL(10,2),
    sampling_required BOOLEAN DEFAULT false,
    sampling_status TEXT,
    environmental_incident BOOLEAN DEFAULT false,
    incident_details JSONB DEFAULT '{}',
    checkpoints JSONB DEFAULT '[]'::jsonb,
    driver_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    booking_reference TEXT UNIQUE NOT NULL,
    loading_point TEXT NOT NULL,
    destination TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_weights CHECK (net_weight IS NULL OR (tare_weight IS NOT NULL AND net_weight >= 0)),
    CONSTRAINT valid_checkpoint_format CHECK (
        jsonb_typeof(checkpoints) = 'array' AND
        (
            SELECT bool_and(
                jsonb_typeof(checkpoint->'location') = 'string' AND
                jsonb_typeof(checkpoint->'operator_id') = 'number' AND
                jsonb_typeof(checkpoint->'status') = 'string' AND
                jsonb_typeof(checkpoint->'timestamp') = 'string'
            )
            FROM jsonb_array_elements(checkpoints) checkpoint
        )
    ),
    CONSTRAINT valid_driver_details CHECK (
        jsonb_typeof(driver_details) = 'object' AND
        driver_details ? 'name' AND
        driver_details ? 'vehicleReg'
    )
);

-- Add missing columns to deliveries if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'container_count') THEN
        ALTER TABLE deliveries ADD COLUMN container_count INTEGER NOT NULL DEFAULT 1 CHECK (container_count > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'tonnage') THEN
        ALTER TABLE deliveries ADD COLUMN tonnage DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'is_completed') THEN
        ALTER TABLE deliveries ADD COLUMN is_completed BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'completion_date') THEN
        ALTER TABLE deliveries ADD COLUMN completion_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'booking_reference') THEN
        ALTER TABLE deliveries ADD COLUMN booking_reference TEXT UNIQUE NOT NULL DEFAULT 'BR-' || substr(md5(random()::text), 1, 8);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'loading_point') THEN
        ALTER TABLE deliveries ADD COLUMN loading_point TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'destination') THEN
        ALTER TABLE deliveries ADD COLUMN destination TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'vehicle_type') THEN
        ALTER TABLE deliveries ADD COLUMN vehicle_type TEXT NOT NULL DEFAULT 'Standard Truck';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'vehicle_capacity') THEN
        ALTER TABLE deliveries ADD COLUMN vehicle_capacity DECIMAL(10,2) NOT NULL DEFAULT 30.00;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'has_weighbridge_cert') THEN
        ALTER TABLE deliveries ADD COLUMN has_weighbridge_cert BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'weighbridge_ref') THEN
        ALTER TABLE deliveries ADD COLUMN weighbridge_ref TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'tare_weight') THEN
        ALTER TABLE deliveries ADD COLUMN tare_weight DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'net_weight') THEN
        ALTER TABLE deliveries ADD COLUMN net_weight DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'sampling_required') THEN
        ALTER TABLE deliveries ADD COLUMN sampling_required BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'sampling_status') THEN
        ALTER TABLE deliveries ADD COLUMN sampling_status TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'environmental_incident') THEN
        ALTER TABLE deliveries ADD COLUMN environmental_incident BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'incident_details') THEN
        ALTER TABLE deliveries ADD COLUMN incident_details JSONB DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'created_by_user_id') THEN
        ALTER TABLE deliveries ADD COLUMN created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add parent_booking_id to deliveries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'deliveries' 
        AND column_name = 'parent_booking_id'
    ) THEN
        ALTER TABLE deliveries 
        ADD COLUMN parent_booking_id TEXT REFERENCES parent_bookings(id);
    END IF;
END $$;

-- Create an index for faster parent booking lookups
CREATE INDEX IF NOT EXISTS idx_deliveries_parent_booking ON deliveries(parent_booking_id);

-- Function to update delivery completion
CREATE OR REPLACE FUNCTION update_delivery_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_status = 'Delivered' AND OLD.current_status != 'Delivered' THEN
        NEW.is_completed = TRUE;
        NEW.completion_date = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate delivery completion trigger
DROP TRIGGER IF EXISTS delivery_completion_trigger ON deliveries;
CREATE TRIGGER delivery_completion_trigger
BEFORE UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION update_delivery_completion();

-- Function to validate tonnage against parent booking
CREATE OR REPLACE FUNCTION validate_tonnage()
RETURNS TRIGGER AS $$
DECLARE
    total_allocated DECIMAL(10,2);
    parent_total DECIMAL(10,2);
BEGIN
    -- Get parent booking's total tonnage
    SELECT total_tonnage, remaining_tonnage INTO parent_total
    FROM parent_bookings
    WHERE id = NEW.parent_booking_id;

    IF NEW.tonnage > parent_total THEN
        RAISE EXCEPTION 'Delivery tonnage (%) exceeds parent booking total (%)',
            NEW.tonnage, parent_total;
    END IF;

    -- Calculate total allocated tonnage including new delivery
    SELECT COALESCE(SUM(tonnage), 0) INTO total_allocated
    FROM deliveries
    WHERE parent_booking_id = NEW.parent_booking_id
    AND tracking_id != NEW.tracking_id;

    total_allocated := total_allocated + NEW.tonnage;

    -- Validate total allocated doesn't exceed parent total
    IF total_allocated > parent_total THEN
        RAISE EXCEPTION 'Total allocated tonnage (%) exceeds parent booking total (%)',
            total_allocated, parent_total;
    END IF;

    -- Update parent booking's remaining tonnage
    UPDATE parent_bookings 
    SET remaining_tonnage = total_tonnage - total_allocated,
        completed_tonnage = CASE 
            WHEN NEW.is_completed THEN total_allocated
            ELSE (SELECT COALESCE(SUM(tonnage), 0) 
                  FROM deliveries 
                  WHERE parent_booking_id = NEW.parent_booking_id 
                  AND is_completed = true)
        END
    WHERE id = NEW.parent_booking_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate tonnage validation trigger
DROP TRIGGER IF EXISTS validate_tonnage_trigger ON deliveries;
CREATE TRIGGER validate_tonnage_trigger
BEFORE INSERT OR UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION validate_tonnage();

-- Drop and recreate users table to ensure correct structure
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('operator', 'admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_name);
CREATE INDEX IF NOT EXISTS idx_deliveries_parent ON deliveries(parent_booking_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(current_status);
CREATE INDEX IF NOT EXISTS idx_parent_bookings_status ON parent_bookings(status);
CREATE INDEX IF NOT EXISTS idx_parent_bookings_deadline ON parent_bookings(deadline);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate updated_at triggers
DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
CREATE TRIGGER update_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parent_bookings_updated_at ON parent_bookings;
CREATE TRIGGER update_parent_bookings_updated_at
    BEFORE UPDATE ON parent_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recreate the view after all table modifications
CREATE OR REPLACE VIEW booking_progress AS
SELECT 
    pb.id as parent_booking_id,
    pb.customer_name,
    pb.phone_number,
    pb.total_tonnage,
    pb.deadline,
    pb.mineral_type,
    pb.mineral_grade,
    pb.loading_point,
    pb.destination,
    pb.booking_code,
    pb.notes,
    pb.status,
    COALESCE(SUM(CASE WHEN d.is_completed THEN d.tonnage ELSE 0 END), 0) as completed_tonnage,
    COALESCE(SUM(d.tonnage), 0) as allocated_tonnage,
    COALESCE(COUNT(d.tracking_id), 0) as total_deliveries,
    COALESCE(SUM(CASE WHEN d.is_completed THEN 1 ELSE 0 END), 0) as completed_deliveries,
    CASE 
        WHEN pb.total_tonnage = 0 THEN 0
        ELSE ROUND((COALESCE(SUM(CASE WHEN d.is_completed THEN d.tonnage ELSE 0 END), 0) / NULLIF(pb.total_tonnage, 0) * 100)::numeric, 2)
    END as completion_percentage,
    EXTRACT(EPOCH FROM (pb.deadline - CURRENT_TIMESTAMP)) as seconds_until_deadline,
    pb.remaining_tonnage,
    pb.created_at,
    pb.updated_at,
    (
        SELECT COUNT(*) 
        FROM deliveries d2 
        WHERE d2.parent_booking_id = pb.id 
        AND d2.environmental_incident = true
    ) as environmental_incidents_count,
    (
        SELECT COUNT(*) 
        FROM deliveries d3 
        WHERE d3.parent_booking_id = pb.id 
        AND d3.sampling_required = true 
        AND d3.sampling_status = 'Pending'
    ) as pending_samples_count
FROM parent_bookings pb
LEFT JOIN deliveries d ON pb.id = d.parent_booking_id
GROUP BY pb.id, pb.customer_name, pb.phone_number, pb.total_tonnage, pb.deadline, pb.mineral_type, 
         pb.mineral_grade, pb.loading_point, pb.destination, pb.booking_code, 
         pb.notes, pb.status, pb.remaining_tonnage, pb.created_at, pb.updated_at;

-- Create checkpoint_logs table for better audit trail
CREATE TABLE IF NOT EXISTS checkpoint_logs (
    id SERIAL PRIMARY KEY,
    delivery_tracking_id TEXT REFERENCES deliveries(tracking_id) ON DELETE CASCADE,
    checkpoint_type checkpoint_type NOT NULL,
    location TEXT NOT NULL,
    operator_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    status delivery_status NOT NULL,
    coordinates TEXT,
    comment TEXT,
    has_issue BOOLEAN DEFAULT false,
    issue_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Drop the legacy 'operator' text column if it exists.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkpoint_logs' AND column_name = 'operator') THEN
        ALTER TABLE checkpoint_logs DROP COLUMN operator;
    END IF;
END $$;

-- Add missing columns to checkpoint_logs if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkpoint_logs' AND column_name = 'operator_id') THEN
        ALTER TABLE checkpoint_logs ADD COLUMN operator_id INTEGER REFERENCES users(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Create environmental_incidents table
CREATE TABLE IF NOT EXISTS environmental_incidents (
    id SERIAL PRIMARY KEY,
    delivery_tracking_id TEXT REFERENCES deliveries(tracking_id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    reported_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    location TEXT NOT NULL,
    coordinates TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create sampling_records table
CREATE TABLE IF NOT EXISTS sampling_records (
    id SERIAL PRIMARY KEY,
    delivery_tracking_id TEXT REFERENCES deliveries(tracking_id) ON DELETE CASCADE,
    sample_code TEXT UNIQUE NOT NULL,
    collected_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    collection_location TEXT NOT NULL,
    collection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sample_type TEXT NOT NULL,
    quantity DECIMAL(10,2),
    unit TEXT,
    lab_reference TEXT,
    analysis_status TEXT DEFAULT 'Pending' CHECK (analysis_status IN ('Pending', 'In Progress', 'Completed', 'Rejected')),
    results JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to validate checkpoint data
CREATE OR REPLACE FUNCTION validate_checkpoint_data()
RETURNS TRIGGER AS $$
DECLARE
    checkpoint jsonb;
BEGIN
    -- Validate checkpoint structure only if checkpoints are being provided
    IF jsonb_array_length(NEW.checkpoints) > 0 THEN
        -- Iterate over each checkpoint and validate its structure
        FOR checkpoint IN SELECT * FROM jsonb_array_elements(NEW.checkpoints)
        LOOP
            IF NOT (
                checkpoint ? 'location' AND
                checkpoint ? 'operator_id' AND
                checkpoint ? 'status' AND
                checkpoint ? 'timestamp'
            ) THEN
                RAISE EXCEPTION 'Invalid checkpoint structure: Each checkpoint must have location, operator_id, status, and timestamp.';
            END IF;
        END LOOP;
    END IF;

    -- Update current_status from the latest checkpoint
    IF TG_OP = 'UPDATE' THEN
        IF jsonb_array_length(NEW.checkpoints) > 0 THEN
            NEW.current_status = (NEW.checkpoints->-1->>'status')::delivery_status;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for checkpoint validation
DROP TRIGGER IF EXISTS validate_checkpoint_trigger ON deliveries;
CREATE TRIGGER validate_checkpoint_trigger
    BEFORE INSERT OR UPDATE OF checkpoints ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION validate_checkpoint_data();

-- Function to log checkpoints to checkpoint_logs
CREATE OR REPLACE FUNCTION log_checkpoint()
RETURNS TRIGGER AS $$
DECLARE
    new_checkpoint jsonb;
    op_id integer;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.checkpoints IS DISTINCT FROM NEW.checkpoints THEN
        -- Get the latest checkpoint
        new_checkpoint := NEW.checkpoints->-1;

        -- Validate that operator_id exists and is not null
        IF new_checkpoint->>'operator_id' IS NULL THEN
            RAISE EXCEPTION 'Checkpoint data is missing a valid operator_id';
        END IF;

        op_id := (new_checkpoint->>'operator_id')::integer;
        
        -- Insert into checkpoint_logs
        INSERT INTO checkpoint_logs (
            delivery_tracking_id,
            checkpoint_type,
            location,
            operator_id,
            status,
            coordinates,
            comment,
            has_issue,
            issue_details,
            metadata
        ) VALUES (
            NEW.tracking_id,
            COALESCE((new_checkpoint->>'type')::checkpoint_type, 'Location Update'),
            new_checkpoint->>'location',
            op_id,
            (new_checkpoint->>'status')::delivery_status,
            new_checkpoint->>'coordinates',
            new_checkpoint->>'comment',
            (new_checkpoint->>'hasIssue')::boolean,
            new_checkpoint->>'issueDetails',
            new_checkpoint
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for checkpoint logging
DROP TRIGGER IF EXISTS log_checkpoint_trigger ON deliveries;
CREATE TRIGGER log_checkpoint_trigger
    AFTER UPDATE OF checkpoints ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION log_checkpoint();

-- Update existing indexes and add new ones
CREATE INDEX IF NOT EXISTS idx_checkpoint_logs_delivery ON checkpoint_logs(delivery_tracking_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_logs_created ON checkpoint_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_environmental_incidents_delivery ON environmental_incidents(delivery_tracking_id);
CREATE INDEX IF NOT EXISTS idx_environmental_incidents_status ON environmental_incidents(status);
CREATE INDEX IF NOT EXISTS idx_sampling_records_delivery ON sampling_records(delivery_tracking_id);
CREATE INDEX IF NOT EXISTS idx_sampling_records_status ON sampling_records(analysis_status);

-- Create push_subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_info JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subscription_info)
);

-- Insert the admin and operator users with pre-hashed passwords.
INSERT INTO users (username, role, password)
VALUES
    ('hanzo', 'admin', '$2b$10$Xij6OW7UWNCECrnZNcUoe.hLMihjDm9zAVoP6aLBNwDsOLopMG0hC'),
    ('innocent', 'operator', '$2b$10$gsdpmE1AXLJk24uxlNM.KOlmWKbYps5bMlZxIy1ixA9EM3m3eVZqi'),
    ('operator', 'operator', '$2b$10$nlWGMWSdQ9Z.cmpZP6Ff1ed4eZIEQl2hpkkwnjNIy8MzRR3acQHYW'),
    ('operator1', 'operator', '$2b$10$p0/KXmJWegRtxAIG/kiKi.3SNIl93iPyggRpXzpofaE63F7wSOPQS')
ON CONFLICT (username) DO UPDATE 
SET 
    password = EXCLUDED.password,
    role = EXCLUDED.role; 