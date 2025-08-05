// src/middleware/auth.ts
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

export const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required' 
      });
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      return res.status(500).json({ 
        message: 'Server configuration error' 
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Optional: Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found' 
      });
    }

    // Attach user info to request object
    req.user = {
      id: user.id,
      email: user.email
    };

    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        message: 'Token expired' 
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
};