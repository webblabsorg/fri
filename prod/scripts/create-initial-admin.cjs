// Plain JS version to avoid ts-node/TS type resolution issues
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@testlawfirm.com'
  const password = 'Test123!@#'
  const firmName = 'Test Law Firm'

  console.log('🔐 Creating initial admin user...')

  const passwordHash = await bcrypt.hash(password, 12)

  // 1) Upsert admin user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'admin',
      emailVerified: true,
      status: 'active',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
      firmName,
    },
    create: {
      name: 'Admin User',
      email,
      passwordHash,
      emailVerified: true,
      role: 'admin',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
      status: 'active',
      firmName,
    },
  })

  console.log('✅ User upserted:', user.email)

  // 2) Create organization
  const organization = await prisma.organization.upsert({
    where: { id: 'prod-org-001' },
    update: {},
    create: {
      id: 'prod-org-001',
      name: firmName,
      type: 'law_firm',
      planTier: 'professional',
      subscriptionStatus: 'active',
      seatsTotal: 5,
      seatsUsed: 1,
      billingEmail: 'billing@testlawfirm.com',
      status: 'active',
    },
  })

  console.log('✅ Organization upserted:', organization.name)

  // 3) Link user to organization
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    },
  })

  console.log('✅ User linked to organization as owner')

  // 4) Create default workspace
  const workspace = await prisma.workspace.create({
    data: {
      organizationId: organization.id,
      name: 'My Workspace',
      type: 'personal',
      ownerId: user.id,
      status: 'active',
    },
  })

  console.log('✅ Workspace created:', workspace.name)

  // 5) Add user to workspace
  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'admin',
    },
  })

  console.log('✅ User added to workspace as admin')
  console.log('🎉 Initial admin setup complete. You can now log in with:')
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
}

main()
  .catch((error) => {
    console.error('Error creating initial admin:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
