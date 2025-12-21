import bcrypt from 'bcrypt';
import { router } from '@/lib/router';
import { query, queryOne } from '@/services/db';
import { generateToken, requireAuth } from '@/middleware/auth';
import type { User, JWTPayload } from '@/types';
import { corsHeaders } from '@/middleware/cors';

// Register new user
router.post('/api/auth/register', async (req) => {
  try {
    const body = await req.json() as { username: string; email: string; password: string };
    const { username, email, password } = body;

    // Validation
    if (!username || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Username, email, and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Check if user exists
    const existingUser = await queryOne<User>(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email or username already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query<User>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
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
    const body = await req.json() as { email: string; password: string };
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }

    // Find user
    const user = await queryOne<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
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
      email: user.email,
    });

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
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
        email: user.email,
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
