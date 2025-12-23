-- Initialization script for Docker PostgreSQL container
-- This runs automatically on first container start
-- Note: schema.sql is automatically run after this file by Docker

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
