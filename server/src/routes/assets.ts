import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateJWT, requirePermission } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();
const prisma = new PrismaClient();

// Helper to auto-generate unique asset code
async function generateAssetCode(categoryId: string): Promise<string> {
  const category = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error('Category not found');

  const settings = await prisma.systemSetting.findFirst();
  const prefix = settings ? settings.assetCodePrefix : 'PLAN-AST-';
  const catPrefix = category.prefix;

  const count = await prisma.asset.count({
    where: { categoryId }
  });

  const nextIndex = String(count + 1).padStart(4, '0');
  return `${prefix}${catPrefix}${nextIndex}`;
}

// GET /api/assets/categories - Fetch categories
router.get('/categories', authenticateJWT, async (req, res) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/categories - Create category
router.post('/categories', authenticateJWT, requirePermission('assets:write'), async (req: AuthenticatedRequest, res) => {
  const { name, code, prefix, description } = req.body;

  if (!name || !code || !prefix) {
    return res.status(400).json({ error: 'Name, code, and prefix are required.' });
  }

  try {
    const existing = await prisma.assetCategory.findFirst({
      where: { OR: [{ name }, { code }, { prefix }] }
    });
    if (existing) {
      return res.status(400).json({ error: 'Category with similar name, code, or prefix already exists.' });
    }

    const category = await prisma.assetCategory.create({
      data: { name, code, prefix, description }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'CATEGORY_CREATE',
      module: 'Assets',
      recordId: category.id,
      newValue: category,
      notes: `Created asset category: ${name}`
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/assets - Fetch all assets with advanced search and filters
router.get('/', authenticateJWT, async (req, res) => {
  const { search, categoryId, officeId, projectId, grantId, condition, status, donorId } = req.query;

  const whereClause: any = {};

  if (categoryId) whereClause.categoryId = String(categoryId);
  if (officeId) whereClause.officeId = String(officeId);
  if (projectId) whereClause.projectId = String(projectId);
  if (grantId) whereClause.grantId = String(grantId);
  if (donorId) whereClause.donorId = String(donorId);
  if (condition) whereClause.condition = String(condition);
  if (status) whereClause.status = String(status);

  if (search) {
    const searchStr = String(search);
    whereClause.OR = [
      { name: { contains: searchStr } },
      { assetCode: { contains: searchStr } },
      { assetTag: { contains: searchStr } },
      { serialNumber: { contains: searchStr } },
      { model: { contains: searchStr } }
    ];
  }

  try {
    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        category: true,
        office: true,
        project: true,
        grant: true,
        donor: true,
        custodian: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/assets/:id - Fetch single asset profile with complete history timeline
router.get('/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        donor: true,
        grant: true,
        project: true,
        department: true,
        office: true,
        custodian: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        assignments: {
          orderBy: { assignedDate: 'desc' }
        },
        transfers: {
          orderBy: { transferDate: 'desc' }
        },
        lifecycleEvents: {
          orderBy: { eventDate: 'desc' }
        },
        maintenanceWorkOrders: {
          include: { vendor: true },
          orderBy: { scheduledDate: 'desc' }
        },
        contracts: true
      }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets - Register asset
router.post('/', authenticateJWT, requirePermission('assets:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const assetCode = await generateAssetCode(req.body.categoryId);
    const purchaseDate = new Date(req.body.purchaseDate);
    const warrantyStart = req.body.warrantyStart ? new Date(req.body.warrantyStart) : null;
    const warrantyEnd = req.body.warrantyEnd ? new Date(req.body.warrantyEnd) : null;

    const data = {
      ...req.body,
      assetCode,
      purchaseDate,
      warrantyStart,
      warrantyEnd,
      purchaseCost: parseFloat(req.body.purchaseCost),
      currentValue: parseFloat(req.body.purchaseCost), // Initially current value equals purchase cost
      usefulLifeYears: parseInt(req.body.usefulLifeYears),
      createdBy: req.user?.email || 'System',
      updatedBy: req.user?.email || 'System',
    };

    const asset = await prisma.asset.create({
      data,
      include: { category: true }
    });

    // Write to Lifecycle Events
    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: asset.id,
        eventType: 'Acquisition',
        performedBy: req.user?.email || 'System',
        description: `Asset registered in database under funding line. Value: ${asset.currency} ${asset.purchaseCost}.`,
        notes: 'Initial registration audit completed.'
      }
    });

    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: asset.id,
        eventType: 'Tagging',
        performedBy: req.user?.email || 'System',
        description: `Physical asset barcode tag generated and attached: ${asset.assetTag}`,
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSET_CREATE',
      module: 'Assets',
      recordId: asset.id,
      newValue: asset,
      notes: `Registered asset: ${asset.name} (${asset.assetCode})`
    });

    return res.status(201).json(asset);
  } catch (error: any) {
    console.error('Asset creation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

// PUT /api/assets/:id - Update asset
router.put('/:id', authenticateJWT, requirePermission('assets:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    const purchaseDate = req.body.purchaseDate ? new Date(req.body.purchaseDate) : existing.purchaseDate;
    const warrantyStart = req.body.warrantyStart ? new Date(req.body.warrantyStart) : existing.warrantyStart;
    const warrantyEnd = req.body.warrantyEnd ? new Date(req.body.warrantyEnd) : existing.warrantyEnd;

    const updateData = {
      ...req.body,
      purchaseDate,
      warrantyStart,
      warrantyEnd,
      purchaseCost: req.body.purchaseCost ? parseFloat(req.body.purchaseCost) : existing.purchaseCost,
      currentValue: req.body.currentValue ? parseFloat(req.body.currentValue) : existing.currentValue,
      usefulLifeYears: req.body.usefulLifeYears ? parseInt(req.body.usefulLifeYears) : existing.usefulLifeYears,
      updatedBy: req.user?.email || 'System',
    };

    // Prevent direct editing of assetCode or category in updates
    delete updateData.assetCode;
    delete updateData.categoryId;

    const asset = await prisma.asset.update({
      where: { id },
      data: updateData,
      include: { category: true }
    });

    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: asset.id,
        eventType: 'Update',
        performedBy: req.user?.email || 'System',
        description: 'Asset profile information was modified.'
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSET_UPDATE',
      module: 'Assets',
      recordId: asset.id,
      previousValue: existing,
      newValue: asset,
      notes: `Updated asset: ${asset.name} (${asset.assetCode})`
    });

    return res.json(asset);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/:id/assign - Assign asset to custodian
router.post('/:id/assign', authenticateJWT, requirePermission('assets:assign'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { custodianId, returnDueDate, conditionOnAssignment, notes } = req.body;

  if (!custodianId || !conditionOnAssignment) {
    return res.status(400).json({ error: 'Custodian ID and condition are required.' });
  }

  try {
    const asset = await prisma.asset.findUnique({ where: { id }, include: { custodian: true } });
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });

    const user = await prisma.user.findUnique({ where: { id: custodianId } });
    if (!user) return res.status(400).json({ error: 'Custodian user not found.' });

    // Create Assignment Record
    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId: id,
        custodianId,
        assignedBy: req.user?.email || 'System',
        returnDueDate: returnDueDate ? new Date(returnDueDate) : null,
        conditionOnAssignment,
        status: 'Active',
        notes
      }
    });

    // Update Asset Status
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        status: 'Assigned',
        custodianId
      }
    });

    // Lifecycle Timeline entry
    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: id,
        eventType: 'Assignment',
        performedBy: req.user?.email || 'System',
        description: `Asset assigned to custodian: ${user.firstName} ${user.lastName} (${user.email}). Condition: ${conditionOnAssignment}.`,
        notes
      }
    });

    // Create system notification for custodian
    await prisma.notification.create({
      data: {
        userId: custodianId,
        title: 'New Asset Assigned',
        message: `Asset ${asset.name} (${asset.assetCode}) has been assigned to you. Due date for return: ${returnDueDate || 'N/A'}.`,
        type: 'AssetDisposal',
        entityType: 'Asset',
        entityId: id
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSET_ASSIGN',
      module: 'Assets',
      recordId: id,
      newValue: assignment,
      notes: `Assigned asset ${asset.assetCode} to ${user.email}`
    });

    return res.json(updatedAsset);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/:id/return - Return assigned asset
router.post('/:id/return', authenticateJWT, requirePermission('assets:assign'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { conditionOnReturn, notes } = req.body;

  if (!conditionOnReturn) {
    return res.status(400).json({ error: 'Condition on return is required.' });
  }

  try {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { custodian: true }
    });
    if (!asset || !asset.custodianId) {
      return res.status(400).json({ error: 'Asset is not assigned to anyone.' });
    }

    const previousCustodian = asset.custodian;

    // Find Active Assignment
    const activeAssignment = await prisma.assetAssignment.findFirst({
      where: { assetId: id, custodianId: asset.custodianId, status: 'Active' }
    });

    if (activeAssignment) {
      await prisma.assetAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: 'Returned',
          returnedDate: new Date(),
          conditionOnReturn,
          notes: notes || activeAssignment.notes
        }
      });
    }

    // Update Asset status
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        status: 'Available',
        custodianId: null,
        condition: conditionOnReturn
      }
    });

    // Lifecycle Timeline entry
    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: id,
        eventType: 'Return',
        performedBy: req.user?.email || 'System',
        description: `Returned by custodian: ${previousCustodian?.firstName} ${previousCustodian?.lastName}. Returned condition: ${conditionOnReturn}.`,
        notes
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSET_RETURN',
      module: 'Assets',
      recordId: id,
      notes: `Returned asset ${asset.assetCode} from custodian`
    });

    return res.json(updatedAsset);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/:id/transfer - Request Transfer
router.post('/:id/transfer', authenticateJWT, requirePermission('assets:transfer'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { transferType, destOfficeId, destProjectId, notes } = req.body;

  try {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });

    const transfer = await prisma.assetTransfer.create({
      data: {
        assetId: id,
        transferType,
        sourceOfficeId: asset.officeId,
        sourceProjectId: asset.projectId,
        destOfficeId: destOfficeId || null,
        destProjectId: destProjectId || null,
        requestedBy: req.user?.email || 'System',
        status: 'Pending',
        notes
      }
    });

    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: id,
        eventType: 'TransferRequest',
        performedBy: req.user?.email || 'System',
        description: `Initiated transfer request (${transferType}). Status: Pending Approval.`,
        notes
      }
    });

    // Notify operations head for approval
    const operationsHead = await prisma.user.findFirst({
      where: { role: { name: 'Head of Operations' } }
    });
    if (operationsHead) {
      await prisma.notification.create({
        data: {
          userId: operationsHead.id,
          title: 'Asset Transfer Requested',
          message: `Asset ${asset.name} (${asset.assetCode}) transfer has been requested. Review required.`,
          type: 'AssetDisposal',
          entityType: 'Asset',
          entityId: id
        }
      });
    }

    return res.status(201).json(transfer);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/transfers/:transferId/approve - Approve / Reject Transfer
router.post('/transfers/:transferId/approve', authenticateJWT, requirePermission('assets:transfer'), async (req: AuthenticatedRequest, res) => {
  const { transferId } = req.params;
  const { action, notes } = req.body; // "Approved" or "Rejected"

  if (action !== 'Approved' && action !== 'Rejected') {
    return res.status(400).json({ error: 'Action must be Approved or Rejected' });
  }

  try {
    const transfer = await prisma.assetTransfer.findUnique({ where: { id: transferId }, include: { asset: true } });
    if (!transfer) return res.status(404).json({ error: 'Transfer request not found.' });

    const updatedTransfer = await prisma.assetTransfer.update({
      where: { id: transferId },
      data: {
        status: action,
        approvedBy: req.user?.email || 'System',
        notes: notes || transfer.notes
      }
    });

    if (action === 'Approved') {
      const updatePayload: any = {};
      if (transfer.destOfficeId) updatePayload.officeId = transfer.destOfficeId;
      if (transfer.destProjectId) updatePayload.projectId = transfer.destProjectId;

      await prisma.asset.update({
        where: { id: transfer.assetId },
        data: updatePayload
      });

      await prisma.assetLifecycleEvent.create({
        data: {
          assetId: transfer.assetId,
          eventType: 'TransferApproved',
          performedBy: req.user?.email || 'System',
          description: `Transfer approved. Relocated to destination. Approved by ${req.user?.email}.`
        }
      });

      await logAudit({
        userId: req.user?.userId,
        action: 'ASSET_TRANSFER_APPROVE',
        module: 'Assets',
        recordId: transfer.assetId,
        notes: `Approved asset transfer for ${transfer.asset.assetCode}`
      });
    } else {
      await prisma.assetLifecycleEvent.create({
        data: {
          assetId: transfer.assetId,
          eventType: 'TransferRejected',
          performedBy: req.user?.email || 'System',
          description: `Transfer rejected. Reason: ${notes || 'Not specified'}.`
        }
      });
    }

    return res.json(updatedTransfer);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/:id/dispose - Request Disposal
router.post('/:id/dispose', authenticateJWT, requirePermission('assets:dispose'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason, disposalMethod, estimatedProceeds, notes } = req.body;

  if (!reason || !disposalMethod) {
    return res.status(400).json({ error: 'Reason and disposal method are required.' });
  }

  try {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });

    // Request disposal via custom lifecycle event (Status is still available/under review)
    await prisma.asset.update({
      where: { id },
      data: { status: 'Disposed' } // Directly mark status or set under disposal review
    });

    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: id,
        eventType: 'DisposalRequest',
        performedBy: req.user?.email || 'System',
        description: `Disposal requested. Method: ${disposalMethod}. Reason: ${reason}. Proceeds: USD ${estimatedProceeds || 0}.`,
        notes
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSET_DISPOSAL_REQUEST',
      module: 'Assets',
      recordId: id,
      notes: `Requested asset disposal for ${asset.assetCode}`
    });

    return res.json({ message: 'Disposal workflow initiated.' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/bulk-import - Mock CSV upload
router.post('/bulk-import', authenticateJWT, requirePermission('assets:write'), async (req: AuthenticatedRequest, res) => {
  const { assets } = req.body; // Array of asset payloads

  if (!Array.isArray(assets)) {
    return res.status(400).json({ error: 'Payload must contain assets array.' });
  }

  try {
    const created = [];
    for (const a of assets) {
      const assetCode = await generateAssetCode(a.categoryId);
      const newAsset = await prisma.asset.create({
        data: {
          ...a,
          assetCode,
          purchaseDate: new Date(a.purchaseDate),
          currentValue: parseFloat(a.purchaseCost),
          purchaseCost: parseFloat(a.purchaseCost),
          usefulLifeYears: parseInt(a.usefulLifeYears),
          createdBy: req.user?.email || 'Bulk System',
          updatedBy: req.user?.email || 'Bulk System'
        }
      });
      created.push(newAsset);
    }

    return res.json({ success: true, count: created.length });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/assets/:id - Soft Delete Asset (Retired status)
router.delete('/:id', authenticateJWT, requirePermission('assets:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.asset.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Asset not found.' });

    const asset = await prisma.asset.update({
      where: { id },
      data: { status: 'Retired' }
    });

    await prisma.assetLifecycleEvent.create({
      data: {
        assetId: id,
        eventType: 'Retirement',
        performedBy: req.user?.email || 'System',
        description: 'Asset has been retired and removed from active registries.'
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSET_DELETE',
      module: 'Assets',
      recordId: id,
      notes: `Soft deleted (retired) asset ${existing.assetCode}`
    });

    return res.json({ success: true, status: 'Retired' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
