// src/routes/interviews.ts

import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Enum mapping functions
const mapInterviewType = (frontendValue: string) => {
  const mapping = {
    'phone': 'phone',
    'video': 'video',
    'in-person': 'in_person',
    'technical': 'technical',
    'behavioral': 'behavioral',
    'panel': 'panel',
    'final': 'final'
  };
  return mapping[frontendValue as keyof typeof mapping] || 'phone';
};

// Validation schemas
const createInterviewSchema = z.object({
  applicationId: z.number().int().positive('Application ID is required'),
  type: z.enum(['phone', 'video', 'in-person', 'technical', 'behavioral', 'panel', 'final']),
  scheduledDate: z.string().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  
  // Interviewer Information
  interviewerName: z.string().max(200).optional().nullable(),
  interviewerEmail: z.string().email().optional().or(z.literal('')).nullable(),
  interviewerTitle: z.string().max(200).optional().nullable(),
  
  // Meeting Details
  location: z.string().max(500).optional().nullable(),
  meetingLink: z.string().url().optional().or(z.literal('')).nullable(),
  meetingId: z.string().max(100).optional().nullable(),
  
  // Notes
  preparationNotes: z.string().max(2000).optional().nullable(),
  interviewNotes: z.string().max(2000).optional().nullable(),
  feedback: z.string().max(2000).optional().nullable(),
  nextSteps: z.string().max(2000).optional().nullable(),
  
  // Outcome
  outcome: z.enum(['positive', 'negative', 'neutral', 'pending']).optional().nullable()
});

const updateInterviewSchema = createInterviewSchema.partial();

// GET /api/interviews - Get all interviews with pagination and filtering
router.get('/', async (req: any, res: any) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      type,
      search, 
      sortBy = 'scheduledAt', 
      sortOrder = 'asc',
      applicationId,
      upcoming
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      application: { userId: req.user!.id }
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    if (applicationId) {
      where.applicationId = parseInt(applicationId as string);
    }

    if (upcoming === 'true') {
      where.scheduledAt = { gte: new Date() };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { interviewerName: { contains: search as string, mode: 'insensitive' } },
        { application: { 
          OR: [
            { positionTitle: { contains: search as string, mode: 'insensitive' } },
            { company: { name: { contains: search as string, mode: 'insensitive' } } }
          ]
        }}
      ];
    }

    // Build sort conditions
    const orderBy: any = {};
    if (sortBy === 'company') {
      orderBy.application = { company: { name: sortOrder } };
    } else if (sortBy === 'position') {
      orderBy.application = { positionTitle: sortOrder };
    } else if (sortBy === 'scheduledDate') {
      orderBy.scheduledDate = sortOrder;
    } else {
      orderBy[sortBy as string] = sortOrder;
    }

    // Get interviews with count
    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        orderBy,
        skip: offset,
        take: limitNum,
        include: {
          application: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  website: true,
                  industry: true,
                  location: true
                }
              }
            }
          }
        }
      }),
      prisma.interview.count({ where })
    ]);

    res.json({
      interviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ 
      message: 'Failed to fetch interviews',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/interviews/upcoming - Get upcoming interviews
router.get('/upcoming', async (req: any, res: any) => {
  try {
    const { limit = '5' } = req.query;

    const interviews = await prisma.interview.findMany({
      where: {
        application: { userId: req.user!.id },
        scheduledDate: { gte: new Date() }
      },
      include: {
        application: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                website: true
              }
            }
          }
        }
      },
      orderBy: { scheduledDate: 'asc' },
      take: parseInt(limit as string)
    });

    res.json({ interviews });

  } catch (error) {
    console.error('Error fetching upcoming interviews:', error);
    res.status(500).json({ 
      message: 'Failed to fetch upcoming interviews',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/interviews/stats - Get interview statistics
router.get('/stats', async (req: any, res: any) => {
  try {
    const userId = req.user!.id;

    // Get interview statistics
    const totalInterviews = await prisma.interview.count({
      where: { application: { userId } }
    });

    const upcomingInterviews = await prisma.interview.count({
      where: { 
        application: { userId },
        scheduledDate: { gte: new Date() }
      }
    });

    // For completed interviews, we'll use a simple count since there's no status field
    // You can later add logic based on outcome field or dates
    const pastInterviews = await prisma.interview.count({
      where: { 
        application: { userId },
        scheduledDate: { lt: new Date() }
      }
    });

    // Interview outcomes
    const positiveOutcomes = await prisma.interview.count({
      where: { 
        application: { userId },
        outcome: 'positive'
      }
    });

    // Success rate calculation
    const interviewsWithOutcome = await prisma.interview.count({
      where: { 
        application: { userId },
        outcome: { not: null }
      }
    });

    const successRate = interviewsWithOutcome > 0 
      ? Math.round((positiveOutcomes / interviewsWithOutcome) * 100) 
      : 0;

    // Interview types breakdown
    const typeBreakdown = await prisma.interview.groupBy({
      by: ['type'],
      where: { application: { userId } },
      _count: { type: true }
    });

    const stats = {
      total: totalInterviews,
      upcoming: upcomingInterviews,
      past: pastInterviews,
      successRate,
      typeBreakdown: typeBreakdown.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({ stats });

  } catch (error) {
    console.error('Error fetching interview stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch interview statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/interviews/:id - Get specific interview
router.get('/:id', async (req: any, res: any) => {
  try {
    const interviewId = parseInt(req.params.id);

    if (isNaN(interviewId)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: { userId: req.user!.id }
      },
      include: {
        application: {
          include: {
            company: true
          }
        }
      }
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json({ interview });

  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ 
      message: 'Failed to fetch interview',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/interviews - Create new interview
router.post('/', async (req: any, res: any) => {
  try {
    const validatedData = createInterviewSchema.parse(req.body);

    // Verify application belongs to user
    const application = await prisma.application.findFirst({
      where: {
        id: validatedData.applicationId,
        userId: req.user!.id
      }
    });

    if (!application) {
      return res.status(400).json({
        message: 'Application not found or does not belong to user'
      });
    }

    // Create interview data
    const interviewData: any = {
      applicationId: validatedData.applicationId,
      type: mapInterviewType(validatedData.type),
      interviewerName: validatedData.interviewerName || null,
      interviewerEmail: validatedData.interviewerEmail || null,
      interviewerTitle: validatedData.interviewerTitle || null,
      location: validatedData.location || null,
      meetingLink: validatedData.meetingLink || null,
      meetingId: validatedData.meetingId || null,
      preparationNotes: validatedData.preparationNotes || null,
      interviewNotes: validatedData.interviewNotes || null,
      feedback: validatedData.feedback || null,
      nextSteps: validatedData.nextSteps || null,
      outcome: validatedData.outcome || null
    };

    // Add optional fields if provided
    if (validatedData.scheduledDate) {
      interviewData.scheduledAt = new Date(validatedData.scheduledDate);
    }
    if (validatedData.duration) {
      interviewData.duration = validatedData.duration;
    }

    // Create interview
    const interview = await prisma.interview.create({
      data: interviewData,
      include: {
        application: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                website: true,
                industry: true,
                location: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Interview created successfully',
      interview
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Error creating interview:', error);
    res.status(500).json({ 
      message: 'Failed to create interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/interviews/:id - Update interview
router.put('/:id', async (req: any, res: any) => {
  try {
    const interviewId = parseInt(req.params.id);

    if (isNaN(interviewId)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    const validatedData = updateInterviewSchema.parse(req.body);

    // Check if interview exists and belongs to user
    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: { userId: req.user!.id }
      }
    });

    if (!existingInterview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Prepare update data
    const updateData: any = {};
    
    // Core fields
    if (validatedData.type !== undefined) updateData.type = mapInterviewType(validatedData.type);
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
    if (validatedData.scheduledDate !== undefined) {
      updateData.scheduledAt = validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null;
    }
    
    // Interviewer fields
    if (validatedData.interviewerName !== undefined) updateData.interviewerName = validatedData.interviewerName;
    if (validatedData.interviewerEmail !== undefined) updateData.interviewerEmail = validatedData.interviewerEmail;
    if (validatedData.interviewerTitle !== undefined) updateData.interviewerTitle = validatedData.interviewerTitle;
    
    // Meeting fields
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.meetingLink !== undefined) updateData.meetingLink = validatedData.meetingLink;
    if (validatedData.meetingId !== undefined) updateData.meetingId = validatedData.meetingId;
    
    // Notes and outcome
    if (validatedData.preparationNotes !== undefined) updateData.preparationNotes = validatedData.preparationNotes;
    if (validatedData.interviewNotes !== undefined) updateData.interviewNotes = validatedData.interviewNotes;
    if (validatedData.feedback !== undefined) updateData.feedback = validatedData.feedback;
    if (validatedData.nextSteps !== undefined) updateData.nextSteps = validatedData.nextSteps;
    if (validatedData.outcome !== undefined) updateData.outcome = validatedData.outcome;

    // Update interview
    const interview = await prisma.interview.update({
      where: { id: interviewId },
      data: updateData,
      include: {
        application: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                website: true,
                industry: true,
                location: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Interview updated successfully',
      interview
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Error updating interview:', error);
    res.status(500).json({ 
      message: 'Failed to update interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/interviews/:id - Delete interview
router.delete('/:id', async (req: any, res: any) => {
  try {
    const interviewId = parseInt(req.params.id);

    if (isNaN(interviewId)) {
      return res.status(400).json({ message: 'Invalid interview ID' });
    }

    // Check if interview exists and belongs to user
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: { userId: req.user!.id }
      }
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Delete interview
    await prisma.interview.delete({
      where: { id: interviewId }
    });

    res.json({
      message: 'Interview deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting interview:', error);
    res.status(500).json({ 
      message: 'Failed to delete interview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;