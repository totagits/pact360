import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateJWT, requirePermission } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// 1. PROJECTS
// ==========================================
router.get('/projects', authenticateJWT, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: { grant: true, manager: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { name: 'asc' }
    });
    return res.json(projects);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/projects/:id', authenticateJWT, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        grant: true,
        manager: true,
        assets: { include: { category: true, custodian: true } },
        contracts: { include: { vendor: true } }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/projects', authenticateJWT, requirePermission('projects:write'), async (req: AuthenticatedRequest, res) => {
  const { name, code, budget, startDate, endDate, status, grantId, managerId } = req.body;

  if (!name || !code || !budget || !startDate || !endDate || !status || !grantId || !managerId) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const existing = await prisma.project.findFirst({ where: { OR: [{ name }, { code }] } });
    if (existing) return res.status(400).json({ error: 'Project name or code already exists.' });

    const project = await prisma.project.create({
      data: {
        name,
        code,
        budget: parseFloat(budget),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        grantId,
        managerId
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'PROJECT_CREATE',
      module: 'Administration',
      recordId: project.id,
      notes: `Created project ${name}`
    });

    return res.status(201).json(project);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/projects/:id', authenticateJWT, requirePermission('projects:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        budget: req.body.budget ? parseFloat(req.body.budget) : undefined,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'PROJECT_UPDATE',
      module: 'Administration',
      recordId: project.id,
      notes: `Updated project ${project.name}`
    });

    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 2. GRANTS
// ==========================================
router.get('/grants', authenticateJWT, async (req, res) => {
  try {
    const grants = await prisma.grant.findMany({
      include: { donor: true },
      orderBy: { name: 'asc' }
    });
    return res.json(grants);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/grants/:id', authenticateJWT, async (req, res) => {
  try {
    const grant = await prisma.grant.findUnique({
      where: { id: req.params.id },
      include: {
        donor: true,
        projects: true,
        assets: { include: { category: true } },
        contracts: { include: { vendor: true } }
      }
    });
    if (!grant) return res.status(404).json({ error: 'Grant not found.' });
    return res.json(grant);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/grants', authenticateJWT, requirePermission('projects:write'), async (req: AuthenticatedRequest, res) => {
  const { name, code, amount, donorId, startDate, endDate, complianceRequirements, status } = req.body;

  try {
    const grant = await prisma.grant.create({
      data: {
        name,
        code,
        amount: parseFloat(amount),
        donorId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        complianceRequirements,
        status
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'GRANT_CREATE',
      module: 'Administration',
      recordId: grant.id,
      notes: `Created grant ${name}`
    });

    return res.status(201).json(grant);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/grants/:id', authenticateJWT, requirePermission('projects:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const grant = await prisma.grant.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        amount: req.body.amount ? parseFloat(req.body.amount) : undefined,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      }
    });
    return res.json(grant);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 3. DONORS
// ==========================================
router.get('/donors', authenticateJWT, async (req, res) => {
  try {
    const donors = await prisma.donor.findMany({ orderBy: { name: 'asc' } });
    return res.json(donors);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/donors', authenticateJWT, requirePermission('projects:write'), async (req, res) => {
  try {
    const donor = await prisma.donor.create({ data: req.body });
    return res.status(201).json(donor);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// 4. VENDORS
// ==========================================
router.get('/vendors', authenticateJWT, requirePermission('vendors:read'), async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
    return res.json(vendors);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/vendors/:id', authenticateJWT, requirePermission('vendors:read'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        assets: true,
        contracts: true,
        workOrders: { include: { asset: true } }
      }
    });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
    return res.json(vendor);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/vendors', authenticateJWT, requirePermission('vendors:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const vendor = await prisma.vendor.create({
      data: {
        ...req.body,
        performanceScore: req.body.performanceScore ? parseFloat(req.body.performanceScore) : 5.0
      }
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'VENDOR_CREATE',
      module: 'Vendors',
      recordId: vendor.id,
      notes: `Registered vendor ${vendor.name}`
    });

    return res.status(201).json(vendor);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/vendors/:id', authenticateJWT, requirePermission('vendors:write'), async (req: AuthenticatedRequest, res) => {
  try {
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        performanceScore: req.body.performanceScore ? parseFloat(req.body.performanceScore) : undefined
      }
    });
    return res.json(vendor);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
