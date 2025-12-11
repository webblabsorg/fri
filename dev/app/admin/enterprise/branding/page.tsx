'use client'

import { useState, useEffect } from 'react'
import { Palette, Globe, Mail, Image, CheckCircle, AlertCircle, Eye } from 'lucide-react'

interface BrandingConfig {
  id: string
  customDomain: string | null
  domainVerified: boolean
  domainVerifyToken: string | null
  logoUrl: string | null
  logoLightUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  companyName: string | null
  tagline: string | null
  supportEmail: string | null
  hideFooterBranding: boolean
  customCss: string | null
  customJs: string | null
  emailFromName: string | null
  emailHeaderHtml: string | null
  emailFooterHtml: string | null
}

interface Organization {
  id: string
  name: string
  planTier: string
}

export default function BrandingPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'colors' | 'domain' | 'email'>('general')

  const [formData, setFormData] = useState({
    customDomain: '',
    logoUrl: '',
    logoLightUrl: '',
    faviconUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#6366F1',
    accentColor: '#10B981',
    companyName: '',
    tagline: '',
    supportEmail: '',
    hideFooterBranding: false,
    customCss: '',
    customJs: '',
    emailFromName: '',
    emailHeaderHtml: '',
    emailFooterHtml: '',
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      fetchBranding()
    }
  }, [selectedOrg])

  async function fetchOrganizations() {
    try {
      const response = await fetch('/api/admin/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  async function fetchBranding() {
    setLoading(true)
    try {
      const response = await fetch(`/api/enterprise/branding?organizationId=${selectedOrg}`)
      const data = await response.json()
      
      if (data.branding) {
        setBranding(data.branding)
        setFormData({
          customDomain: data.branding.customDomain || '',
          logoUrl: data.branding.logoUrl || '',
          logoLightUrl: data.branding.logoLightUrl || '',
          faviconUrl: data.branding.faviconUrl || '',
          primaryColor: data.branding.primaryColor || '#3B82F6',
          secondaryColor: data.branding.secondaryColor || '#6366F1',
          accentColor: data.branding.accentColor || '#10B981',
          companyName: data.branding.companyName || '',
          tagline: data.branding.tagline || '',
          supportEmail: data.branding.supportEmail || '',
          hideFooterBranding: data.branding.hideFooterBranding || false,
          customCss: data.branding.customCss || '',
          customJs: data.branding.customJs || '',
          emailFromName: data.branding.emailFromName || '',
          emailHeaderHtml: data.branding.emailHeaderHtml || '',
          emailFooterHtml: data.branding.emailFooterHtml || '',
        })
      } else {
        setBranding(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      customDomain: '',
      logoUrl: '',
      logoLightUrl: '',
      faviconUrl: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#6366F1',
      accentColor: '#10B981',
      companyName: '',
      tagline: '',
      supportEmail: '',
      hideFooterBranding: false,
      customCss: '',
      customJs: '',
      emailFromName: '',
      emailHeaderHtml: '',
      emailFooterHtml: '',
    })
  }

  async function saveBranding() {
    if (!selectedOrg) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/enterprise/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Branding saved successfully' })
        fetchBranding()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save branding' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' })
    } finally {
      setSaving(false)
    }
  }

  async function verifyDomain() {
    try {
      const response = await fetch('/api/enterprise/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          action: 'verify_domain',
        }),
      })

      const data = await response.json()

      if (data.verified) {
        setMessage({ type: 'success', text: 'Domain verified successfully!' })
        fetchBranding()
      } else {
        setMessage({ type: 'error', text: data.message || 'Domain verification failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to verify domain' })
    }
  }

  const selectedOrgData = organizations.find(o => o.id === selectedOrg)
  const isEnterprise = selectedOrgData?.planTier === 'enterprise'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="w-6 h-6" />
          Custom Branding
        </h1>
        <p className="text-gray-600 mt-1">
          Customize the look and feel of your organization&apos;s portal
        </p>
      </div>

      {/* Organization Selector */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Organization
        </label>
        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Choose an organization...</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.planTier})
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {selectedOrg && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'general' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'colors' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Colors
            </button>
            <button
              onClick={() => setActiveTab('domain')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'domain' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Custom Domain
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'email' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm">
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Logo & Identity
                  </h2>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Your Company Name"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                      <input
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="Your tagline"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Light Background)</label>
                    <input
                      type="url"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (Dark Background)</label>
                    <input
                      type="url"
                      value={formData.logoLightUrl}
                      onChange={(e) => setFormData({ ...formData, logoLightUrl: e.target.value })}
                      placeholder="https://example.com/logo-light.png"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Favicon URL</label>
                    <input
                      type="url"
                      value={formData.faviconUrl}
                      onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                      placeholder="https://example.com/favicon.ico"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                    <input
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                      placeholder="support@yourcompany.com"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>

                  {isEnterprise && (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Hide Footer Branding</p>
                        <p className="text-sm text-gray-500">Remove &quot;Powered by Frith AI&quot; from footer</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.hideFooterBranding}
                          onChange={(e) => setFormData({ ...formData, hideFooterBranding: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Brand Colors
                  </h2>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="flex-1 border rounded-lg px-3 py-2 font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                          className="flex-1 border rounded-lg px-3 py-2 font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          className="flex-1 border rounded-lg px-3 py-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="border rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
                    <div className="flex gap-4 items-center">
                      <button 
                        style={{ backgroundColor: formData.primaryColor }}
                        className="px-4 py-2 text-white rounded-lg"
                      >
                        Primary Button
                      </button>
                      <button 
                        style={{ backgroundColor: formData.secondaryColor }}
                        className="px-4 py-2 text-white rounded-lg"
                      >
                        Secondary Button
                      </button>
                      <span 
                        style={{ color: formData.accentColor }}
                        className="font-medium"
                      >
                        Accent Text
                      </span>
                    </div>
                  </div>

                  {isEnterprise && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom CSS</label>
                        <textarea
                          value={formData.customCss}
                          onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                          placeholder=".custom-class { ... }"
                          rows={4}
                          className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom JavaScript</label>
                        <textarea
                          value={formData.customJs}
                          onChange={(e) => setFormData({ ...formData, customJs: e.target.value })}
                          placeholder="// Custom JS code"
                          rows={4}
                          className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">⚠️ Use with caution. Malformed JS can break the UI.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Domain Tab */}
              {activeTab === 'domain' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Custom Domain
                  </h2>

                  {!isEnterprise ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-medium">Enterprise Plan Required</p>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        Custom domains are only available on the Enterprise plan.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
                        <input
                          type="text"
                          value={formData.customDomain}
                          onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                          placeholder="ai.yourcompany.com"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      {branding?.customDomain && (
                        <div className={`p-4 rounded-lg ${branding.domainVerified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {branding.domainVerified ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                              )}
                              <span className={branding.domainVerified ? 'text-green-800' : 'text-yellow-800'}>
                                {branding.domainVerified ? 'Domain verified' : 'Domain pending verification'}
                              </span>
                            </div>
                            {!branding.domainVerified && (
                              <button
                                onClick={verifyDomain}
                                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                              >
                                Verify Now
                              </button>
                            )}
                          </div>

                          {!branding.domainVerified && branding.domainVerifyToken && (
                            <div className="mt-4 p-3 bg-white rounded border">
                              <p className="text-sm font-medium text-gray-700 mb-2">Add this TXT record to your DNS:</p>
                              <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                                frith-verify={branding.domainVerifyToken}
                              </code>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Email Tab */}
              {activeTab === 'email' && (
                <div className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Email Branding
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                    <input
                      type="text"
                      value={formData.emailFromName}
                      onChange={(e) => setFormData({ ...formData, emailFromName: e.target.value })}
                      placeholder="Your Company"
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">The name that appears in the &quot;From&quot; field of emails</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Header HTML</label>
                    <textarea
                      value={formData.emailHeaderHtml}
                      onChange={(e) => setFormData({ ...formData, emailHeaderHtml: e.target.value })}
                      placeholder="<div>Your header content</div>"
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Footer HTML</label>
                    <textarea
                      value={formData.emailFooterHtml}
                      onChange={(e) => setFormData({ ...formData, emailFooterHtml: e.target.value })}
                      placeholder="<div>Your footer content</div>"
                      rows={4}
                      className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="p-6 border-t flex justify-end">
                <button
                  onClick={saveBranding}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Branding'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
