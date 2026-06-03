import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateJWT, requirePermission } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// 1. OFFICES / LOCATIONS
// ==========================================
router.get('/offices', authenticateJWT, async (req, res) => {
  try {
    const offices = await prisma.office.findMany({ orderBy: { name: 'asc' } });
    return res.json(offices);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/offices', authenticateJWT, requirePermission('settings:write'), async (req, res) => {
  try {
    const office = await prisma.office.create({ data: req.body });
    return res.status(201).json(office);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 2. DEPARTMENTS
// ==========================================
router.get('/departments', authenticateJWT, async (req, res) => {
  try {
    const depts = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    return res.json(depts);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/departments', authenticateJWT, requirePermission('settings:write'), async (req, res) => {
  try {
    const dept = await prisma.department.create({ data: req.body });
    return res.status(201).json(dept);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 2b. PHYSICAL LOCATIONS (Warehouses, rooms)
// ==========================================
router.get('/locations', authenticateJWT, async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      include: { office: true },
      orderBy: { name: 'asc' }
    });
    return res.json(locations);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/locations', authenticateJWT, requirePermission('settings:write'), async (req, res) => {
  try {
    const location = await prisma.location.create({
      data: req.body,
      include: { office: true }
    });
    return res.status(201).json(location);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 3. SYSTEM SETTINGS
// ==========================================
router.get('/settings', authenticateJWT, async (req, res) => {
  try {
    let settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      settings = await prisma.systemSetting.create({ data: {} });
    }
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/settings', authenticateJWT, requirePermission('settings:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await prisma.systemSetting.findFirst();
    const id = settings ? settings.id : 'default';

    const updated = await prisma.systemSetting.upsert({
      where: { id },
      update: req.body,
      create: req.body
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'SETTINGS_UPDATE',
      module: 'Administration',
      newValue: updated,
      notes: 'Updated global system preferences.'
    });

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 4. NOTIFICATIONS
// ==========================================
router.get('/notifications', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/notifications/:id/read', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 5. AUDIT LOGS
// ==========================================
router.get('/audits', authenticateJWT, requirePermission('audit:read'), async (req, res) => {
  const { module, action } = req.query;
  const whereClause: any = {};
  if (module) whereClause.module = String(module);
  if (action) whereClause.action = String(action);

  try {
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 200 // Cap search output
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 6. DOCUMENTS
// ==========================================
router.get('/documents', authenticateJWT, async (req, res) => {
  const { entityType, entityId } = req.query;
  const whereClause: any = {};
  if (entityType) whereClause.entityType = String(entityType);
  if (entityId) whereClause.entityId = String(entityId);

  try {
    const docs = await prisma.document.findMany({
      where: whereClause,
      orderBy: { uploadedAt: 'desc' }
    });
    return res.json(docs);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/documents', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const { entityType, entityId, fileName, fileCategory, fileSize, mimeType } = req.body;

  if (!entityType || !entityId || !fileName || !fileCategory) {
    return res.status(400).json({ error: 'entityType, entityId, fileName, and fileCategory are required.' });
  }

  try {
    const doc = await prisma.document.create({
      data: {
        entityType,
        entityId,
        fileName,
        fileCategory,
        fileSize: parseInt(fileSize || 0),
        mimeType: mimeType || 'application/octet-stream',
        filePath: `/uploads/${entityType.toLowerCase()}s/${fileName}`,
        uploadedBy: req.user?.email || 'System'
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'DOCUMENT_UPLOAD',
      module: 'Administration',
      recordId: doc.id,
      notes: `Uploaded file ${fileName} attached to ${entityType} (${entityId})`
    });

    return res.status(201).json(doc);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 7. REPORTS (CSV aggregated downloads endpoints)
// ==========================================
// Custom helper to convert JSON arrays to CSV strings
function jsonToCsv(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj =>
    Object.values(obj)
      .map(val => {
        let cleanVal = val === null || val === undefined ? '' : String(val);
        if (cleanVal.includes(',') || cleanVal.includes('"') || cleanVal.includes('\n')) {
          cleanVal = `"${cleanVal.replace(/"/g, '""')}"`;
        }
        return cleanVal;
      })
      .join(',')
  );
  return [headers, ...rows].join('\n');
}

router.get('/reports/:reportType', authenticateJWT, requirePermission('reports:read'), async (req, res) => {
  const { reportType } = req.params;

  try {
    let reportData: any[] = [];

    switch (reportType) {
      case 'asset-register':
        const assets = await prisma.asset.findMany({
          include: { category: true, office: true, project: true, custodian: true }
        });
        reportData = assets.map(a => ({
          'Asset Code': a.assetCode,
          'Asset Tag': a.assetTag,
          'Name': a.name,
          'Category': a.category.name,
          'Status': a.status,
          'Condition': a.condition,
          'Purchase Cost': a.purchaseCost,
          'Current Value': a.currentValue,
          'Purchase Date': a.purchaseDate.toISOString().split('T')[0],
          'Location': a.office?.name || 'N/A',
          'Project': a.project?.name || 'N/A',
          'Custodian': a.custodian ? `${a.custodian.firstName} ${a.custodian.lastName}` : 'N/A'
        }));
        break;

      case 'contracts':
        const contracts = await prisma.contract.findMany({
          include: { vendor: true, project: true }
        });
        reportData = contracts.map(c => ({
          'Contract Number': c.contractNumber,
          'Title': c.title,
          'Type': c.contractType,
          'Vendor': c.vendor.name,
          'Value': c.value,
          'Start Date': c.startDate.toISOString().split('T')[0],
          'End Date': c.endDate.toISOString().split('T')[0],
          'Status': c.status
        }));
        break;

      case 'maintenance':
        const maint = await prisma.maintenanceWorkOrder.findMany({
          include: { asset: true, vendor: true }
        });
        reportData = maint.map(m => ({
          'WO ID': m.id.slice(0, 8),
          'Asset': m.asset.name,
          'Asset Code': m.asset.assetCode,
          'Type': m.type,
          'Priority': m.priority,
          'Status': m.status,
          'Cost': m.cost,
          'Scheduled Date': m.scheduledDate.toISOString().split('T')[0]
        }));
        break;

      case 'vendors':
        const vendors = await prisma.vendor.findMany();
        reportData = vendors.map(v => ({
          'Vendor Name': v.name,
          'Contact': v.contactName,
          'Email': v.email,
          'Phone': v.phone,
          'Service': v.serviceCategory,
          'Score': v.performanceScore,
          'Status': v.status
        }));
        break;

      case 'audit-logs':
        const logs = await prisma.auditLog.findMany({
          include: { user: true },
          take: 500
        });
        reportData = logs.map(l => ({
          'Timestamp': l.timestamp.toISOString(),
          'User': l.user?.email || 'System',
          'Action': l.action,
          'Module': l.module,
          'Notes': l.notes || ''
        }));
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type requested.' });
    }

    // Check if client requested CSV format directly
    const format = req.query.format;
    if (format === 'csv') {
      const csvStr = jsonToCsv(reportData);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${reportType}-report.csv`);
      return res.send(csvStr);
    }

    return res.json(reportData);
  } catch (error) {
    console.error('Report generation failed:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
