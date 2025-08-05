// src/routes/applications.ts

import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

const mapEmploymentType = (frontendValue: string) => {
  const mapping = {
    'full-time': 'full_time',
    'part-time': 'part_time',
    'contract': 'contract',
    'internship': 'internship'
  };
  return mapping[frontendValue as keyof typeof mapping] || 'full_time';
};

const mapWorkType = (frontendValue: string) => {
  const mapping = {
    'remote': 'remote',
    'hybrid': 'hybrid',
    'on-site': 'on_site'
  };
  return mapping[frontendValue as keyof typeof mapping] || 'remote';
};

const mapPriority = (frontendValue: string) => {
  const mapping = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high'
  };
  return mapping[frontendValue as keyof typeof mapping] || 'medium';
};

// Status mapping for ApplicationStatus enum - FIXED TYPE
const mapStatus = (frontendValue: string) => {
  const mapping = {
    'applied': 'applied',
    'reviewing': 'reviewing',
    'interview_scheduled': 'interview_scheduled',
    'interviewed': 'interviewed',
    'offer': 'offer',
    'rejected': 'rejected',
    'withdrawn': 'withdrawn'
  };
  return mapping[frontendValue as keyof typeof mapping] || 'applied';
};

// Validation schemas - FIXED to properly handle nullable optional fields
const createApplicationSchema = z.object({
  companyId: z.number().int().positive('Company ID is required'),
  positionTitle: z.string().min(1, 'Position title is required').max(200),
  applicationDate: z.string().optional().nullable(),
  status: z.enum(['applied', 'reviewing', 'interview_scheduled', 'interviewed', 'offer', 'rejected', 'withdrawn']).optional(),
  
  // Frontend fields - FIXED to accept null values
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship']).optional(),
  workType: z.enum(['remote', 'hybrid', 'on-site']).optional(),
  location: z.string().max(200).optional().nullable(), // FIXED: accepts null
  salaryMin: z.number().int().positive().optional().nullable(), // FIXED: accepts null
  salaryMax: z.number().int().positive().optional().nullable(), // FIXED: accepts null
  source: z.string().max(200).optional().nullable(), // FIXED: accepts null
  priority: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().max(2000).optional().nullable(), // FIXED: accepts null
  
  // Legacy fields - KEPT for backward compatibility
  jobDescription: z.string().max(5000).optional().nullable(),
  requirements: z.string().max(3000).optional().nullable(),
  salaryRange: z.string().max(100).optional().nullable(),
  applicationUrl: z.string().url().optional().or(z.literal('')).nullable(),
  referralSource: z.string().max(200).optional().nullable()
});

const updateApplicationSchema = createApplicationSchema.partial();

// GET /api/applications - Get all applications with pagination and filtering
router.get('/', async (req: any, res: any) => {
  try {
    const { 
      page = '1', 
      limit = '10', 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      companyId,
      priority
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const where: any = {
      userId: req.user!.id
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (companyId) {
      where.companyId = parseInt(companyId as string);
    }

    if (search) {
      where.OR = [
        { positionTitle: { contains: search as string, mode: 'insensitive' } },
        { company: { name: { contains: search as string, mode: 'insensitive' } } },
        { location: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Build sort conditions
    const orderBy: any = {};
    if (sortBy === 'company') {
      orderBy.company = { name: sortOrder };
    } else {
      orderBy[sortBy as string] = sortOrder;
    }

    // Get applications with count
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy,
        skip: offset,
        take: limitNum,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              industry: true,
              location: true
            }
          },
          _count: {
            select: {
              interviews: true,
              tasks: true
            }
          }
        }
      }),
      prisma.application.count({ where })
    ]);

    res.json({
      applications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ 
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/applications/:id - Get specific application
router.get('/:id', async (req: any, res: any) => {
  try {
    const applicationId = parseInt(req.params.id);

    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: req.user!.id
      },
      include: {
        company: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        },
        interviews: {
          orderBy: { scheduledDate: 'asc' }
        },
        tasks: {
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          orderBy: { uploadedAt: 'desc' }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ application });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      message: 'Failed to fetch application',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/applications - Create new application
router.post('/', async (req: any, res: any) => {
  try {
    const validatedData = createApplicationSchema.parse(req.body);

    // Verify company belongs to user
    const company = await prisma.company.findFirst({
      where: {
        id: validatedData.companyId,
        userId: req.user!.id
      }
    });

    if (!company) {
      return res.status(400).json({
        message: 'Company not found or does not belong to user'
      });
    }

    // Create application data - UPDATED with enum mapping
    const applicationData: any = {
      userId: req.user!.id,
      companyId: validatedData.companyId,
      positionTitle: validatedData.positionTitle,
      status: validatedData.status ? mapStatus(validatedData.status) : 'applied',
      priority: validatedData.priority ? mapPriority(validatedData.priority) : 'medium',
      
      // Frontend fields with enum mapping - FIXED
      employmentType: validatedData.employmentType ? mapEmploymentType(validatedData.employmentType) : 'full_time',
      workType: validatedData.workType ? mapWorkType(validatedData.workType) : 'remote',
      location: validatedData.location || null,
      salaryMin: validatedData.salaryMin || null,
      salaryMax: validatedData.salaryMax || null,
      source: validatedData.source || null,
      notes: validatedData.notes || null
    };

    // Add optional fields if provided - EXISTING LOGIC
    if (validatedData.applicationDate) {
      applicationData.applicationDate = new Date(validatedData.applicationDate);
    }
    if (validatedData.jobDescription) applicationData.jobDescription = validatedData.jobDescription;
    if (validatedData.requirements) applicationData.requirements = validatedData.requirements;
    if (validatedData.salaryRange) applicationData.salaryRange = validatedData.salaryRange;
    if (validatedData.applicationUrl) applicationData.applicationUrl = validatedData.applicationUrl;
    if (validatedData.referralSource) applicationData.referralSource = validatedData.referralSource;

    // Create application
    const application = await prisma.application.create({
      data: applicationData,
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
    });

    // Create initial status history entry - FIXED enum type
    await prisma.statusHistory.create({
      data: {
        applicationId: application.id,
        status: application.status, // Use the already-mapped status from application
        notes: 'Application created'
      }
    });

    res.status(201).json({
      message: 'Application created successfully',
      application
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Error creating application:', error);
    res.status(500).json({ 
      message: 'Failed to create application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/applications/:id - Update application
router.put('/:id', async (req: any, res: any) => {
  try {
    const applicationId = parseInt(req.params.id);

    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    const validatedData = updateApplicationSchema.parse(req.body);

    // Check if application exists and belongs to user
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: req.user!.id
      }
    });

    if (!existingApplication) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // If companyId is being updated, verify it belongs to user
    if (validatedData.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: validatedData.companyId,
          userId: req.user!.id
        }
      });

      if (!company) {
        return res.status(400).json({
          message: 'Company not found or does not belong to user'
        });
      }
    }

    // Prepare update data - UPDATED with enum mapping
    const updateData: any = {};
    
    // Core fields with enum mapping
    if (validatedData.positionTitle) updateData.positionTitle = validatedData.positionTitle;
    if (validatedData.companyId) updateData.companyId = validatedData.companyId;
    if (validatedData.status) updateData.status = mapStatus(validatedData.status);
    if (validatedData.priority) updateData.priority = mapPriority(validatedData.priority);
    if (validatedData.applicationDate) updateData.applicationDate = new Date(validatedData.applicationDate);
    
    // Frontend fields with enum mapping - FIXED
    if (validatedData.employmentType !== undefined) updateData.employmentType = mapEmploymentType(validatedData.employmentType);
    if (validatedData.workType !== undefined) updateData.workType = mapWorkType(validatedData.workType);
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.salaryMin !== undefined) updateData.salaryMin = validatedData.salaryMin;
    if (validatedData.salaryMax !== undefined) updateData.salaryMax = validatedData.salaryMax;
    if (validatedData.source !== undefined) updateData.source = validatedData.source;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    
    // Legacy fields - KEPT
    if (validatedData.jobDescription !== undefined) updateData.jobDescription = validatedData.jobDescription;
    if (validatedData.requirements !== undefined) updateData.requirements = validatedData.requirements;
    if (validatedData.salaryRange !== undefined) updateData.salaryRange = validatedData.salaryRange;
    if (validatedData.applicationUrl !== undefined) updateData.applicationUrl = validatedData.applicationUrl;
    if (validatedData.referralSource !== undefined) updateData.referralSource = validatedData.referralSource;

    // Update application
    const application = await prisma.application.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
            location: true
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Create status history entry if status changed - FIXED enum type
    if (validatedData.status && validatedData.status !== existingApplication.status) {
      await prisma.statusHistory.create({
        data: {
          applicationId: application.id,
          status: application.status, // Use the already-mapped status from application
          notes: `Status updated to ${validatedData.status}`
        }
      });
    }

    res.json({
      message: 'Application updated successfully',
      application
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Error updating application:', error);
    res.status(500).json({ 
      message: 'Failed to update application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/applications/:id - Delete application
router.delete('/:id', async (req: any, res: any) => {
  try {
    const applicationId = parseInt(req.params.id);

    if (isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    // Check if application exists and belongs to user
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId: req.user!.id
      }
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Delete application (cascade will handle related records)
    await prisma.application.delete({
      where: { id: applicationId }
    });

    res.json({
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ 
      message: 'Failed to delete application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/applications/bulk - Bulk delete applications - ADDED
router.delete('/bulk', async (req: any, res: any) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty IDs array' });
    }

    // Verify all applications belong to user
    const applications = await prisma.application.findMany({
      where: {
        id: { in: ids },
        userId: req.user!.id
      }
    });

    if (applications.length !== ids.length) {
      return res.status(400).json({ 
        message: 'Some applications not found or do not belong to user' 
      });
    }

    // Delete applications
    const result = await prisma.application.deleteMany({
      where: {
        id: { in: ids },
        userId: req.user!.id
      }
    });

    res.json({
      message: `${result.count} applications deleted successfully`,
      deletedCount: result.count
    });

  } catch (error) {
    console.error('Error bulk deleting applications:', error);
    res.status(500).json({ 
      message: 'Failed to delete applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;