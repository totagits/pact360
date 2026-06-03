import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditParams {
  userId?: string;
  action: string;
  module: string;
  recordId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  notes?: string;
}

export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        module: params.module,
        recordId: params.recordId || null,
        previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        ipAddress: params.ipAddress || null,
        notes: params.notes || null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit activity:', error);
  }
}
