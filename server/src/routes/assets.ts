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

// ==========================================
// 8. DATA MIGRATION MODULE (Excel/CSV Imports)
// ==========================================

// POST /api/assets/import/preview - Preview and validate parsed columns
router.post('/import/preview', authenticateJWT, requirePermission('assets:write'), async (req, res) => {
  const { rows } = req.body; // Array of raw rows from parsed spreadsheet
  if (!Array.isArray(rows)) {
    return res.status(400).json({ error: 'Payload must contain rows array.' });
  }

  try {
    const categories = await prisma.assetCategory.findMany();
    const offices = await prisma.office.findMany();
    const existingTags = new Set((await prisma.asset.findMany({ select: { assetTag: true } })).map(a => a.assetTag));
    const existingSerials = new Set((await prisma.asset.findMany({ select: { serialNumber: true } })).filter(a => a.serialNumber).map(a => a.serialNumber));

    const validatedRows = [];
    const seenTagsInBatch = new Set<string>();

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const errors = [];
      
      const name = row.name || row['Asset Name'] || '';
      const assetTag = row.assetTag || row['Asset Code/Tag'] || row['Asset Tag'] || '';
      const serialNumber = row.serialNumber || row['Serial Number'] || '';
      const costStr = String(row.purchaseCost || row['Purchase Cost'] || '');
      const dateStr = String(row.purchaseDate || row['Purchase Date'] || '');
      const categoryName = row.category || row['Category'] || '';
      const officeName = row.office || row['Office/Location'] || '';

      // Required field checks
      if (!name) errors.push('Asset name is required.');
      if (!assetTag) errors.push('Asset tag is required.');
      if (!categoryName) errors.push('Asset category is required.');
      if (!officeName) errors.push('Office / Location is required.');

      // Check duplicates
      if (assetTag) {
        if (existingTags.has(assetTag)) errors.push(`Asset tag "${assetTag}" already exists in database.`);
        if (seenTagsInBatch.has(assetTag)) errors.push(`Duplicate asset tag "${assetTag}" in this import sheet.`);
        seenTagsInBatch.add(assetTag);
      }
      if (serialNumber && existingSerials.has(serialNumber)) {
        errors.push(`Serial number "${serialNumber}" already exists in database.`);
      }

      // Check Category existence
      const matchedCat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase() || c.code.toLowerCase() === categoryName.toLowerCase());
      if (categoryName && !matchedCat) {
        errors.push(`Category "${categoryName}" does not exist. Please configure it first.`);
      }

      // Check Office existence
      const matchedOff = offices.find(o => o.name.toLowerCase() === officeName.toLowerCase() || o.code.toLowerCase() === officeName.toLowerCase());
      if (officeName && !matchedOff) {
        errors.push(`Office location "${officeName}" is not registered.`);
      }

      // Cost validation
      const cost = parseFloat(costStr);
      if (costStr && (isNaN(cost) || cost < 0)) {
        errors.push('Purchase cost must be a positive number.');
      }

      // Date validation
      const purchaseDate = new Date(dateStr);
      if (dateStr && isNaN(purchaseDate.getTime())) {
        errors.push('Purchase date format is invalid.');
      }

      // Missing donor warning (non-blocking warning, but good policy)
      const donor = row.donor || row['Donor'] || '';
      const grant = row.grant || row['Grant'] || '';
      const project = row.project || row['Project'] || '';
      const warnings = [];
      if (!donor && !grant && !project) {
        warnings.push('Asset is not linked to any donor, grant, or project budget code.');
      }

      validatedRows.push({
        rowNumber: idx + 1,
        raw: row,
        name,
        assetTag,
        serialNumber,
        purchaseCost: isNaN(cost) ? 0 : cost,
        purchaseDate: isNaN(purchaseDate.getTime()) ? null : purchaseDate,
        categoryName,
        officeName,
        categoryId: matchedCat?.id || null,
        officeId: matchedOff?.id || null,
        donorCode: donor,
        grantCode: grant,
        projectCode: project,
        errors,
        warnings,
        isValid: errors.length === 0
      });
    }

    return res.json({
      totalCount: rows.length,
      validCount: validatedRows.filter(r => r.isValid).length,
      invalidCount: validatedRows.filter(r => !r.isValid).length,
      rows: validatedRows
    });
  } catch (error) {
    console.error('Import preview error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/import/commit - Commit validated import batch
router.post('/import/commit', authenticateJWT, requirePermission('assets:write'), async (req: AuthenticatedRequest, res) => {
  const { batchName, fileName, rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Payload must contain rows to commit.' });
  }

  try {
    // 1. Create the Import Batch record
    const batch = await prisma.assetImportBatch.create({
      data: {
        batchName: batchName || `Import-${new Date().toLocaleDateString()}`,
        fileName: fileName || 'spreadsheet.csv',
        rowCount: rows.length,
        status: 'Completed',
        importedBy: req.user?.email || 'System'
      }
    });

    const importedAssets = [];
    const importErrors = [];

    // Fetch related items to resolve names
    const donors = await prisma.donor.findMany();
    const grants = await prisma.grant.findMany();
    const projects = await prisma.project.findMany();

    for (const r of rows) {
      if (!r.isValid) {
        // Log errors to Database for record keeping
        for (const errMsg of r.errors) {
          const errLog = await prisma.assetImportError.create({
            data: {
              batchId: batch.id,
              rowNumber: r.rowNumber,
              columnName: 'Multiple',
              errorType: 'Validation Failure',
              errorMessage: errMsg,
              invalidValue: JSON.stringify(r.raw)
            }
          });
          importErrors.push(errLog);
        }
        continue;
      }

      // Resolve links if provided
      const donor = donors.find(d => d.code.toLowerCase() === String(r.donorCode || '').toLowerCase() || d.name.toLowerCase() === String(r.donorCode || '').toLowerCase());
      const grant = grants.find(g => g.code.toLowerCase() === String(r.grantCode || '').toLowerCase() || g.name.toLowerCase() === String(r.grantCode || '').toLowerCase());
      const project = projects.find(p => p.code.toLowerCase() === String(r.projectCode || '').toLowerCase() || p.name.toLowerCase() === String(r.projectCode || '').toLowerCase());

      // Auto-generate code
      const assetCode = await generateAssetCode(r.categoryId);

      const newAsset = await prisma.asset.create({
        data: {
          assetCode,
          assetTag: r.assetTag,
          barcode: `BAR-${assetCode}`,
          name: r.name,
          description: r.raw.description || r.raw['Asset Description'] || 'Imported via data migration spreadsheet.',
          serialNumber: r.serialNumber || null,
          model: r.raw.model || r.raw['Model'] || null,
          manufacturer: r.raw.manufacturer || r.raw['Manufacturer'] || null,
          purchaseDate: new Date(r.purchaseDate),
          purchaseCost: parseFloat(r.purchaseCost),
          currentValue: parseFloat(r.purchaseCost),
          usefulLifeYears: parseInt(r.raw.usefulLifeYears || r.raw['Useful Life'] || 5),
          condition: r.raw.condition || r.raw['Condition'] || 'Good',
          status: 'Available',
          createdBy: req.user?.email || 'System',
          updatedBy: req.user?.email || 'System',
          categoryId: r.categoryId,
          officeId: r.officeId,
          donorId: donor?.id || null,
          grantId: grant?.id || null,
          projectId: project?.id || null,
          importBatchId: batch.id
        }
      });

      // Write to Lifecycle
      await prisma.assetLifecycleEvent.create({
        data: {
          assetId: newAsset.id,
          eventType: 'Acquisition',
          performedBy: req.user?.email || 'System',
          description: `Asset imported in batch "${batch.batchName}". Tag: ${newAsset.assetTag}`
        }
      });

      importedAssets.push(newAsset);
    }

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSET_IMPORT',
      module: 'Assets',
      recordId: batch.id,
      notes: `Committed Excel/CSV asset migration batch "${batch.batchName}". Imported: ${importedAssets.length} assets.`
    });

    return res.json({
      success: true,
      batchId: batch.id,
      importedCount: importedAssets.length,
      failedCount: importErrors.length
    });
  } catch (error) {
    console.error('Import commit error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/assets/import/batches - Fetch import batches
router.get('/import/batches', authenticateJWT, async (req, res) => {
  try {
    const batches = await prisma.assetImportBatch.findMany({
      include: { errors: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(batches);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/import/batches/:id/rollback - Rollback batch assets
router.post('/import/batches/:id/rollback', authenticateJWT, requirePermission('assets:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    const batch = await prisma.assetImportBatch.findUnique({ where: { id } });
    if (!batch) return res.status(404).json({ error: 'Import batch not found.' });
    if (batch.status === 'Rolled Back') {
      return res.status(400).json({ error: 'Batch has already been rolled back.' });
    }

    // Delete assets belonging to batch
    const deleteResult = await prisma.asset.deleteMany({
      where: { importBatchId: id }
    });

    // Update batch status
    await prisma.assetImportBatch.update({
      where: { id },
      data: { status: 'Rolled Back' }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ASSET_IMPORT_ROLLBACK',
      module: 'Assets',
      recordId: id,
      notes: `Rolled back import batch "${batch.batchName}". Deleted ${deleteResult.count} imported assets.`
    });

    return res.json({ success: true, count: deleteResult.count });
  } catch (error) {
    console.error('Rollback error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 9. PHYSICAL ASSET VERIFICATION MODULE
// ==========================================

// GET /api/assets/verification/campaigns - Fetch campaigns
router.get('/verification/campaigns', authenticateJWT, async (req, res) => {
  try {
    const campaigns = await prisma.verificationCampaign.findMany({
      include: { office: true, verifications: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(campaigns);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/verification/campaigns - Create verification campaign
router.post('/verification/campaigns', authenticateJWT, requirePermission('assets:write'), async (req, res) => {
  const { name, startDate, endDate, assignedTeam, officeId } = req.body;

  if (!name || !startDate || !endDate) {
    return res.status(400).json({ error: 'Campaign name, start date, and end date are required.' });
  }

  try {
    const campaign = await prisma.verificationCampaign.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        assignedTeam: assignedTeam || 'All Logistics Team',
        status: 'Active',
        officeId: officeId || null
      },
      include: { office: true }
    });

    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Campaign creation error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/assets/verification/campaigns/:id/assets - Fetch expected assets
router.get('/verification/campaigns/:id/assets', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.verificationCampaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    // Find expected assets based on campaign target office filter
    const whereClause: any = {};
    if (campaign.officeId) {
      whereClause.officeId = campaign.officeId;
    }

    const assets = await prisma.asset.findMany({
      where: whereClause,
      include: {
        category: true,
        office: true,
        verifications: {
          where: { campaignId: id }
        }
      }
    });

    return res.json(assets);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/assets/verification/campaigns/:id/verify - Submit verification entry
router.post('/verification/campaigns/:id/verify', authenticateJWT, requirePermission('assets:assign'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { assetId, status, condition, notes, evidenceUrl } = req.body;

  if (!assetId || !status || !condition) {
    return res.status(400).json({ error: 'Asset ID, count status, and condition are required.' });
  }

  try {
    const campaign = await prisma.verificationCampaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });

    // Create verification record
    const verification = await prisma.assetVerification.create({
      data: {
        campaignId: id,
        assetId,
        verifiedBy: req.user?.email || 'System',
        status, // "Verified", "Missing", "Damaged"
        condition,
        notes,
        evidenceUrl
      }
    });

    // Update asset condition and status
    const updatePayload: any = { condition };
    if (status === 'Missing') {
      updatePayload.status = 'Lost';
    } else if (status === 'Damaged') {
      updatePayload.status = 'Damaged';
    }
    
    await prisma.asset.update({
      where: { id: assetId },
      data: updatePayload
    });

    // Add Lifecycle entry
    await prisma.assetLifecycleEvent.create({
      data: {
        assetId,
        eventType: 'Verification',
        performedBy: req.user?.email || 'System',
        description: `Inspected during campaign "${campaign.name}". Result: ${status}. Condition: ${condition}.`
      }
    });

    return res.status(201).json(verification);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/assets/verification/campaigns/:id/variance - Variance report
router.get('/verification/campaigns/:id/variance', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.verificationCampaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    const expectedWhere: any = {};
    if (campaign.officeId) {
      expectedWhere.officeId = campaign.officeId;
    }

    const expectedAssets = await prisma.asset.findMany({
      where: expectedWhere,
      include: { category: true, office: true }
    });

    const countedVerifications = await prisma.assetVerification.findMany({
      where: { campaignId: id },
      include: { asset: { include: { category: true, office: true } } }
    });

    const verified = [];
    const missing = [];
    const damaged = [];
    const uncounted = [];

    for (const asset of expectedAssets) {
      const vLog = countedVerifications.find(cv => cv.assetId === asset.id);
      if (!vLog) {
        uncounted.push(asset);
      } else if (vLog.status === 'Verified') {
        verified.push({ asset, countedAt: vLog.verifiedAt, notes: vLog.notes });
      } else if (vLog.status === 'Missing') {
        missing.push({ asset, countedAt: vLog.verifiedAt, notes: vLog.notes });
      } else if (vLog.status === 'Damaged') {
        damaged.push({ asset, countedAt: vLog.verifiedAt, notes: vLog.notes, condition: vLog.condition });
      }
    }

    return res.json({
      campaignName: campaign.name,
      metrics: {
        expected: expectedAssets.length,
        verified: verified.length,
        missing: missing.length,
        damaged: damaged.length,
        uncounted: uncounted.length
      },
      verified,
      missing,
      damaged,
      uncounted
    });
  } catch (error) {
    console.error(error);
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
