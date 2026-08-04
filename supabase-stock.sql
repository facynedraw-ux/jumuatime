-- Gestion du stock — Jumua Time
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter la colonne stock (null = illimité)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS stock integer DEFAULT NULL;

-- 2. Fonction atomique de décrémentation (évite les race conditions)
CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE resources
  SET stock = GREATEST(stock - 1, 0)
  WHERE id = product_id AND stock IS NOT NULL;
$$;
