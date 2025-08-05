// src/routes/companies.ts
import express from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.string().max(50).optional(),
  location: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional()
});

const updateCompanySchema = createCompanySchema.partial();

// GET /api/companies - Get all companies for user
router.get('/', async (req: any, res: any) => {
  try {
    const { search, industry, sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Build filter conditions
    const where: any = {
      userId: req.user!.id
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { industry: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (industry && industry !== 'all') {
      where.industry = industry;
    }

    // Build sort conditions
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    const companies = await prisma.company.findMany({
      where,
      orderBy,
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    res.json({
      companies,
      total: companies.length
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      message: 'Failed to fetch companies',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/companies/:id - Get specific company
router.get('/:id', async (req: any, res: any) => {
  try {
    const companyId = parseInt(req.params.id);

    if (isNaN(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: req.user!.id
      },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 applications
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ company });

  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ 
      message: 'Failed to fetch company',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// POST /api/companies - Create new company
router.post('/', async (req: any, res: any) => {
  try {
    const validatedData = createCompanySchema.parse(req.body);

    // Check if company with same name already exists for this user
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: validatedData.name,
        userId: req.user!.id
      }
    });

    if (existingCompany) {
      return res.status(400).json({
        message: 'Company with this name already exists'
      });
    }

    // Create company data
    const companyData: any = {
      name: validatedData.name,
      userId: req.user!.id
    };

    // Add optional fields if provided
    if (validatedData.website) companyData.website = validatedData.website;
    if (validatedData.industry) companyData.industry = validatedData.industry;
    if (validatedData.location) companyData.location = validatedData.location;
    if (validatedData.description) companyData.description = validatedData.description;
    if (validatedData.notes) companyData.notes = validatedData.notes;

    const company = await prisma.company.create({
      data: companyData,
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Company created successfully',
      company
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Error creating company:', error);
    res.status(500).json({ 
      message: 'Failed to create company',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// PUT /api/companies/:id - Update company
router.put('/:id', async (req: any, res: any) => {
  try {
    const companyId = parseInt(req.params.id);

    if (isNaN(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    const validatedData = updateCompanySchema.parse(req.body);

    // Check if company exists and belongs to user
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: req.user!.id
      }
    });

    if (!existingCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // If name is being updated, check for duplicates
    if (validatedData.name && validatedData.name !== existingCompany.name) {
      const duplicateCompany = await prisma.company.findFirst({
        where: {
          name: validatedData.name,
          userId: req.user!.id,
          id: { not: companyId }
        }
      });

      if (duplicateCompany) {
        return res.status(400).json({
          message: 'Company with this name already exists'
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.website !== undefined) updateData.website = validatedData.website;
    if (validatedData.industry !== undefined) updateData.industry = validatedData.industry;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const company = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    res.json({
      message: 'Company updated successfully',
      company
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }

    console.error('Error updating company:', error);
    res.status(500).json({ 
      message: 'Failed to update company',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// DELETE /api/companies/:id - Delete company
router.delete('/:id', async (req: any, res: any) => {
  try {
    const companyId = parseInt(req.params.id);

    if (isNaN(companyId)) {
      return res.status(400).json({ message: 'Invalid company ID' });
    }

    // Check if company exists and belongs to user
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: req.user!.id
      },
      include: {
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if company has applications
    if (company._count.applications > 0) {
      return res.status(400).json({
        message: `Cannot delete company with ${company._count.applications} application(s). Please delete applications first.`
      });
    }

    await prisma.company.delete({
      where: { id: companyId }
    });

    res.json({
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ 
      message: 'Failed to delete company',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/companies/stats - Get company statistics
router.get('/stats/overview', async (req: any, res: any) => {
  try {
    const [totalCompanies, industriesCount] = await Promise.all([
      prisma.company.count({
        where: { userId: req.user!.id }
      }),
      prisma.company.groupBy({
        by: ['industry'],
        where: { 
          userId: req.user!.id,
          industry: { not: null }
        },
        _count: true
      })
    ]);

    const topIndustries = industriesCount
      .sort((a, b) => b._count - a._count)
      .slice(0, 5)
      .map(item => ({
        industry: item.industry,
        count: item._count
      }));

    res.json({
      totalCompanies,
      topIndustries,
      totalIndustries: industriesCount.length
    });

  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch company statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;