-- Initialization script for Docker PostgreSQL container
-- This runs automatically on first container start

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
