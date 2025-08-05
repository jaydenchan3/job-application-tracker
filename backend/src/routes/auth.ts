// src/routes/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';


const router = express.Router();
const prisma = new PrismaClient();

// Environment variables with defaults
const jwtSecret = process.env.JWT_SECRET || 'your-fallback-secret-key';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

// Helper function to generate JWT token
const generateToken = (userId: number, email: string) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return jwt.sign(
    { userId, email }, 
    secret,
    { expiresIn }
  );
};

// POST /api/auth/register - Register new user
router.post('/register', async (req: any, res: any) => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    const { email, password, firstName, lastName } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
        // Don't include passwordHash in response
      }
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req: any, res: any) => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Return user data (without password)
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Generate new token
    const newToken = generateToken(userId, userEmail);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req: any, res: any) => {
  // JWT logout is typically handled client-side by removing the token
  // This endpoint exists for completeness and future blacklisting features
  res.json({
    message: 'Logout successful. Please remove the token from your client.'
  });
});

export default router;