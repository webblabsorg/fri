import { prisma } from '@/lib/db'

export async function getOrganizationBaseCurrency(organizationId: string): Promise<string> {
  const key = `finance:baseCurrency:${organizationId}`
  const setting = await prisma.systemSetting.findUnique({ where: { key } })

  if (setting?.value?.trim()) {
    return setting.value.trim().toUpperCase()
  }

  return (process.env.FINANCE_BASE_CURRENCY || 'USD').toUpperCase()
}

export async function setOrganizationBaseCurrency(organizationId: string, currency: string): Promise<void> {
  const key = `finance:baseCurrency:${organizationId}`
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: currency.trim().toUpperCase(), updatedAt: new Date() },
    create: { key, value: currency.trim().toUpperCase() },
  })
}
