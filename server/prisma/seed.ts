import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding database...');

  // 1. System Settings
  const settingsCount = await prisma.systemSetting.count();
  let setting;
  if (settingsCount === 0) {
    setting = await prisma.systemSetting.create({
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
      },
    });
    console.log('Created default system settings.');
  }

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
    const existing = await prisma.permission.findUnique({ where: { code: perm.code } });
    if (!existing) {
      permissionsMap[perm.code] = await prisma.permission.create({ data: perm });
    } else {
      permissionsMap[perm.code] = existing;
    }
  }
  console.log('Seeded permissions.');

  // 3. Roles
  const rolesData = [
    { name: 'Super Admin', description: 'Full access to all modules and configurations', permissions: Object.keys(permissionsMap) },
    { name: 'System Administrator', description: 'Manage users, locations, settings, and audits', permissions: ['users:read', 'users:write', 'roles:read', 'roles:write', 'reports:read', 'audit:read', 'settings:write'] },
    { name: 'Country Director', description: 'Executive read-only view of dashboard and report insights', permissions: ['assets:read', 'contracts:read', 'maintenance:read', 'projects:read', 'vendors:read', 'reports:read', 'reports:export'] },
    { name: 'Head of Operations', description: 'Approve disposals, transfers, and high-value contracts', permissions: ['assets:read', 'assets:transfer', 'assets:dispose', 'contracts:read', 'contracts:approve', 'maintenance:read', 'projects:read', 'vendors:read', 'reports:read', 'reports:export', 'audit:read'] },
    { name: 'Asset Manager', description: 'Register, track, assign, transfer, and maintain assets', permissions: ['assets:read', 'assets:write', 'assets:assign', 'assets:transfer', 'assets:dispose', 'maintenance:read', 'maintenance:write', 'vendors:read', 'reports:read'] },
    { name: 'Contract Manager', description: 'Manage vendor procurement agreements and milestones', permissions: ['contracts:read', 'contracts:write', 'vendors:read', 'vendors:write', 'projects:read', 'reports:read'] },
    { name: 'Project Manager', description: 'View and allocate assets and contracts to specific project activities', permissions: ['assets:read', 'contracts:read', 'projects:read', 'projects:write', 'reports:read'] },
    { name: 'Grants Manager', description: 'Review donor grant allocations, budgets, and compliance', permissions: ['assets:read', 'contracts:read', 'projects:read', 'reports:read'] },
    { name: 'Finance Manager', description: 'Audit purchase cost and asset depreciation calculations', permissions: ['assets:read', 'contracts:read', 'reports:read', 'reports:export'] },
    { name: 'Auditor', description: 'Complete system audit visibility to monitor compliance and trace history', permissions: ['assets:read', 'contracts:read', 'projects:read', 'vendors:read', 'reports:read', 'audit:read'] },
  ];

  const rolesMap: Record<string, any> = {};
  for (const roleData of rolesData) {
    const existing = await prisma.role.findUnique({ where: { name: roleData.name } });
    if (!existing) {
      rolesMap[roleData.name] = await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          permissions: {
            connect: roleData.permissions.map(code => ({ id: permissionsMap[code].id })),
          },
        },
      });
    } else {
      rolesMap[roleData.name] = existing;
    }
  }
  console.log('Seeded roles.');

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
    const existing = await prisma.office.findUnique({ where: { name: office.name } });
    if (!existing) {
      officesMap[office.code] = await prisma.office.create({ data: office });
    } else {
      officesMap[office.code] = existing;
    }
  }
  console.log('Seeded offices.');

  // 5. Departments
  const departmentsData = [
    { name: 'Operations & Administration', code: 'OPS' },
    { name: 'Programs & Development', code: 'PROG' },
    { name: 'Finance & Accounts', code: 'FIN' },
    { name: 'Logistics & Procurement', code: 'LOG' },
    { name: 'Human Resources', code: 'HR' },
  ];

  const departmentsMap: Record<string, any> = {};
  for (const dept of departmentsData) {
    const existing = await prisma.department.findUnique({ where: { name: dept.name } });
    if (!existing) {
      departmentsMap[dept.code] = await prisma.department.create({ data: dept });
    } else {
      departmentsMap[dept.code] = existing;
    }
  }
  console.log('Seeded departments.');

  // 6. Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', salt);
  const assetPasswordHash = await bcrypt.hash('Asset@12345', salt);
  const contractPasswordHash = await bcrypt.hash('Contract@12345', salt);
  const projectPasswordHash = await bcrypt.hash('Project@12345', salt);
  const auditorPasswordHash = await bcrypt.hash('Auditor@12345', salt);

  const usersData = [
    { email: 'admin@pact360.local', passwordHash: adminPasswordHash, firstName: 'Super', lastName: 'Admin', status: 'Active', roleName: 'Super Admin', officeCode: 'MCO', departmentCode: 'OPS' },
    { email: 'asset.manager@pact360.local', passwordHash: assetPasswordHash, firstName: 'Asset', lastName: 'Manager', status: 'Active', roleName: 'Asset Manager', officeCode: 'MCO', departmentCode: 'LOG' },
    { email: 'contract.manager@pact360.local', passwordHash: contractPasswordHash, firstName: 'Contract', lastName: 'Manager', status: 'Active', roleName: 'Contract Manager', officeCode: 'MCO', departmentCode: 'LOG' },
    { email: 'project.manager@pact360.local', passwordHash: projectPasswordHash, firstName: 'Project', lastName: 'Manager', status: 'Active', roleName: 'Project Manager', officeCode: 'NFO', departmentCode: 'PROG' },
    { email: 'auditor@pact360.local', passwordHash: auditorPasswordHash, firstName: 'Compliance', lastName: 'Auditor', status: 'Active', roleName: 'Auditor', officeCode: 'MCO', departmentCode: 'FIN' },
    // Additional roles for high-fidelity seeding
    { email: 'operations.head@pact360.local', passwordHash: adminPasswordHash, firstName: 'Head', lastName: 'Operations', status: 'Active', roleName: 'Head of Operations', officeCode: 'MCO', departmentCode: 'OPS' },
    { email: 'grants.manager@pact360.local', passwordHash: adminPasswordHash, firstName: 'Grants', lastName: 'Manager', status: 'Active', roleName: 'Grants Manager', officeCode: 'MCO', departmentCode: 'FIN' },
    { email: 'finance.manager@pact360.local', passwordHash: adminPasswordHash, firstName: 'Finance', lastName: 'Manager', status: 'Active', roleName: 'Finance Manager', officeCode: 'MCO', departmentCode: 'FIN' },
  ];

  const usersMap: Record<string, any> = {};
  for (const userData of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!existing) {
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
    } else {
      usersMap[userData.email] = existing;
    }
  }
  console.log('Seeded users.');

  // 7. Donors
  const donorsData = [
    { name: 'Swedish International Development Cooperation Agency', code: 'SIDA' },
    { name: 'United States Agency for International Development', code: 'USAID' },
    { name: 'European Union', code: 'EU' },
    { name: 'Global Affairs Canada', code: 'GAC' },
    { name: 'United Nations Children\'s Fund', code: 'UNICEF' },
  ];

  const donorsMap: Record<string, any> = {};
  for (const donor of donorsData) {
    const existing = await prisma.donor.findUnique({ where: { name: donor.name } });
    if (!existing) {
      donorsMap[donor.code] = await prisma.donor.create({ data: donor });
    } else {
      donorsMap[donor.code] = existing;
    }
  }
  console.log('Seeded donors.');

  // 8. Grants
  const grantsData = [
    { name: 'SIDA WASH and Sanitation Support', code: 'SIDA-WASH-2025', donorCode: 'SIDA', amount: 1500000.00, startDate: new Date('2025-01-01'), endDate: new Date('2027-12-31'), status: 'Active', complianceRequirements: 'Annual asset audits, no transfers above $5000 without SIDA program officer signoff.' },
    { name: 'USAID Primary Education Initiative', code: 'USAID-EDU-2024', donorCode: 'USAID', amount: 3200000.00, startDate: new Date('2024-06-01'), endDate: new Date('2028-05-31'), status: 'Active', complianceRequirements: 'All equipment must carry USAID stickers, standard disposal method guidelines.' },
    { name: 'EU Child Rights Protection Program', code: 'EU-CR-2025', donorCode: 'EU', amount: 800000.00, startDate: new Date('2025-03-01'), endDate: new Date('2026-02-28'), status: 'Active', complianceRequirements: 'Audited asset register required on closure.' },
    { name: 'GAC Women Empowerment and Gender Equality', code: 'GAC-GE-2024', donorCode: 'GAC', amount: 2000000.00, startDate: new Date('2024-09-01'), endDate: new Date('2027-08-31'), status: 'Active', complianceRequirements: 'Assets are exclusively for women-led cooperative activities.' },
    { name: 'UNICEF Health and Rural Nutrition Plan', code: 'UNICEF-NUT-2025', donorCode: 'UNICEF', amount: 650000.00, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), status: 'Active', complianceRequirements: 'Monthly log check of emergency response vehicles.' },
    { name: 'SIDA Emergency Food & SHELTER Response', code: 'SIDA-EMR-2026', donorCode: 'SIDA', amount: 950000.00, startDate: new Date('2026-02-01'), endDate: new Date('2026-11-30'), status: 'Active', complianceRequirements: 'Accelerated disposal procedures for crisis operations.' },
  ];

  const grantsMap: Record<string, any> = {};
  for (const grant of grantsData) {
    const existing = await prisma.grant.findUnique({ where: { name: grant.name } });
    if (!existing) {
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
    } else {
      grantsMap[grant.code] = existing;
    }
  }
  console.log('Seeded grants.');

  // 9. Projects
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
    const existing = await prisma.project.findUnique({ where: { name: proj.name } });
    if (!existing) {
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
    } else {
      projectsMap[proj.code] = existing;
    }
  }
  console.log('Seeded projects.');

  // 10. Vendors
  const vendorsData = [
    { name: 'Toyota Liberia', contactName: 'Musa Kamara', email: 'sales@toyota.com.lr', phone: '+231886111222', address: 'Tubman Boulevard, Monrovia', taxId: 'LRA-10029-3829', serviceCategory: 'Vehicles & Maintenance', performanceScore: 4.8, status: 'Active', notes: 'Primary supplier for operations vehicles and OEM parts.' },
    { name: 'Monrovia IT Solutions', contactName: 'Doris Cooper', email: 'info@monroviait.com', phone: '+231777555666', address: 'Broad Street, Monrovia', taxId: 'LRA-29381-2292', serviceCategory: 'IT hardware & networking', performanceScore: 4.5, status: 'Active', notes: 'Local IT SLA holder.' },
    { name: 'Office Depot Liberia', contactName: 'John Flomo', email: 'john@officedepot.com.lr', phone: '+231886333444', address: 'Randall Street, Monrovia', taxId: 'LRA-88273-1123', serviceCategory: 'Office Furniture & Supplies', performanceScore: 4.2, status: 'Active', notes: 'Quick delivery terms.' },
    { name: 'Libtelco', contactName: 'Agnes Brown', email: 'enterprise@libtelco.com.lr', phone: '+231880123456', address: 'Sinkor, Monrovia', taxId: 'LRA-37283-9982', serviceCategory: 'Telecommunications', performanceScore: 4.0, status: 'Active', notes: 'ISP for country and field offices.' },
    { name: 'Total Liberia', contactName: 'G. Jackson', email: 'fuels@total.com.lr', phone: '+231886999888', address: 'Bushrod Island, Monrovia', taxId: 'LRA-19283-8822', serviceCategory: 'Fuel & Lubricants', performanceScore: 4.6, status: 'Active', notes: 'Fuel voucher contract provider.' },
    { name: 'Starz Technologies', contactName: 'B. Sackie', email: 'info@starz.edu.lr', phone: '+231776928372', address: 'Airfield, Monrovia', taxId: 'LRA-82938-1234', serviceCategory: 'IT Training & Web Services', performanceScore: 4.4, status: 'Active', notes: 'Ad hoc tech support.' },
    { name: 'Consolidated Group', contactName: 'Lal Bhatia', email: 'dstv@congroup.com.lr', phone: '+231886515253', address: 'Capitol Bypass, Monrovia', taxId: 'LRA-92837-5566', serviceCategory: 'Satellite & Media Services', performanceScore: 3.9, status: 'Active', notes: 'Office communications.' },
    { name: 'Liberia Auto Services', contactName: 'Alfred Sherman', email: 'service@libauto.com', phone: '+231886726152', address: 'Gardnersville, Monrovia', taxId: 'LRA-10293-8837', serviceCategory: 'Vehicle Repair', performanceScore: 4.7, status: 'Active', notes: 'Qualified garage for fleet maintenance.' },
    { name: 'Secure Security Services', contactName: 'Col. J. Davis', email: 'operations@securesafeties.com', phone: '+231770928372', address: 'Paynesville, Liberia', taxId: 'LRA-82938-9283', serviceCategory: 'Security Guarding', performanceScore: 4.9, status: 'Active', notes: 'Guard deployment for all offices.' },
    { name: 'United Printing Press', contactName: 'Victor Harris', email: 'sales@unitedpress.com', phone: '+231886293847', address: 'Benson Street, Monrovia', taxId: 'LRA-72837-1928', serviceCategory: 'Printing & Branding', performanceScore: 4.3, status: 'Active', notes: 'Provides branded banners and t-shirts.' },
    { name: 'General Supplies Co.', contactName: 'H. Haddad', email: 'general@supplies.com.lr', phone: '+231886882211', address: 'Randall Street, Monrovia', taxId: 'LRA-88192-3847', serviceCategory: 'General Merchandising', performanceScore: 4.1, status: 'Active', notes: 'Office consumables.' },
    { name: 'Monrovia Stationery Store', contactName: 'Peter Kollie', email: 'peter@mstationery.com', phone: '+231777291837', address: 'Camp Johnson Road, Monrovia', taxId: 'LRA-62512-3829', serviceCategory: 'Stationery', performanceScore: 4.2, status: 'Active', notes: 'Frequent buyer program.' },
    { name: 'Elite Engineering', contactName: 'Eng. Prince Cole', email: 'prince@eliteeng.com.lr', phone: '+231886910293', address: 'Johnson Street, Monrovia', taxId: 'LRA-12039-3829', serviceCategory: 'Construction & Civil Eng', performanceScore: 4.6, status: 'Active', notes: 'WASH construction contractor.' },
    { name: 'PowerGen Liberia', contactName: 'Isaac Taylor', email: 'taylor@powergen.com.lr', phone: '+231886992288', address: 'Congo Town, Monrovia', taxId: 'LRA-30291-3829', serviceCategory: 'Solar & Generator Systems', performanceScore: 4.7, status: 'Active', notes: 'Solar grids and diesel maintenance.' },
    { name: 'Liberia Logistics Services', contactName: 'Martha Cooper', email: 'martha@liblogistics.com', phone: '+231776991122', address: 'Freeport, Monrovia', taxId: 'LRA-89281-2918', serviceCategory: 'Freight & Clearing', performanceScore: 4.5, status: 'Active', notes: 'Clears custom imports.' },
  ];

  const vendorsMap: Record<string, any> = {};
  for (const vendor of vendorsData) {
    const existing = await prisma.vendor.findUnique({ where: { name: vendor.name } });
    if (!existing) {
      vendorsMap[vendor.name] = await prisma.vendor.create({ data: vendor });
    } else {
      vendorsMap[vendor.name] = existing;
    }
  }
  console.log('Seeded vendors.');

  // 11. Asset Categories
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
    const existing = await prisma.assetCategory.findUnique({ where: { name: cat.name } });
    if (!existing) {
      categoriesMap[cat.name] = await prisma.assetCategory.create({ data: cat });
    } else {
      categoriesMap[cat.name] = existing;
    }
  }
  console.log('Seeded categories.');

  // 12. Assets (Seeding 100 sample assets)
  const conditions = ['New', 'Good', 'Fair', 'Poor', 'Damaged', 'Unusable'];
  const statuses = ['Available', 'Assigned', 'In Use', 'Under Maintenance', 'Lost', 'Stolen', 'Damaged', 'Retired', 'Disposed', 'Transferred'];

  const projectCodes = Object.keys(projectsMap);
  const officeCodes = Object.keys(officesMap);
  const deptCodes = Object.keys(departmentsMap);
  const userEmails = Object.keys(usersMap);
  const donorCodes = Object.keys(donorsMap);
  const grantCodes = Object.keys(grantsMap);
  const vendorNames = Object.keys(vendorsMap);

  const assetList = [];
  const totalAssetsCount = await prisma.asset.count();
  if (totalAssetsCount === 0) {
    // Generate 100 high-quality assets programmatically
    for (let i = 1; i <= 100; i++) {
      // Pick structured categories to distribute realistic items
      let categoryName = 'Laptops';
      let assetName = `Lenovo ThinkPad T14 Gen ${4 + (i % 3)}`;
      let model = `ThinkPad T14`;
      let manufacturer = 'Lenovo';
      let usefulLife = 4;
      let cost = 1200.00;

      if (i <= 10) {
        categoryName = 'Vehicles';
        assetName = i % 2 === 0 ? 'Toyota Land Cruiser 4WD Hardtop' : 'Toyota Hilux Double Cabin';
        model = i % 2 === 0 ? 'Land Cruiser HZJ78' : 'Hilux 4x4';
        manufacturer = 'Toyota';
        usefulLife = 7;
        cost = 45000.00 + (i * 500);
      } else if (i <= 20) {
        categoryName = 'Motorcycles';
        assetName = 'Yamaha DT125 Trail Bike';
        model = 'DT125';
        manufacturer = 'Yamaha';
        usefulLife = 5;
        cost = 3200.00;
      } else if (i <= 55) {
        // Laptops (21 to 55)
        categoryName = 'Laptops';
        assetName = i % 2 === 0 ? 'HP EliteBook 840 G10' : 'Lenovo ThinkPad L14';
        model = i % 2 === 0 ? 'EliteBook 840' : 'ThinkPad L14';
        manufacturer = i % 2 === 0 ? 'HP' : 'Lenovo';
        usefulLife = 4;
        cost = 1100.00;
      } else if (i <= 65) {
        categoryName = 'Generators';
        assetName = i % 2 === 0 ? 'Perkins 50kVA Diesel Generator' : 'Kipor 10kVA Soundproof Generator';
        model = i % 2 === 0 ? '404D-22G' : 'KDE12STA';
        manufacturer = i % 2 === 0 ? 'Perkins' : 'Kipor';
        usefulLife = 8;
        cost = 15000.00 + (i * 200);
      } else if (i <= 75) {
        categoryName = 'Solar Equipment';
        assetName = 'Victron Energy 5kVA Solar Inverter System';
        model = 'MultiPlus-II 48/5000';
        manufacturer = 'Victron Energy';
        usefulLife = 10;
        cost = 8500.00;
      } else if (i <= 85) {
        categoryName = 'Printers';
        assetName = 'HP LaserJet Pro MFP M428fdw';
        model = 'LaserJet Pro M428';
        manufacturer = 'HP';
        usefulLife = 5;
        cost = 650.00;
      } else if (i <= 90) {
        categoryName = 'Network Equipment';
        assetName = 'Cisco 24-Port PoE Switch';
        model = 'Catalyst 2960-L';
        manufacturer = 'Cisco';
        usefulLife = 5;
        cost = 1800.00;
      } else if (i <= 95) {
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

      // Pick randomized relationships
      const projectCode = projectCodes[i % projectCodes.length];
      const officeCode = officeCodes[i % officeCodes.length];
      const deptCode = deptCodes[i % deptCodes.length];
      const donorCode = donorCodes[i % donorCodes.length];
      const grantCode = grantCodes[i % grantCodes.length];
      const vendorName = vendorNames[i % vendorNames.length];
      
      const condition = i % 15 === 0 ? 'Fair' : i % 25 === 0 ? 'Poor' : i % 40 === 0 ? 'Damaged' : 'Good';
      let status = 'Available';
      let custodianId: string | null = null;
      
      if (i % 3 === 0) {
        status = 'Assigned';
        const userEmail = userEmails[i % userEmails.length];
        custodianId = usersMap[userEmail].id;
      } else if (i % 7 === 0) {
        status = 'In Use';
        const userEmail = userEmails[(i + 1) % userEmails.length];
        custodianId = usersMap[userEmail].id;
      } else if (i % 12 === 0) {
        status = 'Under Maintenance';
      } else if (i % 35 === 0) {
        status = 'Disposed';
      }

      const purchaseDate = new Date();
      purchaseDate.setFullYear(purchaseDate.getFullYear() - (i % 4));
      purchaseDate.setMonth(purchaseDate.getMonth() - (i % 12));

      const warrantyStart = new Date(purchaseDate);
      const warrantyEnd = new Date(purchaseDate);
      warrantyEnd.setFullYear(warrantyEnd.getFullYear() + (i % 3 === 0 ? 3 : 1));

      // Simple straight-line depreciation calculation
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
          custodianId,
        },
      });
      assetList.push(asset);
    }
    console.log('Seeded 100 assets.');
  } else {
    const all = await prisma.asset.findMany({ take: 20 });
    assetList.push(...all);
  }

  // 13. Asset Assignments (History)
  const assignmentCount = await prisma.assetAssignment.count();
  if (assignmentCount === 0) {
    // Generate some historical assignments for the first 15 assets
    for (let i = 0; i < 15; i++) {
      const targetAsset = assetList[i];
      const userEmail = userEmails[i % userEmails.length];
      const assignedUser = usersMap[userEmail];

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
    console.log('Seeded asset assignments.');
  }

  // 14. Asset Transfers
  const transferCount = await prisma.assetTransfer.count();
  if (transferCount === 0) {
    for (let i = 0; i < 10; i++) {
      const targetAsset = assetList[i + 10];
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
    console.log('Seeded asset transfers.');
  }

  // 15. Maintenance Records (Schedules and Work Orders - 25 records)
  const maintScheduleCount = await prisma.maintenanceSchedule.count();
  if (maintScheduleCount === 0) {
    for (let i = 0; i < 10; i++) {
      const asset = assetList[i * 2]; // generators, vehicles, solar grids
      await prisma.maintenanceSchedule.create({
        data: {
          assetId: asset.id,
          maintenanceType: 'Preventive',
          description: 'Regular monthly performance inspection and filters check.',
          frequencyDays: 30,
          nextDueDate: new Date('2026-07-01'),
          status: 'Active',
        },
      });
    }
    console.log('Seeded maintenance schedules.');
  }

  const maintWorkOrderCount = await prisma.maintenanceWorkOrder.count();
  if (maintWorkOrderCount === 0) {
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const woStatuses = ['Scheduled', 'Pending', 'In Progress', 'Completed', 'Overdue', 'Cancelled'];

    for (let i = 1; i <= 25; i++) {
      const asset = assetList[i * 3 % 100];
      const vendorName = vendorNames[i % vendorNames.length];
      const vendor = vendorsMap[vendorName];

      const status = woStatuses[i % woStatuses.length];
      const priority = priorities[i % priorities.length];
      
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() - (i % 10));
      
      const completionDate = status === 'Completed' ? new Date() : null;

      await prisma.maintenanceWorkOrder.create({
        data: {
          assetId: asset.id,
          type: i % 4 === 0 ? 'Corrective' : 'Preventive',
          description: `Routine work order no. WO-00${i} for logistics compliance.`,
          vendorId: vendor.id,
          assignedOfficerId: 'asset.manager@pact360.local',
          priority,
          status,
          cost: 150.00 + (i * 20),
          scheduledDate,
          completionDate,
          checklist: JSON.stringify(['Check fluid levels', 'Inspect structural mounts', 'Test load capacity', 'Wipe casing clean']),
          notes: 'Maintenance executed via corporate SLA framework.',
          completionReport: status === 'Completed' ? 'All diagnostic checks passed. System ready.' : null,
        },
      });
    }
    console.log('Seeded 25 maintenance work orders.');
  }

  // 16. Contracts (20 contracts)
  const contractCount = await prisma.contract.count();
  if (contractCount === 0) {
    const contractTypes = ['LTA', 'Service Agreement', 'Lease', 'Procurement'];
    const contractStatuses = ['Active', 'Draft', 'Under Review', 'Expiring Soon', 'Expired', 'Renewed'];

    for (let i = 1; i <= 20; i++) {
      const vendorName = vendorNames[i % vendorNames.length];
      const projectCode = projectCodes[i % projectCodes.length];
      const grantCode = grantCodes[i % grantCodes.length];
      const donorCode = donorCodes[i % donorCodes.length];
      const managerEmail = userEmails[i % userEmails.length];

      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - (i % 2 === 0 ? 1 : 0));
      startDate.setMonth(startDate.getMonth() - (i % 6));

      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + (i % 3 === 0 ? 2 : 1));

      let status = contractStatuses[i % contractStatuses.length];
      // Force some expired/expiring soon
      if (i === 1) status = 'Expiring Soon';
      if (i === 2) status = 'Expired';

      const contract = await prisma.contract.create({
        data: {
          title: `${vendorName} - ${contractTypes[i % contractTypes.length]} ${2025 + (i % 2)}`,
          contractNumber: `PLAN-CON-2025-${1000 + i}`,
          contractType: contractTypes[i % contractTypes.length],
          startDate,
          endDate,
          value: 5000.00 * i,
          paymentTerms: '30 Days Net from milestones acceptance',
          status,
          renewalStatus: status === 'Expiring Soon' ? 'Pending' : 'None',
          deliverables: 'Vendor must supply high-grade parts according to the technical requirements specified in the tender.',
          milestonesDesc: 'M1: Delivery of hardware (50%), M2: Installation (30%), M3: Commissioning (20%).',
          slaTerms: '99.5% network uptime, 4-hour response time for critical faults.',
          complianceRequirements: 'Vendor must comply with Plan International Child Safeguarding Code of Conduct.',
          createdBy: 'admin@pact360.local',
          updatedBy: 'admin@pact360.local',
          vendorId: vendorsMap[vendorName].id,
          projectId: projectsMap[projectCode].id,
          grantId: grantsMap[grantCode].id,
          donorId: donorsMap[donorCode].id,
          contractManagerId: usersMap[managerEmail].id,
          departmentId: departmentsMap['LOG'].id,
        },
      });

      // Link first few assets to contracts
      if (i <= 5) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            assets: {
              connect: [{ id: assetList[i].id }, { id: assetList[i + 1].id }],
            },
          },
        });
      }

      // Seed milestones
      await prisma.contractMilestone.create({
        data: {
          contractId: contract.id,
          title: 'Phase 1 Delivery',
          description: 'Deliver the physical items to Monrovia Country Office.',
          dueDate: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'Achieved',
          achievedDate: new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000),
        },
      });

      // Seed payments
      await prisma.contractPayment.create({
        data: {
          contractId: contract.id,
          amount: (5000.00 * i) / 2,
          status: 'Paid',
          dueDate: new Date(startDate.getTime() + 45 * 24 * 60 * 60 * 1000),
          paidDate: new Date(startDate.getTime() + 42 * 24 * 60 * 60 * 1000),
          invoiceNumber: `INV-VEND-${100 + i}`,
        },
      });
    }
    console.log('Seeded 20 contracts.');
  }

  // 17. Notifications (30 notifications)
  const notificationCount = await prisma.notification.count();
  if (notificationCount === 0) {
    const admin = usersMap['admin@pact360.local'];
    const assetMgr = usersMap['asset.manager@pact360.local'];
    const types = ['ContractExpiry', 'MaintenanceDue', 'AssetDisposal', 'SystemUpdate'];

    for (let i = 1; i <= 30; i++) {
      const targetUser = i % 2 === 0 ? admin : assetMgr;
      const type = types[i % types.length];
      
      let title = 'System Notification';
      let message = 'New system update successfully configured.';

      if (type === 'ContractExpiry') {
        title = 'Contract Expiring Soon';
        message = `LTA Agreement Contract PLAN-CON-2025-1001 is set to expire on ${new Date().toLocaleDateString()}. Please initiate review.`;
      } else if (type === 'MaintenanceDue') {
        title = 'Maintenance Work Order Due';
        message = `Preventive work order WO-00${i} for generator check is due.`;
      } else if (type === 'AssetDisposal') {
        title = 'Asset Disposal Request Approved';
        message = `Disposal request for Toyota Land Cruiser PLAN-VEH-0001 has been signed off.`;
      }

      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          title,
          message,
          type,
          isRead: i > 25,
        },
      });
    }
    console.log('Seeded 30 notifications.');
  }

  // 18. Audit Logs (50 audit log entries)
  const auditLogsCount = await prisma.auditLog.count();
  if (auditLogsCount === 0) {
    const admin = usersMap['admin@pact360.local'];
    const actions = [
      { action: 'LOGIN', module: 'Auth', notes: 'User logged in successfully.' },
      { action: 'ASSET_CREATE', module: 'Assets', notes: 'Registered laptop PLAN-LAP-0023.' },
      { action: 'ASSET_TRANSFER', module: 'Assets', notes: 'Initiated transfer request to Lofa Field Office.' },
      { action: 'CONTRACT_UPDATE', module: 'Contracts', notes: 'Updated insurance liability clauses.' },
      { action: 'SETTINGS_UPDATE', module: 'Administration', notes: 'Changed asset default code prefix to PLAN-AST-.' },
    ];

    for (let i = 1; i <= 50; i++) {
      const act = actions[i % actions.length];
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: act.action,
          module: act.module,
          notes: act.notes,
          ipAddress: '192.168.1.10' + (i % 9),
          timestamp: new Date(new Date().getTime() - i * 6 * 60 * 60 * 1000), // intervals of 6 hours
        },
      });
    }
    console.log('Seeded 50 audit log entries.');
  }

  // 19. Asset Lifecycle Events
  const lifecycleCount = await prisma.assetLifecycleEvent.count();
  if (lifecycleCount === 0) {
    for (let i = 0; i < 20; i++) {
      const asset = assetList[i];
      await prisma.assetLifecycleEvent.create({
        data: {
          assetId: asset.id,
          eventType: 'Acquisition',
          performedBy: 'admin@pact360.local',
          description: 'Asset purchased and registered under SIDA funding lines.',
          notes: 'Inspected and confirmed in good order.',
        },
      });
      await prisma.assetLifecycleEvent.create({
        data: {
          assetId: asset.id,
          eventType: 'Tagging',
          performedBy: 'asset.manager@pact360.local',
          description: `Physical asset barcode tag generated and attached: ${asset.assetTag}`,
        },
      });
    }
    console.log('Seeded lifecycle events.');
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
