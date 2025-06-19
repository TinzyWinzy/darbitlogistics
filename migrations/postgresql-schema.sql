-- Create UUID extension for better IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Parent Bookings table
CREATE TABLE IF NOT EXISTS parent_bookings (
    id TEXT PRIMARY KEY DEFAULT 'PB-' || substr(md5(random()::text), 1, 8),
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    total_tonnage DECIMAL(10,2) NOT NULL CHECK (total_tonnage > 0),
    commodity TEXT NOT NULL,
    loading_point TEXT NOT NULL,
    destination TEXT NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    booking_code TEXT UNIQUE,
    notes TEXT,
    status TEXT DEFAULT 'Active',
    remaining_tonnage DECIMAL(10,2),
    completed_tonnage DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- Deliveries table (now as child bookings)
CREATE TABLE IF NOT EXISTS deliveries (
    tracking_id TEXT PRIMARY KEY,
    parent_booking_id TEXT REFERENCES parent_bookings(id),
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    current_status TEXT NOT NULL,
    booking_reference TEXT UNIQUE NOT NULL,
    loading_point TEXT NOT NULL,
    commodity TEXT NOT NULL,
    container_count INTEGER NOT NULL CHECK (container_count > 0),
    tonnage DECIMAL(10,2) NOT NULL CHECK (tonnage > 0),
    destination TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    checkpoints JSONB DEFAULT '[]'::jsonb,
    driver_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tonnage_within_parent CHECK (tonnage > 0)
);

-- Create an index for faster parent booking lookups
CREATE INDEX IF NOT EXISTS idx_deliveries_parent_booking ON deliveries(parent_booking_id);

-- Create or replace the view for progress tracking
CREATE OR REPLACE VIEW booking_progress AS
SELECT 
    pb.id as parent_booking_id,
    pb.customer_name,
    pb.total_tonnage,
    pb.deadline,
    pb.commodity,
    pb.loading_point,
    pb.destination,
    COALESCE(pb.booking_code, '') as booking_code,
    pb.notes,
    pb.status,
    COALESCE(SUM(CASE WHEN d.is_completed THEN d.tonnage ELSE 0 END), 0) as completed_tonnage,
    COALESCE(SUM(d.tonnage), 0) as allocated_tonnage,
    COALESCE(COUNT(d.tracking_id), 0) as total_deliveries,
    COALESCE(SUM(CASE WHEN d.is_completed THEN 1 ELSE 0 END), 0) as completed_deliveries,
    CASE 
        WHEN pb.total_tonnage = 0 THEN 0
        ELSE ROUND((COALESCE(SUM(CASE WHEN d.is_completed THEN d.tonnage ELSE 0 END), 0) / pb.total_tonnage * 100)::numeric, 2)
    END as completion_percentage,
    EXTRACT(EPOCH FROM (pb.deadline - CURRENT_TIMESTAMP)) as seconds_until_deadline
FROM parent_bookings pb
LEFT JOIN deliveries d ON pb.id = d.parent_booking_id
GROUP BY pb.id, pb.customer_name, pb.total_tonnage, pb.deadline, pb.commodity, pb.loading_point, pb.destination, pb.booking_code, pb.notes, pb.status;

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

-- Trigger for automatic completion status
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
    SELECT total_tonnage INTO parent_total
    FROM parent_bookings
    WHERE id = NEW.parent_booking_id;

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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tonnage validation
CREATE TRIGGER validate_tonnage_trigger
BEFORE INSERT OR UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION validate_tonnage();

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
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

-- Add trigger for deliveries with IF NOT EXISTS
DROP TRIGGER IF EXISTS update_deliveries_updated_at ON deliveries;
CREATE TRIGGER update_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a default operator user (plaintext password for dev only)
INSERT INTO users (username, password)
VALUES ('operator', 'changeme')
ON CONFLICT (username) DO NOTHING; 