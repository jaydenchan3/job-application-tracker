// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import companyRoutes from './routes/companies';
import dashboardRoutes from './routes/dashboard';
import interviewRoutes from './routes/interviews'
import documentsRoutes from './routes/documents';

import { PrismaClient } from '@prisma/client';
const testPrisma = new PrismaClient();

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// CORS configuration - MOVED TO TOP AND ENHANCED
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : [
        'http://localhost:3000', 
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS FIRST - before any other middleware
app.use(cors(corsOptions));

// Add CORS debugging middleware
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} from origin: ${req.headers.origin}`);
  next();
});

// Security middleware - MODIFIED HELMET CONFIG
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

// Rate limiting - EXEMPTED auth endpoints from rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // SKIP rate limiting for auth endpoints during development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/api/auth')) {
      return true;
    }
    return false;
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint - ENHANCED
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: corsOptions.origin,
      credentials: corsOptions.credentials
    },
    port: PORT
  });
});
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// CORS preflight handler for all routes
app.options('*', cors(corsOptions));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/documents', documentsRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.stack);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Database connection
testPrisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error) => console.error('❌ Database connection failed:', error));

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for:`, corsOptions.origin);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
});

export default app;