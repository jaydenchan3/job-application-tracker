import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req: any, res: any) => {
  try {
    const userId = req.user!.id;

    // Get basic counts
    const [
      totalApplications,
      totalCompanies,
      applicationsByStatus,
      recentApplications,
      applicationsByMonth
    ] = await Promise.all([
      // Total applications
      prisma.application.count({
        where: { userId }
      }),

      // Total companies
      prisma.company.count({
        where: { userId }
      }),

      // Applications by status
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: true
      }),

      // Recent applications (last 5)
      prisma.application.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true
            }
          }
        }
      }),

      // Applications by month (last 6 months) - using simpler query for compatibility
      prisma.application.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // Last 6 months
          }
        },
        select: {
          createdAt: true,
          status: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    // Format status data with your comprehensive statuses
    const statusStats = {
      applied: 0,
      reviewing: 0,
      interview_scheduled: 0,
      interviewed: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0
    };

    applicationsByStatus.forEach((item: any) => {
      statusStats[item.status as keyof typeof statusStats] = item._count;
    });

    // Calculate rates based on your status model
    const interviewStatuses = ['interview_scheduled', 'interviewed', 'offer'];
    const responseStatuses = ['reviewing', 'interview_scheduled', 'interviewed', 'offer', 'rejected'];
    
    const interviewCount = applicationsByStatus
      .filter(item => interviewStatuses.includes(item.status))
      .reduce((sum, item) => sum + item._count, 0);

    const responseCount = applicationsByStatus
      .filter(item => responseStatuses.includes(item.status))
      .reduce((sum, item) => sum + item._count, 0);

    const responseRate = totalApplications > 0 ? Math.round((responseCount / totalApplications) * 100) : 0;
    const interviewRate = totalApplications > 0 ? Math.round((interviewCount / totalApplications) * 100) : 0;

    // Format monthly data
    const monthlyData: { [key: string]: any } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[monthKey] = {
        month: monthKey,
        applied: 0,
        reviewing: 0,
        interview_scheduled: 0,
        interviewed: 0,
        offer: 0,
        rejected: 0,
        withdrawn: 0
      };
    }

    // Populate with actual data
    applicationsByMonth.forEach(app => {
      const date = new Date(app.createdAt);
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey][app.status]++;
      }
    });

    const monthlyStats = Object.values(monthlyData);

    res.json({
      overview: {
        totalApplications,
        totalCompanies,
        responseRate,
        interviewRate
      },
      statusBreakdown: statusStats,
      recentApplications,
      monthlyTrends: monthlyStats,
      generated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/dashboard/activity - Get recent activity
router.get('/activity', async (req: any, res: any) => {
  try {
    const userId = req.user!.id;
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);

    // Get recent status changes
    const recentActivity = await prisma.statusHistory.findMany({
      where: {
        application: { userId }
      },
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        application: {
          select: {
            id: true,
            positionTitle: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const formattedActivity = recentActivity.map(item => ({
      id: item.id,
      type: 'status_change',
      description: `Application status changed to ${item.status.replace('_', ' ')}`,
      details: {
        applicationId: item.application.id,
        positionTitle: item.application.positionTitle,
        companyName: item.application.company.name,
        status: item.status,
        notes: item.notes
      },
      createdAt: item.createdAt
    }));

    res.json({
      activity: formattedActivity,
      total: formattedActivity.length
    });

  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ 
      message: 'Failed to fetch activity',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// GET /api/dashboard/insights - Get insights and recommendations
router.get('/insights', async (req: any, res: any) => {
  try {
    const userId = req.user!.id;

    // Get applications from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      recentApplications,
      topPerformingIndustries,
      upcomingInterviews,
      pendingTasks
    ] = await Promise.all([
      // Recent applications
      prisma.application.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          company: { select: { industry: true } }
        }
      }),

      // Industries with best response rates (simplified)
      prisma.application.findMany({
        where: { userId },
        include: {
          company: { select: { industry: true } }
        }
      }),

      // Upcoming interviews
      prisma.interview.findMany({
        where: {
          application: { userId },
          scheduledDate: {
            gte: new Date()
          }
        },
        take: 5,
        orderBy: { scheduledDate: 'asc' },
        include: {
          application: {
            select: {
              positionTitle: true,
              company: { select: { name: true } }
            }
          }
        }
      }),

      // Pending tasks
      prisma.task.findMany({
        where: {
          application: { userId },
          completed: false
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: {
          application: {
            select: {
              positionTitle: true,
              company: { select: { name: true } }
            }
          }
        }
      })
    ]);

    // Generate insights
    const insights = [];

    // Application frequency insight
    const applicationCount = recentApplications.length;
    if (applicationCount < 10) {
      insights.push({
        type: 'suggestion',
        title: 'Increase Application Volume',
        message: `You've applied to ${applicationCount} jobs in the last 30 days. Consider applying to 15-20 positions monthly for better odds.`,
        priority: 'medium'
      });
    }

    // Upcoming interviews insight
    if (upcomingInterviews.length > 0) {
      insights.push({
        type: 'info',
        title: 'Upcoming Interviews',
        message: `You have ${upcomingInterviews.length} interview(s) scheduled. Make sure to prepare!`,
        priority: 'high'
      });
    }

    // Pending tasks insight
    if (pendingTasks.length > 0) {
      const overdueTasks = pendingTasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date()
      );
      
      if (overdueTasks.length > 0) {
        insights.push({
          type: 'warning',
          title: 'Overdue Tasks',
          message: `You have ${overdueTasks.length} overdue task(s). Complete them to stay on track.`,
          priority: 'high'
        });
      }
    }

    res.json({
      insights,
      metrics: {
        recentApplications: applicationCount,
        upcomingInterviews: upcomingInterviews.length,
        pendingTasks: pendingTasks.length
      },
      quickActions: {
        upcomingInterviews: upcomingInterviews.slice(0, 3),
        pendingTasks: pendingTasks.slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ 
      message: 'Failed to fetch insights',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router;