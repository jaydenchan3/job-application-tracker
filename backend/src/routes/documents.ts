// backend/src/routes/documents.ts

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExtension);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Validation schemas
const createDocumentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['resume', 'cover_letter', 'portfolio', 'transcript', 'recommendation', 'certification', 'other']),
  description: z.string().optional(),
  tags: z.string().optional(),
  category: z.string().optional(),
  applicationId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

const updateDocumentSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['resume', 'cover_letter', 'portfolio', 'transcript', 'recommendation', 'certification', 'other']).optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  category: z.string().optional(),
  applicationId: z.number().nullable().optional(),
});

// POST /api/documents - Upload new document
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate request data
    const validatedData = createDocumentSchema.parse(req.body);

    // Parse tags if provided
    const tags = validatedData.tags ? validatedData.tags.split(',').map(tag => tag.trim()) : [];

    // Generate file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Get file extension
    const fileExtension = path.extname(req.file.originalname).toLowerCase().substring(1);

    // Create document record
    const document = await prisma.document.create({
      data: {
        userId,
        name: validatedData.name,
        originalFilename: req.file.originalname,
        filename: req.file.filename,
        url: fileUrl,
        type: validatedData.type,
        mimeType: req.file.mimetype,
        size: req.file.size,
        fileExtension,
        description: validatedData.description,
        tags,
        category: validatedData.category,
        applicationId: validatedData.applicationId,
      },
      include: {
        application: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Clean up uploaded file if database operation failed
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error cleaning up file:', err);
      });
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// GET /api/documents - Get all documents
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, search, type, category } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = { userId };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { originalFilename: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (type && type !== 'all') {
      where.type = type;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          application: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit),
      }),
      prisma.document.count({ where })
    ]);

    res.json({
      documents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/documents/:id - Get specific document
router.get('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const documentId = parseInt(req.params.id);

    const document = await prisma.document.findFirst({
      where: { 
        id: documentId, 
        userId 
      },
      include: {
        application: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// PATCH /api/documents/:id - Update document
router.patch('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const documentId = parseInt(req.params.id);

    // Validate request data
    const validatedData = updateDocumentSchema.parse(req.body);

    // Check if document exists and belongs to user
    const existingDocument = await prisma.document.findFirst({
      where: { id: documentId, userId }
    });

    if (!existingDocument) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Parse tags if provided
    const updateData: any = {
      ...validatedData,
      ...(validatedData.tags && { tags: validatedData.tags.split(',').map((tag: string) => tag.trim()) })
    };

    // Update document
    const document = await prisma.document.update({
      where: { id: documentId },
      data: updateData,
      include: {
        application: {
          include: {
            company: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const documentId = parseInt(req.params.id);

    // Find document to get file path
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId }
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    if (document.filename) {
      const filePath = path.join(uploadsDir, document.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId }
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;