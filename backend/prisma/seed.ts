import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Seed Roles
  const roles = [
    { name: "admin", label: "Administrator" },
    { name: "supervisor", label: "Supervisor" },
    { name: "ojt", label: "OJT Employee" },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // Seed Permissions
  const permissions = [
    { key: "users.view", label: "View Users", module: "users" },
    { key: "users.create", label: "Create Users", module: "users" },
    { key: "users.update", label: "Update Users", module: "users" },
    { key: "users.delete", label: "Delete Users", module: "users" },
    { key: "dtr.view", label: "View DTR", module: "dtr" },
    { key: "dtr.export", label: "Export DTR", module: "dtr" },
    { key: "dtr.manage", label: "Manage DTR Records", module: "dtr" },
    { key: "schedules.manage", label: "Manage Schedules", module: "schedules" },
    { key: "reports.view", label: "View Reports", module: "reports" },
    { key: "audit.view", label: "View Audit Logs", module: "audit" },
  ];
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    });
  }

  // Seed Default Department
  const dept = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "General", description: "Default department" },
  });

  // Seed Admin User
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const existing = await prisma.user.findUnique({
    where: { email: "admin@juanhr.com" },
  });
  if (!existing) {
    await prisma.user.create({
      data: {
        fullName: "System Administrator",
        email: "admin@juanhr.com",
        passwordHash: await bcrypt.hash("Admin@123", 12),
        gender: "male",
        roleId: adminRole.id,
        departmentId: dept.id,
        isActive: true,
      },
    });
  }

  // Seed a default schedule
  await prisma.schedule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Standard 8-5",
      periodType: "two_period",
      amIn: "08:00",
      amOut: "12:00",
      pmIn: "13:00",
      pmOut: "17:00",
      workDays: JSON.stringify([
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ]),
      graceMinutes: 15,
    },
  });

  console.log("✅ Seed complete. Admin: admin@juanhr.com / Admin@123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
