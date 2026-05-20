-- Run this in your Supabase SQL Editor
-- Enhances trips into full "Stocks" with customs fees

-- Add new columns to trips table
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS customs_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'arrived', 'closed')),
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'Espagne',
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Link products to a stock/trip
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL;
