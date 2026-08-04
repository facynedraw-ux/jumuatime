-- Nettoyage tables obsolètes Jumua Time (ancienne ère Maktaba Tour)
-- À exécuter dans Supabase SQL Editor
-- VÉRIFIER une dernière fois avant d'exécuter !

DROP TABLE IF EXISTS reading_list CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS themes CASCADE;
DROP TABLE IF EXISTS publishers CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS books CASCADE;
