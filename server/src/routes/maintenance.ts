import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateJWT, requirePermission } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();
const prisma = new PrismaClient();

// GET /api/maintenance/schedules - list schedules
router.get('/schedules', authenticateJWT, requirePermission('maintenance:read'), async (req, res) => {
  try {
    const schedules = await prisma.maintenanceSchedule.findMany({
      include: { asset: true },
      orderBy: { nextDueDate: 'asc' }
    });
    return res.json(schedules);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/maintenance/schedules - create schedule
router.post('/schedules', authenticateJWT, requirePermission('maintenance:write'), async (req: AuthenticatedRequest, res) => {
  const { assetId, maintenanceType, description, frequencyDays, nextDueDate } = req.body;

  if (!assetId || !maintenanceType || !frequencyDays || !nextDueDate) {
    return res.status(400).json({ error: 'Asset ID, type, frequency, and next due date are required.' });
  }

  try {
    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        assetId,
        maintenanceType,
        description,
        frequencyDays: parseInt(frequencyDays),
        nextDueDate: new Date(nextDueDate),
        status: 'Active'
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'MAINT_SCHEDULE_CREATE',
      module: 'Assets',
      recordId: schedule.id,
      notes: `Created maintenance schedule for asset ${assetId}`
    });

    return res.status(201).json(schedule);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/maintenance/work-orders - list work orders
router.get('/work-orders', authenticateJWT, requirePermission('maintenance:read'), async (req, res) => {
  try {
    const workOrders = await prisma.maintenanceWorkOrder.findMany({
      include: {
        asset: {
          select: { name: true, assetCode: true, assetTag: true }
        },
        vendor: true
      },
      orderBy: { scheduledDate: 'asc' }
    });
    return res.json(workOrders);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/maintenance/work-orders - create work order
router.post('/work-orders', authenticateJWT, requirePermission('maintenance:write'), async (req: AuthenticatedRequest, res) => {
  const { assetId, type, description, vendorId, assignedOfficerId, priority, scheduledDate, checklist } = req.body;

  if (!assetId || !type || !priority || !scheduledDate) {
    return res.status(400).json({ error: 'Asset ID, type, priority, and scheduled date are required.' });
  }

  try {
    const workOrder = await prisma.maintenanceWorkOrder.create({
      data: {
        assetId,
        type,
        description,
        vendorId: vendorId || null,
        assignedOfficerId: assignedOfficerId || null,
        priority,
        status: 'Scheduled',
        scheduledDate: new Date(scheduledDate),
        checklist: JSON.stringify(checklist || [])
      }
    });

    // Update asset status to "Under Maintenance" if corrective and high priority
    if (type === 'Corrective' && priority === 'Critical') {
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: 'Under Maintenance' }
      });
    }

    await logAudit({
      userId: req.user?.userId,
      action: 'MAINT_WO_CREATE',
      module: 'Assets',
      recordId: workOrder.id,
      notes: `Created work order WO for asset: ${assetId}`
    });

    return res.status(201).json(workOrder);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/maintenance/work-orders/:id - update work order
router.put('/work-orders/:id', authenticateJWT, requirePermission('maintenance:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.maintenanceWorkOrder.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Work order not found.' });

    const updatePayload = {
      ...req.body,
      scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : existing.scheduledDate,
      startDate: req.body.startDate ? new Date(req.body.startDate) : existing.startDate,
      completionDate: req.body.completionDate ? new Date(req.body.completionDate) : existing.completionDate,
      cost: req.body.cost ? parseFloat(req.body.cost) : existing.cost,
      checklist: req.body.checklist ? JSON.stringify(req.body.checklist) : existing.checklist
    };

    const workOrder = await prisma.maintenanceWorkOrder.update({
      where: { id },
      data: updatePayload
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'MAINT_WO_UPDATE',
      module: 'Assets',
      recordId: id,
      notes: `Updated work order status to ${workOrder.status}`
    });

    return res.json(workOrder);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/maintenance/work-orders/:id/start - start work order
router.post('/work-orders/:id/start', authenticateJWT, requirePermission('maintenance:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const wo = await prisma.maintenanceWorkOrder.findUnique({ where: { id } });
    if (!wo) return res.status(404).json({ error: 'Work order not found.' });

    const updated = await prisma.maintenanceWorkOrder.update({
      where: { id },
      data: {
        status: 'In Progress',
        startDate: new Date()
      }
    });

    // Mark asset status as Under Maintenance
    await prisma.asset.update({
      where: { id: wo.assetId },
      data: { status: 'Under Maintenance' }
    });

    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: wo.assetId,
        eventType: 'Maintenance',
        performedBy: req.user?.email || 'System',
        description: `Maintenance work order (WO-${wo.id.slice(0, 8)}) started.`
      }
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/maintenance/work-orders/:id/complete - complete work order
router.post('/work-orders/:id/complete', authenticateJWT, requirePermission('maintenance:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { cost, completionReport, checklistState } = req.body;

  try {
    const wo = await prisma.maintenanceWorkOrder.findUnique({ where: { id } });
    if (!wo) return res.status(404).json({ error: 'Work order not found.' });

    const updated = await prisma.maintenanceWorkOrder.update({
      where: { id },
      data: {
        status: 'Completed',
        completionDate: new Date(),
        cost: cost ? parseFloat(cost) : wo.cost,
        completionReport,
        checklist: checklistState ? JSON.stringify(checklistState) : wo.checklist
      }
    });

    // Mark asset status back to Assigned or Available (default to Assigned if custodian exists, else Available)
    const asset = await prisma.asset.findUnique({ where: { id: wo.assetId } });
    if (asset) {
      const nextStatus = asset.custodianId ? 'Assigned' : 'Available';
      await prisma.asset.update({
        where: { id: wo.assetId },
        data: { status: nextStatus }
      });

      await prisma.assetLifecycleEvent.create({
        data: {
          assetId: wo.assetId,
          eventType: 'Maintenance',
          performedBy: req.user?.email || 'System',
          description: `Maintenance completed. Report: ${completionReport || 'N/A'}. Cost: USD ${cost || 0}.`
        }
      });
    }

    // Update next run date in schedule if this was a scheduled preventive task
    const schedule = await prisma.maintenanceSchedule.findFirst({
      where: { assetId: wo.assetId, status: 'Active' }
    });
    if (schedule) {
      const newNextDate = new Date();
      newNextDate.setDate(newNextDate.getDate() + schedule.frequencyDays);
      await prisma.maintenanceSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRunDate: new Date(),
          nextDueDate: newNextDate
        }
      });
    }

    await logAudit({
      userId: req.user?.userId,
      action: 'MAINT_WO_COMPLETE',
      module: 'Assets',
      recordId: id,
      notes: `Completed work order with cost USD ${cost}`
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
