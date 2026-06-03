import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateJWT, requirePermission } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { comparePassword, hashPassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        office: true,
        department: true,
      },
    });

    if (!user) {
      await logAudit({ action: 'LOGIN_FAIL', module: 'Auth', notes: `Failed login attempt for email: ${email}` });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'Active') {
      await logAudit({ userId: user.id, action: 'LOGIN_BLOCKED', module: 'Auth', notes: `Blocked login for inactive/suspended user: ${email}` });
      return res.status(403).json({ error: `Your account is ${user.status.toLowerCase()}. Please contact administration.` });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      await logAudit({ userId: user.id, action: 'LOGIN_FAIL', module: 'Auth', notes: `Failed password validation for email: ${email}` });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const permissions = user.role.permissions.map(p => p.code);
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user.id });

    await logAudit({ userId: user.id, action: 'LOGIN_SUCCESS', module: 'Auth', notes: 'Logged in successfully.' });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        permissions,
        office: user.office ? { name: user.office.name, code: user.office.code } : null,
        department: user.department ? { name: user.department.name, code: user.department.code } : null,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    const verified = verifyRefreshToken(refreshToken);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user || user.status !== 'Active') {
      return res.status(403).json({ error: 'User is suspended or deleted.' });
    }

    const permissions = user.role.permissions.map(p => p.code);
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    return res.json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  if (req.user) {
    await logAudit({ userId: req.user.userId, action: 'LOGOUT', module: 'Auth', notes: 'Logged out successfully.' });
  }
  return res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        role: { include: { permissions: true } },
        office: true,
        department: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      permissions: user.role.permissions.map(p => p.code),
      office: user.office,
      department: user.department,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ADMIN: GET /api/users
router.get('/users', authenticateJWT, requirePermission('users:read'), async (req: AuthenticatedRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        office: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Remove password hash from response
    const sanitizedUsers = users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    return res.json(sanitizedUsers);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ADMIN: POST /api/users
router.post('/users', authenticateJWT, requirePermission('users:write'), async (req: AuthenticatedRequest, res) => {
  const { email, password, firstName, lastName, roleId, officeId, departmentId } = req.body;

  if (!email || !password || !firstName || !lastName || !roleId) {
    return res.status(400).json({ error: 'All fields (email, password, firstName, lastName, roleId) are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        status: 'Active',
        roleId,
        officeId: officeId || null,
        departmentId: departmentId || null,
      },
      include: {
        role: true,
      },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'USER_CREATE',
      module: 'Users',
      recordId: user.id,
      newValue: { email: user.email, role: user.role.name },
      notes: `Created new user account: ${email}`,
    });

    const { passwordHash: _, ...sanitized } = user;
    return res.status(201).json(sanitized);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ADMIN: PUT /api/users/:id
router.put('/users/:id', authenticateJWT, requirePermission('users:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, roleId, officeId, departmentId, status, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const data: any = {
      email,
      firstName,
      lastName,
      roleId,
      officeId: officeId || null,
      departmentId: departmentId || null,
      status,
    };

    if (password && password.trim() !== '') {
      data.passwordHash = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'USER_UPDATE',
      module: 'Users',
      recordId: user.id,
      previousValue: { email: existingUser.email, status: existingUser.status },
      newValue: { email: user.email, status: user.status },
      notes: `Updated user account: ${user.email}`,
    });

    const { passwordHash: _, ...sanitized } = user;
    return res.json(sanitized);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ADMIN: GET /api/roles
router.get('/roles', authenticateJWT, requirePermission('roles:read'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: true },
    });
    return res.json(roles);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ADMIN: PUT /api/roles/:id (Assign Permissions to Role)
router.put('/roles/:id', authenticateJWT, requirePermission('roles:write'), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { permissionIds } = req.body; // Array of Permission IDs

  if (!Array.isArray(permissionIds)) {
    return res.status(400).json({ error: 'permissionIds must be an array.' });
  }

  try {
    const role = await prisma.role.update({
      where: { id },
      data: {
        permissions: {
          set: permissionIds.map(pid => ({ id: pid })),
        },
      },
      include: { permissions: true },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'ROLE_UPDATE',
      module: 'Users',
      recordId: role.id,
      notes: `Updated permissions for role: ${role.name}`,
    });

    return res.json(role);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ADMIN: GET /api/permissions
router.get('/permissions', authenticateJWT, requirePermission('roles:read'), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany();
    return res.json(permissions);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
