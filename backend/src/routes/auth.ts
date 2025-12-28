import bcrypt from 'bcryptjs';
import validator from 'validator';
import { router } from '@/lib/router';
import { query, queryOne } from '@/services/db';
import { generateToken, requireAuth } from '@/middleware/auth';
import type { User } from '@/types';
import { corsHeaders } from '@/middleware/cors';

// Register new user
router.post('/api/auth/register', async (req) => {
  try {
    const body = await req.json() as { username: string; password: string };
    const { username, password } = body;

    // Validation
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return new Response(
        JSON.stringify({
          error: 'Password must be at least 8 characters and include upper, lower, number, and symbol',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Check if user exists
    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this username already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    const email = `${username}@users.mymemorycard.local`;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query<{ id: string; username: string }>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, created_at`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          username: user.username,
        },
        token,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
});

// Login
router.post('/api/auth/login', async (req) => {
  try {
    const body = await req.json() as { username: string; password: string };
    const { username, password } = body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Find user
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
    });

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          username: user.username,
        },
        token,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
    );
  }
});

// Get current user
router.get('/api/auth/me', requireAuth(async (req, user) => {
  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        username: user.username,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
  );
}));

// Health check
router.get('/api/health', async () => {
  return new Response(
    JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
  );
});
