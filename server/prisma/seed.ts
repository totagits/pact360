import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding database (clean slate)...');

  // Clear existing database records
  await prisma.assetVerification.deleteMany({});
  await prisma.verificationCampaign.deleteMany({});
  await prisma.assetAssignment.deleteMany({});
  await prisma.assetTransfer.deleteMany({});
  await prisma.maintenanceWorkOrder.deleteMany({});
  await prisma.maintenanceSchedule.deleteMany({});
  await prisma.contractMilestone.deleteMany({});
  await prisma.contractPayment.deleteMany({});
  await prisma.contractAmendment.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.grant.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.office.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.assetImportError.deleteMany({});
  await prisma.assetImportBatch.deleteMany({});
  await prisma.systemSetting.deleteMany({});

  // 1. System Settings
  const settings = await prisma.systemSetting.create({
    data: {
      orgName: 'Plan International Liberia',
      logoUrl: '/logo.png',
      country: 'Liberia',
      defaultCurrency: 'USD',
      dateFormat: 'YYYY-MM-DD',
      assetCodePrefix: 'PLAN-AST-',
      contractCodePrefix: 'PLAN-CON-',
      maintenanceReminderDays: 7,
      contractExpiryReminderDays: 30,
      warrantyExpiryReminderDays: 30,
      systemName: 'PACT360',
      systemTagline: 'Track. Manage. Comply. Deliver.',
      themeColor: '#0284c7',
    },
  });
  console.log('Created default system settings.');

  // 2. Permissions
  const permissionCodes = [
    { code: 'users:read', name: 'View Users', description: 'Can view list and details of users' },
    { code: 'users:write', name: 'Manage Users', description: 'Can create, edit, suspend users' },
    { code: 'roles:read', name: 'View Roles', description: 'Can view roles and permissions' },
    { code: 'roles:write', name: 'Manage Roles', description: 'Can edit roles and assign permissions' },
    
    { code: 'assets:read', name: 'View Assets', description: 'Can view assets list and profiles' },
    { code: 'assets:write', name: 'Manage Assets', description: 'Can create, edit, and archive assets' },
    { code: 'assets:assign', name: 'Assign Assets', description: 'Can assign/return assets to/from custodians' },
    { code: 'assets:transfer', name: 'Transfer Assets', description: 'Can request/approve asset transfers' },
    { code: 'assets:dispose', name: 'Dispose Assets', description: 'Can request/approve asset disposal' },
    
    { code: 'contracts:read', name: 'View Contracts', description: 'Can view contracts, payment plans, and milestones' },
    { code: 'contracts:write', name: 'Manage Contracts', description: 'Can create, edit, renew, or terminate contracts' },
    { code: 'contracts:approve', name: 'Approve Contracts', description: 'Can sign off and approve contracts' },
    
    { code: 'maintenance:read', name: 'View Maintenance', description: 'Can view maintenance logs, schedule, and calendar' },
    { code: 'maintenance:write', name: 'Manage Maintenance', description: 'Can request, assign, or update maintenance work orders' },
    
    { code: 'projects:read', name: 'View Projects & Grants', description: 'Can view projects, grants, and donors' },
    { code: 'projects:write', name: 'Manage Projects & Grants', description: 'Can create, edit projects, grants, and link assets' },
    
    { code: 'vendors:read', name: 'View Vendors', description: 'Can view vendor database and history' },
    { code: 'vendors:write', name: 'Manage Vendors', description: 'Can create, edit, and rate vendors' },
    
    { code: 'reports:read', name: 'View Reports', description: 'Can view dashboards and run reports' },
    { code: 'reports:export', name: 'Export Reports', description: 'Can download reports to CSV' },
    
    { code: 'audit:read', name: 'View Audit Logs', description: 'Can view activity history and system audit trails' },
    { code: 'settings:write', name: 'Manage Settings', description: 'Can adjust organizational configurations' },
  ];

  const permissionsMap: Record<string, any> = {};
  for (const perm of permissionCodes) {
    permissionsMap[perm.code] = await prisma.permission.create({ data: perm });
  }
  console.log('Seeded permissions.');

  // 3. 16 User Roles
  const rolesData = [
    { name: 'Super Admin', description: 'Full access to all modules and configurations', permissions: Object.keys(permissionsMap) },
    { name: 'System Administrator', description: 'Manage users, locations, settings, and audits', permissions: ['users:read', 'users:write', 'roles:read', 'roles:write', 'reports:read', 'audit:read', 'settings:write'] },
    { name: 'Country Director / Executive Viewer', description: 'Executive view of dashboards and report insights', permissions: ['assets:read', 'contracts:read', 'maintenance:read', 'projects:read', 'vendors:read', 'reports:read', 'reports:export'] },
    { name: 'Head of Operations', description: 'Approve disposals, transfers, and high-value contracts', permissions: ['assets:read', 'assets:transfer', 'assets:dispose', 'contracts:read', 'contracts:approve', 'maintenance:read', 'projects:read', 'vendors:read', 'reports:read', 'reports:export', 'audit:read'] },
    { name: 'Procurement Manager', description: 'Procure materials and allocate initial serial keys', permissions: ['assets:read', 'assets:write', 'contracts:read', 'contracts:write', 'vendors:read', 'vendors:write', 'reports:read'] },
    { name: 'Asset Manager', description: 'Register, track, assign, transfer, and maintain assets', permissions: ['assets:read', 'assets:write', 'assets:assign', 'assets:transfer', 'assets:dispose', 'maintenance:read', 'maintenance:write', 'vendors:read', 'reports:read'] },
    { name: 'Logistics Officer', description: 'Logistical field transfers and physical distributions', permissions: ['assets:read', 'assets:transfer', 'assets:assign', 'maintenance:read'] },
    { name: 'Finance Manager', description: 'Audit purchase cost and asset depreciation calculations', permissions: ['assets:read', 'contracts:read', 'reports:read', 'reports:export'] },
    { name: 'Grants Manager', description: 'Review donor grant allocations, budgets, and compliance', permissions: ['assets:read', 'contracts:read', 'projects:read', 'reports:read'] },
    { name: 'Project Manager', description: 'View and allocate assets and contracts to specific project activities', permissions: ['assets:read', 'contracts:read', 'projects:read', 'projects:write', 'reports:read'] },
    { name: 'Contract Manager', description: 'Manage vendor procurement agreements and milestones', permissions: ['contracts:read', 'contracts:write', 'vendors:read', 'vendors:write', 'projects:read', 'reports:read'] },
    { name: 'Maintenance Officer', description: 'Execute and complete corrective work orders', permissions: ['assets:read', 'maintenance:read', 'maintenance:write'] },
    { name: 'Department Head', description: 'Oversee department assets allocation and transfers approval', permissions: ['assets:read', 'assets:transfer', 'reports:read'] },
    { name: 'Field Office User', description: 'Request asset tag registrations and report anomalies', permissions: ['assets:read', 'assets:write', 'maintenance:read'] },
    { name: 'Auditor / Compliance Officer', description: 'Complete system audit visibility to monitor compliance and trace history', permissions: ['assets:read', 'contracts:read', 'projects:read', 'vendors:read', 'reports:read', 'audit:read'] },
    { name: 'Read-Only Viewer', description: 'Basic read-only access across registers', permissions: ['assets:read', 'contracts:read', 'projects:read'] },
  ];

  const rolesMap: Record<string, any> = {};
  for (const roleData of rolesData) {
    rolesMap[roleData.name] = await prisma.role.create({
      data: {
        name: roleData.name,
        description: roleData.description,
        permissions: {
          connect: roleData.permissions.map(code => ({ id: permissionsMap[code].id })),
        },
      },
    });
  }
  console.log('Seeded 16 roles.');

  // 4. Offices / Locations
  const officesData = [
    { name: 'Monrovia Country Office', code: 'MCO', type: 'Country Office', location: 'Monrovia, Liberia' },
    { name: 'Lofa Field Office', code: 'LFO', type: 'Field Office', location: 'Voinjama, Lofa County' },
    { name: 'Nimba Field Office', code: 'NFO', type: 'Field Office', location: 'Ganta, Nimba County' },
    { name: 'Zwedru Field Office', code: 'ZFO', type: 'Field Office', location: 'Zwedru, Grand Gedeh County' },
    { name: 'Gbarnga Warehouse', code: 'GWH', type: 'Warehouse', location: 'Gbarnga, Bong County' },
  ];

  const officesMap: Record<string, any> = {};
  for (const office of officesData) {
    officesMap[office.code] = await prisma.office.create({ data: office });
  }
  console.log('Seeded offices.');

  // 5. Physical Warehouse Locations
  const locationsData = [
    { name: 'Central Logistics Warehouse', code: 'CLW', type: 'Warehouse', officeCode: 'MCO' },
    { name: 'Monrovia Solar Grid Room', code: 'MSGR', type: 'Office Room', officeCode: 'MCO' },
    { name: 'Voinjama Storage Depot', code: 'VSD', type: 'Storage Room', officeCode: 'LFO' },
    { name: 'Ganta Office Storage', code: 'GOS', type: 'Storage Room', officeCode: 'NFO' },
    { name: 'Gbarnga Main Fuel Cage', code: 'GMFC', type: 'Warehouse', officeCode: 'GWH' },
  ];

  const locationsMap: Record<string, any> = {};
  for (const loc of locationsData) {
    const office = officesMap[loc.officeCode];
    locationsMap[loc.code] = await prisma.location.create({
      data: {
        name: loc.name,
        code: loc.code,
        type: loc.type,
        officeId: office.id,
      }
    });
  }
  console.log('Seeded physical warehouse locations.');

  // 6. Departments
  const departmentsData = [
    { name: 'Operations & Administration', code: 'OPS' },
    { name: 'Programs & Development', code: 'PROG' },
    { name: 'Finance & Accounts', code: 'FIN' },
    { name: 'Logistics & Procurement', code: 'LOG' },
    { name: 'Human Resources', code: 'HR' },
  ];

  const departmentsMap: Record<string, any> = {};
  for (const dept of departmentsData) {
    departmentsMap[dept.code] = await prisma.department.create({ data: dept });
  }
  console.log('Seeded departments.');

  // 7. Users
  const salt = await bcrypt.genSalt(10);
  const createHash = (pwd: string) => bcrypt.hashSync(pwd, salt);

  const usersData = [
    { email: 'admin@pact360.local', passwordHash: createHash('Admin@12345'), firstName: 'Super', lastName: 'Admin', status: 'Active', roleName: 'Super Admin', officeCode: 'MCO', departmentCode: 'OPS' },
    { email: 'sys.admin@pact360.local', passwordHash: createHash('Admin@12345'), firstName: 'System', lastName: 'Administrator', status: 'Active', roleName: 'System Administrator', officeCode: 'MCO', departmentCode: 'OPS' },
    { email: 'country.director@pact360.local', passwordHash: createHash('Director@12345'), firstName: 'Country', lastName: 'Director', status: 'Active', roleName: 'Country Director / Executive Viewer', officeCode: 'MCO', departmentCode: 'OPS' },
    { email: 'operations.head@pact360.local', passwordHash: createHash('Admin@12345'), firstName: 'Head of', lastName: 'Operations', status: 'Active', roleName: 'Head of Operations', officeCode: 'MCO', departmentCode: 'OPS' },
    { email: 'procurement.manager@pact360.local', passwordHash: createHash('Procurement@12345'), firstName: 'Procurement', lastName: 'Manager', status: 'Active', roleName: 'Procurement Manager', officeCode: 'MCO', departmentCode: 'LOG' },
    { email: 'asset.manager@pact360.local', passwordHash: createHash('Asset@12345'), firstName: 'Asset', lastName: 'Manager', status: 'Active', roleName: 'Asset Manager', officeCode: 'MCO', departmentCode: 'LOG' },
    { email: 'logistics.officer@pact360.local', passwordHash: createHash('Logistics@12345'), firstName: 'Logistics', lastName: 'Officer', status: 'Active', roleName: 'Logistics Officer', officeCode: 'MCO', departmentCode: 'LOG' },
    { email: 'finance.manager@pact360.local', passwordHash: createHash('Finance@12345'), firstName: 'Finance', lastName: 'Manager', status: 'Active', roleName: 'Finance Manager', officeCode: 'MCO', departmentCode: 'FIN' },
    { email: 'grants.manager@pact360.local', passwordHash: createHash('Grants@12345'), firstName: 'Grants', lastName: 'Manager', status: 'Active', roleName: 'Grants Manager', officeCode: 'MCO', departmentCode: 'FIN' },
    { email: 'project.manager@pact360.local', passwordHash: createHash('Project@12345'), firstName: 'Project', lastName: 'Manager', status: 'Active', roleName: 'Project Manager', officeCode: 'NFO', departmentCode: 'PROG' },
    { email: 'contract.manager@pact360.local', passwordHash: createHash('Contract@12345'), firstName: 'Contract', lastName: 'Manager', status: 'Active', roleName: 'Contract Manager', officeCode: 'MCO', departmentCode: 'LOG' },
    { email: 'maintenance.officer@pact360.local', passwordHash: createHash('Maintenance@12345'), firstName: 'Maintenance', lastName: 'Officer', status: 'Active', roleName: 'Maintenance Officer', officeCode: 'MCO', departmentCode: 'LOG' },
    { email: 'department.head@pact360.local', passwordHash: createHash('Dept@12345'), firstName: 'Department', lastName: 'Head', status: 'Active', roleName: 'Department Head', officeCode: 'MCO', departmentCode: 'OPS' },
    { email: 'field.user@pact360.local', passwordHash: createHash('Field@12345'), firstName: 'Field Office', lastName: 'User', status: 'Active', roleName: 'Field Office User', officeCode: 'LFO', departmentCode: 'PROG' },
    { email: 'auditor@pact360.local', passwordHash: createHash('Auditor@12345'), firstName: 'Compliance', lastName: 'Auditor', status: 'Active', roleName: 'Auditor / Compliance Officer', officeCode: 'MCO', departmentCode: 'FIN' },
    { email: 'viewer@pact360.local', passwordHash: createHash('Viewer@12345'), firstName: 'Read-Only', lastName: 'Viewer', status: 'Active', roleName: 'Read-Only Viewer', officeCode: 'MCO', departmentCode: 'PROG' },
  ];

  const usersMap: Record<string, any> = {};
  for (const userData of usersData) {
    usersMap[userData.email] = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        status: userData.status,
        roleId: rolesMap[userData.roleName].id,
        officeId: officesMap[userData.officeCode].id,
        departmentId: departmentsMap[userData.departmentCode].id,
      },
    });
  }
  console.log('Seeded users.');

  // 8. Donors
  const donorsData = [
    { name: 'Swedish International Development Cooperation Agency', code: 'SIDA' },
    { name: 'United States Agency for International Development', code: 'USAID' },
    { name: 'European Union', code: 'EU' },
    { name: 'Global Affairs Canada', code: 'GAC' },
    { name: 'United Nations Children\'s Fund', code: 'UNICEF' },
  ];

  const donorsMap: Record<string, any> = {};
  for (const donor of donorsData) {
    donorsMap[donor.code] = await prisma.donor.create({ data: donor });
  }
  console.log('Seeded donors.');

  // 9. Grants
  const grantsData = [
    { name: 'SIDA WASH and Sanitation Support', code: 'SIDA-WASH-2025', donorCode: 'SIDA', amount: 1500000.00, startDate: new Date('2025-01-01'), endDate: new Date('2027-12-31'), status: 'Active', complianceRequirements: 'Annual asset audits, no transfers above $5000 without SIDA signoff.' },
    { name: 'USAID Primary Education Initiative', code: 'USAID-EDU-2024', donorCode: 'USAID', amount: 3200000.00, startDate: new Date('2024-06-01'), endDate: new Date('2028-05-31'), status: 'Active', complianceRequirements: 'All equipment must carry USAID stickers.' },
    { name: 'EU Child Rights Protection Program', code: 'EU-CR-2025', donorCode: 'EU', amount: 800000.00, startDate: new Date('2025-03-01'), endDate: new Date('2026-02-28'), status: 'Active', complianceRequirements: 'Audited asset register required on closure.' },
    { name: 'GAC Women Empowerment and Gender Equality', code: 'GAC-GE-2024', donorCode: 'GAC', amount: 2000000.00, startDate: new Date('2024-09-01'), endDate: new Date('2027-08-31'), status: 'Active', complianceRequirements: 'Assets are exclusively for women-led cooperative activities.' },
    { name: 'UNICEF Health and Rural Nutrition Plan', code: 'UNICEF-NUT-2025', donorCode: 'UNICEF', amount: 650000.00, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), status: 'Active', complianceRequirements: 'Monthly log check of emergency response vehicles.' },
    { name: 'SIDA Emergency Food Response', code: 'SIDA-EMR-2026', donorCode: 'SIDA', amount: 950000.00, startDate: new Date('2026-02-01'), endDate: new Date('2026-11-30'), status: 'Active', complianceRequirements: 'Accelerated disposal procedures.' },
  ];

  const grantsMap: Record<string, any> = {};
  for (const grant of grantsData) {
    grantsMap[grant.code] = await prisma.grant.create({
      data: {
        name: grant.name,
        code: grant.code,
        amount: grant.amount,
        startDate: grant.startDate,
        endDate: grant.endDate,
        complianceRequirements: grant.complianceRequirements,
        status: grant.status,
        donorId: donorsMap[grant.donorCode].id,
      },
    });
  }
  console.log('Seeded grants.');

  // 10. Projects
  const projectsData = [
    { name: 'WASH in Schools', code: 'PROJ-WASH-SCH', budget: 500000, startDate: new Date('2025-01-01'), endDate: new Date('2026-12-31'), status: 'Active', grantCode: 'SIDA-WASH-2025', managerEmail: 'project.manager@pact360.local' },
    { name: 'Literacy for Girls', code: 'PROJ-LIT-GIRLS', budget: 1200000, startDate: new Date('2024-06-01'), endDate: new Date('2026-05-31'), status: 'Active', grantCode: 'USAID-EDU-2024', managerEmail: 'project.manager@pact360.local' },
    { name: 'Child Helpline Support', code: 'PROJ-CHILD-HELP', budget: 350000, startDate: new Date('2025-03-01'), endDate: new Date('2026-02-28'), status: 'Active', grantCode: 'EU-CR-2025', managerEmail: 'project.manager@pact360.local' },
    { name: 'Economic Resilience', code: 'PROJ-ECON-RES', budget: 900000, startDate: new Date('2024-09-01'), endDate: new Date('2027-08-31'), status: 'Active', grantCode: 'GAC-GE-2024', managerEmail: 'project.manager@pact360.local' },
    { name: 'Infant Health Support', code: 'PROJ-INF-HLTH', budget: 400000, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), status: 'Active', grantCode: 'UNICEF-NUT-2025', managerEmail: 'project.manager@pact360.local' },
    { name: 'Rural Water Systems', code: 'PROJ-RUR-WTR', budget: 1000000, startDate: new Date('2025-01-01'), endDate: new Date('2027-12-31'), status: 'Active', grantCode: 'SIDA-WASH-2025', managerEmail: 'project.manager@pact360.local' },
    { name: 'Protection Monitoring', code: 'PROJ-PROT-MON', budget: 450000, startDate: new Date('2025-03-01'), endDate: new Date('2026-02-28'), status: 'Active', grantCode: 'EU-CR-2025', managerEmail: 'project.manager@pact360.local' },
    { name: 'Youth Skills Development', code: 'PROJ-YOUTH-SKL', budget: 2000000, startDate: new Date('2024-06-01'), endDate: new Date('2028-05-31'), status: 'Active', grantCode: 'USAID-EDU-2024', managerEmail: 'project.manager@pact360.local' },
  ];

  const projectsMap: Record<string, any> = {};
  for (const proj of projectsData) {
    projectsMap[proj.code] = await prisma.project.create({
      data: {
        name: proj.name,
        code: proj.code,
        budget: proj.budget,
        startDate: proj.startDate,
        endDate: proj.endDate,
        status: proj.status,
        grantId: grantsMap[proj.grantCode].id,
        managerId: usersMap[proj.managerEmail].id,
      },
    });
  }
  console.log('Seeded projects.');

  // 11. Vendors (15 vendors)
  const vendorsData = [
    { name: 'Toyota Liberia', contactName: 'Musa Kamara', email: 'sales@toyota.com.lr', phone: '+231886111222', address: 'Tubman Boulevard, Monrovia', taxId: 'LRA-10029-3829', serviceCategory: 'Vehicles & Maintenance', performanceScore: 4.8, status: 'Active', notes: 'Primary supplier for operations vehicles.' },
    { name: 'Monrovia IT Solutions', contactName: 'Doris Cooper', email: 'info@monroviait.com', phone: '+231777555666', address: 'Broad Street, Monrovia', taxId: 'LRA-29381-2292', serviceCategory: 'IT hardware', performanceScore: 4.5, status: 'Active' },
    { name: 'Office Depot Liberia', contactName: 'John Flomo', email: 'john@officedepot.com.lr', phone: '+231886333444', address: 'Randall Street, Monrovia', taxId: 'LRA-88273-1123', serviceCategory: 'Office Furniture', performanceScore: 4.2, status: 'Active' },
    { name: 'Libtelco', contactName: 'Agnes Brown', email: 'enterprise@libtelco.com.lr', phone: '+231880123456', address: 'Sinkor, Monrovia', taxId: 'LRA-37283-9982', serviceCategory: 'Telecommunications', performanceScore: 4.0, status: 'Active' },
    { name: 'Total Liberia', contactName: 'G. Jackson', email: 'fuels@total.com.lr', phone: '+231886999888', address: 'Bushrod Island, Monrovia', taxId: 'LRA-19283-8822', serviceCategory: 'Fuel & Lubricants', performanceScore: 4.6, status: 'Active' },
    { name: 'Starz Technologies', contactName: 'B. Sackie', email: 'info@starz.edu.lr', phone: '+231776928372', address: 'Airfield, Monrovia', taxId: 'LRA-82938-1234', serviceCategory: 'IT Services', performanceScore: 4.4, status: 'Active' },
    { name: 'Consolidated Group', contactName: 'Lal Bhatia', email: 'dstv@congroup.com.lr', phone: '+231886515253', address: 'Capitol Bypass, Monrovia', taxId: 'LRA-92837-5566', serviceCategory: 'Media Services', performanceScore: 3.9, status: 'Active' },
    { name: 'Liberia Auto Services', contactName: 'Alfred Sherman', email: 'service@libauto.com', phone: '+231886726152', address: 'Gardnersville, Monrovia', taxId: 'LRA-10293-8837', serviceCategory: 'Vehicle Repair', performanceScore: 4.7, status: 'Active' },
    { name: 'Secure Security Services', contactName: 'Col. J. Davis', email: 'operations@securesafeties.com', phone: '+231770928372', address: 'Paynesville, Liberia', taxId: 'LRA-82938-9283', serviceCategory: 'Security Guarding', performanceScore: 4.9, status: 'Active' },
    { name: 'United Printing Press', contactName: 'Victor Harris', email: 'sales@unitedpress.com', phone: '+231886293847', address: 'Benson Street, Monrovia', taxId: 'LRA-72837-1928', serviceCategory: 'Printing', performanceScore: 4.3, status: 'Active' },
    { name: 'General Supplies Co.', contactName: 'H. Haddad', email: 'general@supplies.com.lr', phone: '+231886882211', address: 'Randall Street, Monrovia', taxId: 'LRA-88192-3847', serviceCategory: 'General Merchandising', performanceScore: 4.1, status: 'Active' },
    { name: 'Monrovia Stationery Store', contactName: 'Peter Kollie', email: 'peter@mstationery.com', phone: '+231777291837', address: 'Camp Johnson Road, Monrovia', taxId: 'LRA-62512-3829', serviceCategory: 'Stationery', performanceScore: 4.2, status: 'Active' },
    { name: 'Elite Engineering', contactName: 'Eng. Prince Cole', email: 'prince@eliteeng.com.lr', phone: '+231886910293', address: 'Johnson Street, Monrovia', taxId: 'LRA-12039-3829', serviceCategory: 'Construction', performanceScore: 4.6, status: 'Active' },
    { name: 'PowerGen Liberia', contactName: 'Isaac Taylor', email: 'taylor@powergen.com.lr', phone: '+231886992288', address: 'Congo Town, Monrovia', taxId: 'LRA-30291-3829', serviceCategory: 'Solar & Generator Systems', performanceScore: 4.7, status: 'Active' },
    { name: 'Liberia Logistics Services', contactName: 'Martha Cooper', email: 'martha@liblogistics.com', phone: '+231776991122', address: 'Freeport, Monrovia', taxId: 'LRA-89281-2918', serviceCategory: 'Freight', performanceScore: 4.5, status: 'Active' },
  ];

  const vendorsMap: Record<string, any> = {};
  for (const vendor of vendorsData) {
    vendorsMap[vendor.name] = await prisma.vendor.create({ data: vendor });
  }
  console.log('Seeded 15 vendors.');

  // 12. Asset Categories (10 categories)
  const categoriesData = [
    { name: 'Vehicles', code: 'VEH', prefix: 'PLAN-VEH-' },
    { name: 'Motorcycles', code: 'MTC', prefix: 'PLAN-MTC-' },
    { name: 'Laptops', code: 'LAP', prefix: 'PLAN-LAP-' },
    { name: 'Generators', code: 'GEN', prefix: 'PLAN-GEN-' },
    { name: 'Office Furniture', code: 'FNT', prefix: 'PLAN-FNT-' },
    { name: 'Printers', code: 'PRN', prefix: 'PLAN-PRN-' },
    { name: 'Solar Equipment', code: 'SOL', prefix: 'PLAN-SOL-' },
    { name: 'Network Equipment', code: 'NET', prefix: 'PLAN-NET-' },
    { name: 'Tablets', code: 'TAB', prefix: 'PLAN-TAB-' },
    { name: 'Field Equipments', code: 'FLD', prefix: 'PLAN-FLD-' },
  ];

  const categoriesMap: Record<string, any> = {};
  for (const cat of categoriesData) {
    categoriesMap[cat.name] = await prisma.assetCategory.create({ data: cat });
  }
  console.log('Seeded 10 categories.');

  // 13. Assets (Seeding 120 sample assets)
  const projectCodes = Object.keys(projectsMap);
  const officeCodes = Object.keys(officesMap);
  const deptCodes = Object.keys(departmentsMap);
  const userEmails = Object.keys(usersMap);
  const donorCodes = Object.keys(donorsMap);
  const grantCodes = Object.keys(grantsMap);
  const vendorNames = Object.keys(vendorsMap);
  const locationCodes = Object.keys(locationsMap);

  const assetList = [];
  for (let i = 1; i <= 120; i++) {
    let categoryName = 'Laptops';
    let assetName = `Lenovo ThinkPad T14 Gen ${4 + (i % 3)}`;
    let model = `ThinkPad T14`;
    let manufacturer = 'Lenovo';
    let usefulLife = 4;
    let cost = 1200.00;

    if (i <= 15) {
      categoryName = 'Vehicles';
      assetName = i % 2 === 0 ? 'Toyota Land Cruiser 4WD Hardtop' : 'Toyota Hilux Double Cabin';
      model = i % 2 === 0 ? 'Land Cruiser HZJ78' : 'Hilux 4x4';
      manufacturer = 'Toyota';
      usefulLife = 7;
      cost = 45000.00 + (i * 300);
    } else if (i <= 30) {
      categoryName = 'Motorcycles';
      assetName = 'Yamaha DT125 Trail Bike';
      model = 'DT125';
      manufacturer = 'Yamaha';
      usefulLife = 5;
      cost = 3200.00;
    } else if (i <= 70) {
      categoryName = 'Laptops';
      assetName = i % 2 === 0 ? 'HP EliteBook 840 G10' : 'Lenovo ThinkPad L14';
      model = i % 2 === 0 ? 'EliteBook 840' : 'ThinkPad L14';
      manufacturer = i % 2 === 0 ? 'HP' : 'Lenovo';
      usefulLife = 4;
      cost = 1100.00;
    } else if (i <= 80) {
      categoryName = 'Generators';
      assetName = i % 2 === 0 ? 'Perkins 50kVA Diesel Generator' : 'Kipor 10kVA Soundproof Generator';
      model = i % 2 === 0 ? '404D-22G' : 'KDE12STA';
      manufacturer = i % 2 === 0 ? 'Perkins' : 'Kipor';
      usefulLife = 8;
      cost = 15000.00 + (i * 100);
    } else if (i <= 90) {
      categoryName = 'Solar Equipment';
      assetName = 'Victron Energy 5kVA Solar Inverter System';
      model = 'MultiPlus-II 48/5000';
      manufacturer = 'Victron Energy';
      usefulLife = 10;
      cost = 8500.00;
    } else if (i <= 100) {
      categoryName = 'Printers';
      assetName = 'HP LaserJet Pro MFP M428fdw';
      model = 'LaserJet Pro M428';
      manufacturer = 'HP';
      usefulLife = 5;
      cost = 650.00;
    } else if (i <= 108) {
      categoryName = 'Network Equipment';
      assetName = 'Cisco 24-Port PoE Switch';
      model = 'Catalyst 2960-L';
      manufacturer = 'Cisco';
      usefulLife = 5;
      cost = 1800.00;
    } else if (i <= 114) {
      categoryName = 'Tablets';
      assetName = 'Samsung Galaxy Tab Active4 Pro';
      model = 'Galaxy Tab Active4';
      manufacturer = 'Samsung';
      usefulLife = 3;
      cost = 550.00;
    } else {
      categoryName = 'Office Furniture';
      assetName = 'Ergonomic Mesh Highback Office Chair';
      model = 'Ergo-Mesh-HB';
      manufacturer = 'Local Artisan';
      usefulLife = 6;
      cost = 350.00;
    }

    const cat = categoriesMap[categoryName];
    const codeSuffix = String(i).padStart(4, '0');
    const assetCode = `${cat.prefix}${codeSuffix}`;
    const assetTag = `PLAN-TAG-${1000 + i}`;

    const projectCode = projectCodes[i % projectCodes.length];
    const officeCode = officeCodes[i % officeCodes.length];
    const deptCode = deptCodes[i % deptCodes.length];
    const donorCode = donorCodes[i % donorCodes.length];
    const grantCode = grantCodes[i % grantCodes.length];
    const vendorName = vendorNames[i % vendorNames.length];
    const locationCode = locationCodes[i % locationCodes.length];
    
    const condition = i % 15 === 0 ? 'Fair' : i % 25 === 0 ? 'Poor' : i % 40 === 0 ? 'Damaged' : 'Good';
    let status = 'Available';
    let custodianId: string | null = null;
    
    if (i % 3 === 0) {
      status = 'Assigned';
      custodianId = usersMap[userEmails[i % userEmails.length]].id;
    } else if (i % 7 === 0) {
      status = 'In Use';
      custodianId = usersMap[userEmails[(i + 1) % userEmails.length]].id;
    } else if (i % 12 === 0) {
      status = 'Under Maintenance';
    }

    const purchaseDate = new Date();
    purchaseDate.setFullYear(purchaseDate.getFullYear() - (i % 4));
    purchaseDate.setMonth(purchaseDate.getMonth() - (i % 12));

    const warrantyStart = new Date(purchaseDate);
    const warrantyEnd = new Date(purchaseDate);
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 2);

    const yearsElapsed = (new Date().getTime() - purchaseDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
    const depreciatedVal = Math.max(0.1 * cost, cost - (cost / usefulLife) * yearsElapsed);

    const asset = await prisma.asset.create({
      data: {
        assetCode,
        assetTag,
        barcode: `BAR-${assetCode}`,
        name: assetName,
        description: `Strategic Plan International equipment matching ITT standards. Serial No: SN-${i * 1000 + 49302}`,
        serialNumber: `SN-${i * 1000 + 49302}`,
        model,
        manufacturer,
        purchaseOrder: `PO-2025-${5000 + i}`,
        invoiceNumber: `INV-2025-${9000 + i}`,
        purchaseDate,
        purchaseCost: cost,
        condition,
        status,
        warrantyStart,
        warrantyEnd,
        usefulLifeYears: usefulLife,
        currentValue: parseFloat(depreciatedVal.toFixed(2)),
        notes: 'Asset inspected and tagged by logistics team.',
        createdBy: 'admin@pact360.local',
        updatedBy: 'admin@pact360.local',
        categoryId: cat.id,
        supplierId: vendorsMap[vendorName].id,
        donorId: donorsMap[donorCode].id,
        grantId: grantsMap[grantCode].id,
        projectId: projectsMap[projectCode].id,
        officeId: officesMap[officeCode].id,
        departmentId: departmentsMap[deptCode].id,
        locationId: locationsMap[locationCode].id,
        custodianId,
      },
    });
    assetList.push(asset);
  }
  console.log('Seeded 120 assets.');

  // 14. Asset Assignments (History - 10 records)
  for (let i = 0; i < 10; i++) {
    const targetAsset = assetList[i];
    const assignedUser = usersMap[userEmails[i % userEmails.length]];

    await prisma.assetAssignment.create({
      data: {
        assetId: targetAsset.id,
        custodianId: assignedUser.id,
        assignedBy: 'admin@pact360.local',
        assignedDate: new Date('2025-01-10'),
        returnDueDate: new Date('2025-12-31'),
        returnedDate: i % 2 === 0 ? new Date('2025-12-15') : null,
        conditionOnAssignment: 'New',
        conditionOnReturn: i % 2 === 0 ? 'Good' : null,
        status: i % 2 === 0 ? 'Returned' : 'Active',
        notes: 'Standard field assignment.',
      },
    });
  }
  console.log('Seeded 10 asset assignments.');

  // 15. Asset Transfers (10 records)
  for (let i = 0; i < 10; i++) {
    const targetAsset = assetList[i + 15];
    const sourceOff = officesMap[officeCodes[i % officeCodes.length]];
    const destOff = officesMap[officeCodes[(i + 1) % officeCodes.length]];

    await prisma.assetTransfer.create({
      data: {
        assetId: targetAsset.id,
        transferType: 'Location',
        sourceOfficeId: sourceOff.id,
        destOfficeId: destOff.id,
        requestedBy: 'asset.manager@pact360.local',
        approvedBy: i % 3 === 0 ? 'operations.head@pact360.local' : null,
        transferDate: new Date(),
        status: i % 3 === 0 ? 'Approved' : 'Pending',
        notes: 'Asset relocation for new field staff.',
      },
    });
  }
  console.log('Seeded 10 asset transfers.');

  // 16. Maintenance (30 records: schedules + work orders)
  for (let i = 0; i < 10; i++) {
    const asset = assetList[i * 2];
    await prisma.maintenanceSchedule.create({
      data: {
        assetId: asset.id,
        maintenanceType: 'Preventive',
        description: 'Regular monthly performance inspection.',
        frequencyDays: 30,
        nextDueDate: new Date('2026-07-01'),
        status: 'Active',
      },
    });
  }

  const woStatuses = ['Scheduled', 'Pending', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];
  for (let i = 1; i <= 30; i++) {
    const asset = assetList[i * 3 % 120];
    const vendor = vendorsMap[vendorNames[i % vendorNames.length]];
    const status = woStatuses[i % woStatuses.length];
    
    await prisma.maintenanceWorkOrder.create({
      data: {
        assetId: asset.id,
        type: i % 4 === 0 ? 'Corrective' : 'Preventive',
        description: `Routine work order no. WO-00${i} for logistics compliance.`,
        vendorId: vendor.id,
        assignedOfficerId: 'maintenance.officer@pact360.local',
        priority: i % 3 === 0 ? 'High' : 'Medium',
        status,
        cost: 150.00 + (i * 20),
        scheduledDate: new Date(),
        checklist: JSON.stringify(['Check fluid levels', 'Inspect structural mounts', 'Test load capacity']),
        notes: 'Maintenance executed via corporate SLA framework.',
      },
    });
  }
  console.log('Seeded 30 maintenance work orders.');

  // 17. Contracts (20 contracts)
  const contractTypes = ['LTA', 'Service Agreement', 'Lease', 'Procurement'];
  const contractStatuses = ['Active', 'Draft', 'Under Review', 'Expiring Soon', 'Expired', 'Renewed'];

  for (let i = 1; i <= 20; i++) {
    const vendor = vendorsMap[vendorNames[i % vendorNames.length]];
    const project = projectsMap[projectCodes[i % projectCodes.length]];
    const grant = grantsMap[grantCodes[i % grantCodes.length]];
    const donor = donorsMap[donorCodes[i % donorCodes.length]];
    const manager = usersMap[userEmails[i % userEmails.length]];

    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + (i === 1 ? 0 : 1));
    if (i === 1) {
      endDate.setDate(endDate.getDate() + 15); // Expiring soon (15 days)
    }

    let status = contractStatuses[i % contractStatuses.length];
    if (i === 1) status = 'Expiring Soon';
    if (i === 2) status = 'Expired';

    const contract = await prisma.contract.create({
      data: {
        title: `${vendor.name} - ${contractTypes[i % contractTypes.length]} ${2025 + (i % 2)}`,
        contractNumber: `PLAN-CON-2025-${1000 + i}`,
        contractType: contractTypes[i % contractTypes.length],
        startDate,
        endDate,
        value: 5000.00 * i,
        paymentTerms: '30 Days Net from milestones acceptance',
        status,
        renewalStatus: status === 'Expiring Soon' ? 'Pending' : 'None',
        deliverables: 'Vendor must supply high-grade parts according to the technical requirements.',
        milestonesDesc: 'M1: Delivery of hardware (50%), M2: Installation (50%).',
        slaTerms: '99.5% network uptime, 4-hour response time.',
        complianceRequirements: 'Vendor must comply with Child Safeguarding policies.',
        createdBy: 'admin@pact360.local',
        updatedBy: 'admin@pact360.local',
        vendorId: vendor.id,
        projectId: project.id,
        grantId: grant.id,
        donorId: donor.id,
        contractManagerId: manager.id,
        departmentId: departmentsMap['LOG'].id,
      },
    });

    if (i <= 5) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: {
          assets: { connect: [{ id: assetList[i].id }] },
        },
      });
    }

    await prisma.contractMilestone.create({
      data: {
        contractId: contract.id,
        title: 'Initial Deployment',
        description: 'Completed delivery of physical units.',
        dueDate: new Date(),
        status: 'Achieved',
      },
    });

    await prisma.contractPayment.create({
      data: {
        contractId: contract.id,
        amount: (5000.00 * i),
        status: 'Paid',
        dueDate: new Date(),
      },
    });
  }
  console.log('Seeded 20 contracts.');

  // 18. Physical count Campaigns (5 Campaigns)
  const campStatuses = ['Draft', 'Active', 'Completed', 'Cancelled'];
  for (let i = 1; i <= 5; i++) {
    const status = campStatuses[i % campStatuses.length] || 'Completed';
    const campaign = await prisma.verificationCampaign.create({
      data: {
        name: `Q${i} Physical Audit Campaign - ${2025 + (i % 2)}`,
        startDate: new Date(),
        endDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000),
        assignedTeam: 'M. Flomo, D. Kamara, T. Kollie',
        status,
        officeId: officesMap[officeCodes[i % officeCodes.length]].id,
      }
    });

    // Seed verification logs for 5 assets inside campaign
    for (let j = 0; j < 5; j++) {
      const asset = assetList[j * 2 + i];
      await prisma.assetVerification.create({
        data: {
          campaignId: campaign.id,
          assetId: asset.id,
          verifiedBy: 'asset.manager@pact360.local',
          verifiedAt: new Date(),
          status: j % 4 === 0 ? 'Verified' : j % 4 === 1 ? 'Missing' : 'Damaged',
          condition: j % 2 === 0 ? 'Good' : 'Poor',
          notes: 'Asset matched records.',
        }
      });
    }
  }
  console.log('Seeded 5 verification campaigns.');

  // 19. Notifications (30 notifications)
  for (let i = 1; i <= 30; i++) {
    await prisma.notification.create({
      data: {
        userId: usersMap['admin@pact360.local'].id,
        title: i % 2 === 0 ? 'Contract Expiring Soon' : 'Maintenance Due',
        message: `Notification log number ${i} for administrative review.`,
        type: i % 2 === 0 ? 'ContractExpiry' : 'MaintenanceDue',
        isRead: i > 25,
      },
    });
  }
  console.log('Seeded 30 notifications.');

  // 20. Audit Logs (80 audit entries)
  const auditActions = [
    { action: 'LOGIN', module: 'Auth', notes: 'User login.' },
    { action: 'ASSET_CREATE', module: 'Assets', notes: 'Registered new device.' },
    { action: 'ASSET_TRANSFER', module: 'Assets', notes: 'Asset transferred to Nimba office.' },
    { action: 'CONTRACT_CREATE', module: 'Contracts', notes: 'Created lease contract.' },
    { action: 'SETTINGS_UPDATE', module: 'Administration', notes: 'Updated global defaults.' },
  ];

  for (let i = 1; i <= 80; i++) {
    const act = auditActions[i % auditActions.length];
    await prisma.auditLog.create({
      data: {
        userId: usersMap['admin@pact360.local'].id,
        action: act.action,
        module: act.module,
        notes: act.notes,
        ipAddress: '192.168.1.10' + (i % 9),
        timestamp: new Date(new Date().getTime() - i * 4 * 60 * 60 * 1000),
      },
    });
  }
  console.log('Seeded 80 audit log entries.');

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
