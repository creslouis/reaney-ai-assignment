-- Migration: Add password_hash and make google_sub nullable
-- Run this ONCE against your existing database if you already have the admin_users table.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ALTER COLUMN google_sub DROP NOT NULL;
