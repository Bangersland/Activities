-- Create vaccines table
CREATE TABLE IF NOT EXISTS public.vaccines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vaccine_brand VARCHAR(255) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    expiry_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'out_of_stock', 'low_on_stock', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

-- Create policies for vaccines table
CREATE POLICY "Allow authenticated users to view vaccines" ON public.vaccines
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert vaccines" ON public.vaccines
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update vaccines" ON public.vaccines
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete vaccines" ON public.vaccines
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vaccines_brand ON public.vaccines(vaccine_brand);
CREATE INDEX IF NOT EXISTS idx_vaccines_status ON public.vaccines(status);
CREATE INDEX IF NOT EXISTS idx_vaccines_expiry ON public.vaccines(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vaccines_created_at ON public.vaccines(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vaccines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vaccines_updated_at
    BEFORE UPDATE ON public.vaccines
    FOR EACH ROW
    EXECUTE FUNCTION update_vaccines_updated_at();

-- Create function to automatically update status based on stock and expiry date
CREATE OR REPLACE FUNCTION update_vaccine_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Set status to 'expired' if expiry date is in the past
    IF NEW.expiry_date < CURRENT_DATE THEN
        NEW.status = 'expired';
    ELSIF NEW.stock_quantity = 0 THEN
        -- Set status to 'out_of_stock' if no stock
        NEW.status = 'out_of_stock';
    ELSIF NEW.stock_quantity <= 20 THEN
        -- Set status to 'low_on_stock' if stock is 20 or less
        NEW.status = 'low_on_stock';
    ELSE
        NEW.status = 'available';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vaccine_status_trigger
    BEFORE INSERT OR UPDATE ON public.vaccines
    FOR EACH ROW
    EXECUTE FUNCTION update_vaccine_status();

-- Insert sample data
INSERT INTO public.vaccines (vaccine_brand, stock_quantity, expiry_date, status) VALUES
('Pfizer-BioNTech', 150, '2025-12-31', 'available'),
('Moderna', 200, '2025-10-15', 'available'),
('Johnson & Johnson', 15, '2025-08-20', 'low_on_stock'),
('AstraZeneca', 0, '2025-06-30', 'out_of_stock'),
('Sinovac', 120, '2025-09-15', 'available');

-- Grant permissions
GRANT ALL ON public.vaccines TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 