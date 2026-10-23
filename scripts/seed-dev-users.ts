// Dev-only seed: creates an organization plus one admin, one manager and one
// staff user so all three roles can be demoed in Phase 1. This is NOT the
// full business seed — that arrives in Phase 6 (`npm run seed`).
//
// Usage:  node scripts/seed-dev-users.ts
// (Node >= 22.6 runs TypeScript directly via --experimental-strip-types;
// Node 23+ enables it by default. Uses only relative imports so no path
// aliases are needed at run time.)

import { loadEnvFile } from 'node:process'

// Load .env before anything reads process.env.
// (Node >= 20.12 provides process.loadEnvFile / the loadEnvFile export.)
loadEnvFile('.env')

process.env.NODE_ENV = process.env.NODE_ENV ?? 'development'

const { connectDB } = await import('../lib/db.ts')
const { hashPassword } = await import('../lib/password.ts')
const { Organization } = await import('../models/organization.ts')
const { User } = await import('../models/user.ts')

const ORG_NAME = 'Demo Organization'

const users = [
  { name: 'Alice Admin', email: 'admin@example.com', role: 'admin' as const },
  { name: 'Mia Manager', email: 'manager@example.com', role: 'manager' as const },
  { name: 'Sam Staff', email: 'staff@example.com', role: 'staff' as const },
]

const PASSWORD = 'Password123!'

async function main() {
  await connectDB()
  console.log('Connected to MongoDB.')

  // Reuse or create the demo organization.
  let org = await Organization.findOne({ name: ORG_NAME }).lean()
  if (!org) {
    org = await Organization.create({ name: ORG_NAME })
    console.log(`Created organization "${ORG_NAME}".`)
  } else {
    console.log(`Using existing organization "${ORG_NAME}".`)
  }

  for (const u of users) {
    const existing = await User.findOne({ email: u.email }).lean()
    if (existing) {
      console.log(`- ${u.role.padEnd(7)} ${u.email} already exists, skipping.`)
      continue
    }
    const passwordHash = await hashPassword(PASSWORD)
    await User.create({
      organizationId: org._id,
      departmentId: null,
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      isActive: true,
    })
    console.log(`- ${u.role.padEnd(7)} ${u.email} created.`)
  }

  console.log('\nDemo accounts (password: ' + PASSWORD + '):')
  for (const u of users) console.log(`  ${u.role.padEnd(7)} ${u.email}`)

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
