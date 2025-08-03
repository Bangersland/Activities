    -- Appointment Slots Table Setup for Supabase
    -- Run this in your Supabase SQL Editor

    -- Create appointment_slots table
    CREATE TABLE IF NOT EXISTS public.appointment_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    available_slots INTEGER NOT NULL DEFAULT 40,
    remaining_slots INTEGER NOT NULL DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable Row Level Security
    ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

    -- Create policies for appointment_slots table
    CREATE POLICY "Allow authenticated users to view all appointment slots" ON public.appointment_slots
    FOR SELECT USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to insert appointment slots" ON public.appointment_slots
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to update appointment slots" ON public.appointment_slots
    FOR UPDATE USING (auth.role() = 'authenticated');

    CREATE POLICY "Allow authenticated users to delete appointment slots" ON public.appointment_slots
    FOR DELETE USING (auth.role() = 'authenticated');

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_appointment_slots_date ON public.appointment_slots(date);
    CREATE INDEX IF NOT EXISTS idx_appointment_slots_remaining ON public.appointment_slots(remaining_slots);

    -- Create function to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_appointment_slots_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for updated_at
    DROP TRIGGER IF EXISTS update_appointment_slots_updated_at_trigger ON public.appointment_slots;
    CREATE TRIGGER update_appointment_slots_updated_at_trigger
    BEFORE UPDATE ON public.appointment_slots
    FOR EACH ROW EXECUTE FUNCTION update_appointment_slots_updated_at();

    -- Create function to calculate slot percentage
    CREATE OR REPLACE FUNCTION get_slot_percentage(slot_date DATE)
    RETURNS TABLE (
    date DATE,
    available_slots INTEGER,
    remaining_slots INTEGER,
    filled_slots INTEGER,
    percentage_filled NUMERIC
    ) AS $$
    BEGIN
    RETURN QUERY
    SELECT 
        slots.date,
        slots.available_slots,
        slots.remaining_slots,
        (slots.available_slots - slots.remaining_slots) as filled_slots,
        ROUND(
        ((slots.available_slots - slots.remaining_slots)::NUMERIC / slots.available_slots::NUMERIC) * 100, 
        1
        ) as percentage_filled
    FROM public.appointment_slots slots
    WHERE slots.date = slot_date;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Grant necessary permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_slots TO authenticated;
    GRANT EXECUTE ON FUNCTION get_slot_percentage(DATE) TO authenticated;

    -- Insert some sample data for testing
    INSERT INTO public.appointment_slots (date, available_slots, remaining_slots) VALUES
    ('2025-08-05', 40, 16),
    ('2025-08-06', 40, 25),
    ('2025-08-07', 40, 40),
    ('2025-08-08', 40, 8),
    ('2025-08-09', 40, 32)
    ON CONFLICT (date) DO NOTHING; 