import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateJWT, requirePermission } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();
const prisma = new PrismaClient();

// Helper to auto-generate unique contract number
async function generateContractNumber(): Promise<string> {
  const settings = await prisma.systemSetting.findFirst();
  const prefix = settings ? settings.contractCodePrefix : 'PLAN-CON-';
  const year = new Date().getFullYear();
  const count = await prisma.contract.count();
  const nextNum = String(count + 1).padStart(4, '0');
  return `${prefix}${year}-${nextNum}`;
}

// GET /api/contracts
router.get('/', authenticateJWT, requirePermission('contracts:read'), async (req, res) => {
  const { search, vendorId, projectId, status } = req.query;

  const whereClause: any = {};
  if (vendorId) whereClause.vendorId = String(vendorId);
  if (projectId) whereClause.projectId = String(projectId);
  if (status) whereClause.status = String(status);

  if (search) {
    const searchStr = String(search);
    whereClause.OR = [
      { title: { contains: searchStr } },
      { contractNumber: { contains: searchStr } }
    ];
  }

  try {
    const contracts = await prisma.contract.findMany({
      where: whereClause,
      include: {
        vendor: true,
        project: true,
        grant: true,
        contractManager: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(contracts);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/contracts/:id
router.get('/:id', authenticateJWT, requirePermission('contracts:read'), async (req, res) => {
  const { id } = req.params;

  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        vendor: true,
        project: true,
        grant: true,
        donor: true,
        department: true,
        contractManager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        assets: true,
        milestones: { orderBy: { dueDate: 'asc' } },
        payments: { orderBy: { dueDate: 'asc' } },
        amendments: { orderBy: { amendmentDate: 'desc' } }
      }
    });

    if (!contract) return res.status(404).json({ error: 'Contract not found.' });

    return res.json(contract);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/contracts
router.post('/', authenticateJWT, requirePermission('contracts:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const contractNumber = await generateContractNumber();
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    const assetIds = req.body.assetIds || []; // Array of Asset IDs to link

    const data = {
      ...req.body,
      contractNumber,
      startDate,
      endDate,
      value: parseFloat(req.body.value),
      noticePeriodDays: parseInt(req.body.noticePeriodDays || 30),
      createdBy: req.user?.email || 'System',
      updatedBy: req.user?.email || 'System',
    };

    // Remove client UI helpers
    delete data.assetIds;

    const contract = await prisma.contract.create({
      data: {
        ...data,
        assets: {
          connect: assetIds.map((aid: string) => ({ id: aid }))
        }
      },
      include: { vendor: true }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTRACT_CREATE',
      module: 'Contracts',
      recordId: contract.id,
      newValue: contract,
      notes: `Created contract: ${contract.title} (${contract.contractNumber})`
    });

    return res.status(201).json(contract);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

// PUT /api/contracts/:id
router.put('/:id', authenticateJWT, requirePermission('contracts:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Contract not found.' });

    const startDate = req.body.startDate ? new Date(req.body.startDate) : existing.startDate;
    const endDate = req.body.endDate ? new Date(req.body.endDate) : existing.endDate;
    const assetIds = req.body.assetIds || [];

    const data = {
      ...req.body,
      startDate,
      endDate,
      value: req.body.value ? parseFloat(req.body.value) : existing.value,
      noticePeriodDays: req.body.noticePeriodDays ? parseInt(req.body.noticePeriodDays) : existing.noticePeriodDays,
      updatedBy: req.user?.email || 'System'
    };

    delete data.contractNumber;
    delete data.assetIds;

    // Disconnect old assets and connect new ones if assetIds is provided
    const updatePayload: any = { ...data };
    if (req.body.assetIds) {
      updatePayload.assets = {
        set: assetIds.map((aid: string) => ({ id: aid }))
      };
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: updatePayload,
      include: { vendor: true }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTRACT_UPDATE',
      module: 'Contracts',
      recordId: contract.id,
      previousValue: existing,
      newValue: contract,
      notes: `Updated contract: ${contract.title}`
    });

    return res.json(contract);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/contracts/:id/renew - Renew Contract
router.post('/:id/renew', authenticateJWT, requirePermission('contracts:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { newEndDate, amendmentCost, notes } = req.body;

  if (!newEndDate) return res.status(400).json({ error: 'New end date is required.' });

  try {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Contract not found.' });

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        endDate: new Date(newEndDate),
        status: 'Renewed',
        renewalStatus: 'Renewed',
        value: existing.value + parseFloat(amendmentCost || 0)
      }
    });

    // Create an amendment record for this renewal
    await prisma.contractAmendment.create({
      data: {
        contractId: id,
        amendmentNumber: `REN-${Date.now().toString().slice(-4)}`,
        description: notes || 'Contract terms extended.',
        costChange: parseFloat(amendmentCost || 0),
        endDateChange: new Date(newEndDate),
        approvedBy: req.user?.email || 'System'
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTRACT_RENEW',
      module: 'Contracts',
      recordId: id,
      notes: `Renewed contract until ${newEndDate}`
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/contracts/:id/milestones - Add milestone
router.post('/:id/milestones', authenticateJWT, requirePermission('contracts:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, description, dueDate } = req.body;

  if (!title || !dueDate) {
    return res.status(400).json({ error: 'Title and due date are required.' });
  }

  try {
    const milestone = await prisma.contractMilestone.create({
      data: {
        contractId: id,
        title,
        description: description || '',
        dueDate: new Date(dueDate),
        status: 'Pending'
      }
    });
    return res.status(201).json(milestone);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/contracts/milestones/:milestoneId - Update milestone
router.put('/milestones/:milestoneId', authenticateJWT, requirePermission('contracts:write'), async (req, res) => {
  const { milestoneId } = req.params;
  const { status, achievedDate, notes } = req.body;

  try {
    const milestone = await prisma.contractMilestone.update({
      where: { id: milestoneId },
      data: {
        status,
        achievedDate: achievedDate ? new Date(achievedDate) : null,
        notes
      }
    });
    return res.json(milestone);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/contracts/:id/payments - Add payment item
router.post('/:id/payments', authenticateJWT, requirePermission('contracts:write'), async (req, res) => {
  const { id } = req.params;
  const { amount, currency, dueDate, notes } = req.body;

  if (!amount || !dueDate) {
    return res.status(400).json({ error: 'Amount and due date are required.' });
  }

  try {
    const payment = await prisma.contractPayment.create({
      data: {
        contractId: id,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        dueDate: new Date(dueDate),
        status: 'Planned',
        notes
      }
    });
    return res.status(201).json(payment);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/contracts/payments/:paymentId - Pay invoice
router.put('/payments/:paymentId', authenticateJWT, requirePermission('contracts:write'), async (req: AuthenticatedRequest, res) => {
  const { paymentId } = req.params;
  const { invoiceNumber, notes } = req.body;

  try {
    const payment = await prisma.contractPayment.update({
      where: { id: paymentId },
      data: {
        status: 'Paid',
        paidDate: new Date(),
        invoiceNumber,
        notes
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CONTRACT_PAYMENT_PAY',
      module: 'Contracts',
      recordId: payment.contractId,
      notes: `Paid invoice for contract payment item. Invoice: ${invoiceNumber}`
    });

    return res.json(payment);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/contracts/:id/amendments - Add amendment
router.post('/:id/amendments', authenticateJWT, requirePermission('contracts:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { amendmentNumber, description, costChange, endDateChange } = req.body;

  try {
    const amendment = await prisma.contractAmendment.create({
      data: {
        contractId: id,
        amendmentNumber,
        description,
        costChange: parseFloat(costChange || 0),
        endDateChange: endDateChange ? new Date(endDateChange) : null,
        approvedBy: req.user?.email || 'System'
      }
    });

    // Update contract overall value and end date if modified
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (contract) {
      await prisma.contract.update({
        where: { id },
        data: {
          value: contract.value + parseFloat(costChange || 0),
          endDate: endDateChange ? new Date(endDateChange) : contract.endDate
        }
      });
    }

    return res.status(201).json(amendment);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
