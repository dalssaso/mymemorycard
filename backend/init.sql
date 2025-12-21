-- Initialization script for Docker PostgreSQL container
-- This runs automatically on first container start

-- Enable UUID v7 extension
CREATE EXTENSION IF NOT EXISTS pg_uuidv7;

-- Note: Full schema will be loaded via migrations
-- This just ensures the extension is available
