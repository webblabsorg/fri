'use client'

import { useState, useEffect } from 'react'
import { Shield, Key, Users, CheckCircle, AlertCircle, Settings, Globe } from 'lucide-react'

interface SSOConfig {
  id: string
  provider: string
  enabled: boolean
  samlEntityId: string | null
  samlSsoUrl: string | null
  samlSignRequest: boolean
  oauthClientId: string | null
  oauthAuthUrl: string | null
  oauthTokenUrl: string | null
  oauthUserInfoUrl: string | null
  oauthScopes: string | null
  tenantId: string | null
  domain: string | null
  autoProvision: boolean
  defaultRole: string
  enforceSSO: boolean
  createdAt: string
  updatedAt: string
}

interface Organization {
  id: string
  name: string
  planTier: string
}

export default function SSOConfigPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [ssoConfig, setSsoConfig] = useState<SSOConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    provider: 'saml',
    enabled: false,
    // SAML
    samlEntityId: '',
    samlSsoUrl: '',
    samlCertificate: '',
    samlSignRequest: false,
    // OAuth
    oauthClientId: '',
    oauthClientSecret: '',
    oauthAuthUrl: '',
    oauthTokenUrl: '',
    oauthUserInfoUrl: '',
    oauthScopes: '',
    // Azure AD / Okta
    tenantId: '',
    domain: '',
    // Settings
    autoProvision: true,
    defaultRole: 'member',
    enforceSSO: false,
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      fetchSSOConfig()
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

  async function fetchSSOConfig() {
    setLoading(true)
    try {
      const response = await fetch(`/api/enterprise/sso?organizationId=${selectedOrg}`)
      const data = await response.json()
      
      if (data.ssoConfig) {
        setSsoConfig(data.ssoConfig)
        setFormData({
          provider: data.ssoConfig.provider || 'saml',
          enabled: data.ssoConfig.enabled || false,
          samlEntityId: data.ssoConfig.samlEntityId || '',
          samlSsoUrl: data.ssoConfig.samlSsoUrl || '',
          samlCertificate: '',
          samlSignRequest: data.ssoConfig.samlSignRequest || false,
          oauthClientId: data.ssoConfig.oauthClientId || '',
          oauthClientSecret: '',
          oauthAuthUrl: data.ssoConfig.oauthAuthUrl || '',
          oauthTokenUrl: data.ssoConfig.oauthTokenUrl || '',
          oauthUserInfoUrl: data.ssoConfig.oauthUserInfoUrl || '',
          oauthScopes: data.ssoConfig.oauthScopes || '',
          tenantId: data.ssoConfig.tenantId || '',
          domain: data.ssoConfig.domain || '',
          autoProvision: data.ssoConfig.autoProvision ?? true,
          defaultRole: data.ssoConfig.defaultRole || 'member',
          enforceSSO: data.ssoConfig.enforceSSO || false,
        })
      } else {
        setSsoConfig(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error fetching SSO config:', error)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      provider: 'saml',
      enabled: false,
      samlEntityId: '',
      samlSsoUrl: '',
      samlCertificate: '',
      samlSignRequest: false,
      oauthClientId: '',
      oauthClientSecret: '',
      oauthAuthUrl: '',
      oauthTokenUrl: '',
      oauthUserInfoUrl: '',
      oauthScopes: '',
      tenantId: '',
      domain: '',
      autoProvision: true,
      defaultRole: 'member',
      enforceSSO: false,
    })
  }

  async function saveConfig() {
    if (!selectedOrg) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/enterprise/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'SSO configuration saved successfully' })
        fetchSSOConfig()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save configuration' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteConfig() {
    if (!selectedOrg || !confirm('Are you sure you want to delete this SSO configuration?')) return

    try {
      const response = await fetch(`/api/enterprise/sso?organizationId=${selectedOrg}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'SSO configuration deleted' })
        setSsoConfig(null)
        resetForm()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete configuration' })
    }
  }

  const selectedOrgData = organizations.find(o => o.id === selectedOrg)
  const isEnterprise = selectedOrgData?.planTier === 'enterprise'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          SSO Configuration
        </h1>
        <p className="text-gray-600 mt-1">
          Configure Single Sign-On for enterprise organizations
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

      {selectedOrg && !isEnterprise && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Enterprise Plan Required</p>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            SSO is only available for organizations on the Enterprise plan.
          </p>
        </div>
      )}

      {selectedOrg && isEnterprise && (
        <>
          {/* Status Banner */}
          {ssoConfig && (
            <div className={`rounded-lg p-4 mb-6 ${ssoConfig.enabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ssoConfig.enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className={ssoConfig.enabled ? 'text-green-800 font-medium' : 'text-gray-600'}>
                    SSO is {ssoConfig.enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  Provider: {ssoConfig.provider.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`rounded-lg p-4 mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading configuration...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm">
              {/* Provider Selection */}
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold mb-4">Identity Provider</h2>
                <div className="grid grid-cols-4 gap-4">
                  {['saml', 'oauth', 'azure_ad', 'okta'].map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setFormData({ ...formData, provider })}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        formData.provider === provider
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Globe className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <span className="text-sm font-medium">
                        {provider === 'azure_ad' ? 'Azure AD' : provider.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Provider-specific Configuration */}
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold mb-4">Provider Configuration</h2>
                
                {formData.provider === 'saml' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID</label>
                      <input
                        type="text"
                        value={formData.samlEntityId}
                        onChange={(e) => setFormData({ ...formData, samlEntityId: e.target.value })}
                        placeholder="https://your-idp.com/entity"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SSO URL</label>
                      <input
                        type="url"
                        value={formData.samlSsoUrl}
                        onChange={(e) => setFormData({ ...formData, samlSsoUrl: e.target.value })}
                        placeholder="https://your-idp.com/sso"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">X.509 Certificate</label>
                      <textarea
                        value={formData.samlCertificate}
                        onChange={(e) => setFormData({ ...formData, samlCertificate: e.target.value })}
                        placeholder="-----BEGIN CERTIFICATE-----"
                        rows={4}
                        className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="samlSignRequest"
                        checked={formData.samlSignRequest}
                        onChange={(e) => setFormData({ ...formData, samlSignRequest: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="samlSignRequest" className="text-sm text-gray-700">
                        Sign SAML requests
                      </label>
                    </div>
                  </div>
                )}

                {formData.provider === 'oauth' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                        <input
                          type="text"
                          value={formData.oauthClientId}
                          onChange={(e) => setFormData({ ...formData, oauthClientId: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                        <input
                          type="password"
                          value={formData.oauthClientSecret}
                          onChange={(e) => setFormData({ ...formData, oauthClientSecret: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Authorization URL</label>
                      <input
                        type="url"
                        value={formData.oauthAuthUrl}
                        onChange={(e) => setFormData({ ...formData, oauthAuthUrl: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Token URL</label>
                      <input
                        type="url"
                        value={formData.oauthTokenUrl}
                        onChange={(e) => setFormData({ ...formData, oauthTokenUrl: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">User Info URL</label>
                      <input
                        type="url"
                        value={formData.oauthUserInfoUrl}
                        onChange={(e) => setFormData({ ...formData, oauthUserInfoUrl: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scopes</label>
                      <input
                        type="text"
                        value={formData.oauthScopes}
                        onChange={(e) => setFormData({ ...formData, oauthScopes: e.target.value })}
                        placeholder="openid profile email"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                {(formData.provider === 'azure_ad' || formData.provider === 'okta') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.provider === 'azure_ad' ? 'Tenant ID' : 'Okta Domain'}
                      </label>
                      <input
                        type="text"
                        value={formData.provider === 'azure_ad' ? formData.tenantId : formData.domain}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          [formData.provider === 'azure_ad' ? 'tenantId' : 'domain']: e.target.value 
                        })}
                        placeholder={formData.provider === 'azure_ad' ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' : 'your-org.okta.com'}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                        <input
                          type="text"
                          value={formData.oauthClientId}
                          onChange={(e) => setFormData({ ...formData, oauthClientId: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                        <input
                          type="password"
                          value={formData.oauthClientSecret}
                          onChange={(e) => setFormData({ ...formData, oauthClientSecret: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable SSO</p>
                      <p className="text-sm text-gray-500">Allow users to sign in with SSO</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabled}
                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enforce SSO</p>
                      <p className="text-sm text-gray-500">Require all users to sign in via SSO (disable password login)</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enforceSSO}
                        onChange={(e) => setFormData({ ...formData, enforceSSO: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-provision Users</p>
                      <p className="text-sm text-gray-500">Automatically create user accounts on first SSO login</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoProvision}
                        onChange={(e) => setFormData({ ...formData, autoProvision: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Role for New Users</label>
                    <select
                      value={formData.defaultRole}
                      onChange={(e) => setFormData({ ...formData, defaultRole: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 flex justify-between">
                {ssoConfig && (
                  <button
                    onClick={deleteConfig}
                    className="px-4 py-2 text-red-600 hover:text-red-700"
                  >
                    Delete Configuration
                  </button>
                )}
                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Reset
                  </button>
                  <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
