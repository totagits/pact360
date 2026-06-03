import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateJWT } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    // 1. Core Counts
    const totalAssets = await prisma.asset.count();
    
    const activeAssets = await prisma.asset.count({
      where: { status: { in: ['Available', 'Assigned', 'In Use'] } }
    });

    const underMaintenance = await prisma.asset.count({
      where: { status: 'Under Maintenance' }
    });

    const assignedToStaff = await prisma.asset.count({
      where: { custodianId: { not: null } }
    });

    const assignedToProjects = await prisma.asset.count({
      where: { projectId: { not: null } }
    });

    // 2. Financial Metrics
    const acquisitionValueResult = await prisma.asset.aggregate({
      _sum: { purchaseCost: true }
    });
    const totalAcquisitionValue = acquisitionValueResult._sum.purchaseCost || 0;

    const currentValueResult = await prisma.asset.aggregate({
      _sum: { currentValue: true }
    });
    const totalCurrentValue = currentValueResult._sum.currentValue || 0;

    const maintenanceCostResult = await prisma.maintenanceWorkOrder.aggregate({
      _sum: { cost: true }
    });
    const totalMaintenanceCost = maintenanceCostResult._sum.cost || 0;

    // 3. Contract Counts
    const totalContracts = await prisma.contract.count();
    const activeContracts = await prisma.contract.count({
      where: { status: 'Active' }
    });

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContractsCount = await prisma.contract.count({
      where: {
        status: { not: 'Expired' },
        endDate: {
          gt: now,
          lte: thirtyDaysFromNow
        }
      }
    });

    const expiredContractsCount = await prisma.contract.count({
      where: {
        OR: [
          { status: 'Expired' },
          { endDate: { lte: now } }
        ]
      }
    });

    // 4. Asset Distributions
    // Category Breakdown
    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: { select: { assets: true } },
        assets: { select: { purchaseCost: true } }
      }
    });
    const assetsByCategory = categories.map(c => ({
      name: c.name,
      count: c._count.assets,
      value: c.assets.reduce((sum, a) => sum + a.purchaseCost, 0)
    }));

    // Office Location Breakdown
    const offices = await prisma.office.findMany({
      include: {
        _count: { select: { assets: true } }
      }
    });
    const assetsByLocation = offices.map(o => ({
      name: o.name,
      count: o._count.assets
    }));

    // Condition Breakdown
    const conditions = ['New', 'Good', 'Fair', 'Poor', 'Damaged', 'Unusable'];
    const assetsByCondition = await Promise.all(conditions.map(async cond => {
      const count = await prisma.asset.count({ where: { condition: cond } });
      return { name: cond, count };
    }));

    // Status Breakdown
    const statuses = ['Available', 'Assigned', 'In Use', 'Under Maintenance', 'Damaged', 'Retired', 'Disposed'];
    const assetsByStatus = await Promise.all(statuses.map(async stat => {
      const count = await prisma.asset.count({ where: { status: stat } });
      return { name: stat, count };
    }));

    // Project Allocation Breakdown
    const projects = await prisma.project.findMany({
      include: {
        _count: { select: { assets: true } }
      },
      take: 5
    });
    const assetsByProject = projects.map(p => ({
      name: p.name,
      count: p._count.assets
    }));

    // 5. Compliance & Expiration Alerts
    // Overdue Work Orders
    const overdueMaintenanceCount = await prisma.maintenanceWorkOrder.count({
      where: {
        status: { in: ['Scheduled', 'Pending', 'In Progress'] },
        scheduledDate: { lt: now }
      }
    });

    // Expiring Warranties (next 30 days)
    const expiringWarrantiesCount = await prisma.asset.count({
      where: {
        warrantyEnd: {
          gt: now,
          lte: thirtyDaysFromNow
        }
      }
    });

    // Projects/Grants ending soon with active assets
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const grantsEndingSoon = await prisma.grant.findMany({
      where: {
        endDate: {
          gt: now,
          lte: sixtyDaysFromNow
        }
      },
      include: {
        assets: {
          where: { status: { notIn: ['Disposed', 'Retired'] } }
        }
      }
    });
    const grantsEndingSoonCount = grantsEndingSoon.length;
    const assetsLosingFundingCount = grantsEndingSoon.reduce((sum, g) => sum + g.assets.length, 0);

    // 6. Recent Activities
    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        }
      }
    });

    // 7. Upcoming maintenance calendar items
    const upcomingMaintenance = await prisma.maintenanceWorkOrder.findMany({
      where: {
        status: { in: ['Scheduled', 'Pending', 'In Progress'] },
        scheduledDate: { gte: now }
      },
      include: {
        asset: {
          select: { name: true, assetCode: true }
        }
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5
    });

    return res.json({
      metrics: {
        totalAssets,
        activeAssets,
        underMaintenance,
        assignedToStaff,
        assignedToProjects,
        totalAcquisitionValue,
        totalCurrentValue,
        totalMaintenanceCost,
        totalContracts,
        activeContracts,
        expiringContractsCount,
        expiredContractsCount,
        overdueMaintenanceCount,
        expiringWarrantiesCount,
        grantsEndingSoonCount,
        assetsLosingFundingCount
      },
      charts: {
        assetsByCategory,
        assetsByLocation,
        assetsByCondition,
        assetsByStatus,
        assetsByProject
      },
      upcomingMaintenance,
      recentActivities
    });
  } catch (error) {
    console.error('Dashboard aggregation failed:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
