'use client'

import { useOrganization } from '@/components/providers/OrganizationProvider'
import FinancialDashboard from '@/components/finance/FinancialDashboard'

export default function OverviewPage() {
  const { currentOrganization, isLoading } = useOrganization()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!currentOrganization?.id) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">No organization found. Please join or create an organization.</div>
      </div>
    )
  }

  return <FinancialDashboard organizationId={currentOrganization.id} />
}
