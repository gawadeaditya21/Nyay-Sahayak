import { useState } from 'react';
import { Settings, Key, Server, Database, Globe, Save, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // Mock settings state
  const [settings, setSettings] = useState({
    general: {
      siteName: 'Nyay Sahayak',
      supportEmail: 'support@nyaysahayak.com',
      defaultLanguage: 'en',
      maintenanceMode: false
    },
    api: {
      geminiKey: 'AIzaSyB-***************************',
      qdrantUrl: 'http://localhost:6333',
      stripeKey: 'sk_test_*************************'
    },
    limits: {
      freeDocsPerDay: 5,
      proDocsPerDay: 50,
      maxFileSize: 50 // MB
    }
  });

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      // Optional: Show success toast here
    }, 1000);
  };

  const handleGeneralChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettings({
      ...settings,
      general: { ...settings.general, [e.target.name]: value }
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-500">Configure global application parameters and API keys.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {[
              { id: 'general', label: 'General Info', icon: Globe },
              { id: 'api', label: 'API & Integrations', icon: Key },
              { id: 'limits', label: 'Rate Limits & Quotas', icon: Server },
              { id: 'database', label: 'Database Config', icon: Database }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium w-full text-left ${
                    activeTab === tab.id 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 w-full max-w-3xl">
          {activeTab === 'general' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Globe size={22} className="text-gray-400"/> General Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
                  <input 
                    type="text" 
                    name="siteName"
                    value={settings.general.siteName}
                    onChange={handleGeneralChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
                  <input 
                    type="email" 
                    name="supportEmail"
                    value={settings.general.supportEmail}
                    onChange={handleGeneralChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default System Language</label>
                  <select 
                    name="defaultLanguage"
                    value={settings.general.defaultLanguage}
                    onChange={handleGeneralChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-shadow cursor-pointer"
                  >
                    <option value="en">English (Default)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="mr">Marathi (मराठी)</option>
                    <option value="bn">Bengali (বাংলা)</option>
                  </select>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="pt-0.5">
                      <input 
                        type="checkbox"
                        name="maintenanceMode"
                        checked={settings.general.maintenanceMode}
                        onChange={handleGeneralChange}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-shadow"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Maintenance Mode</p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">When enabled, only administrators can access the system. Regular users will see a maintenance screen.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Key size={22} className="text-gray-400"/> API Keys & Integrations
              </h2>
              
              <div className="space-y-8">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 mb-2">
                  <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Secure Storage Active</p>
                    <p className="text-sm text-blue-700 mt-1 leading-relaxed">API keys are securely encrypted at rest. For security reasons, full keys are never sent to the client.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gemini AI API Key</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={settings.api.geminiKey}
                      readOnly
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
                    />
                    <button className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-blue-600 transition-colors">
                      Update
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Used for document analysis and legal AI responses.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Secret Key</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={settings.api.stripeKey}
                      readOnly
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono text-sm"
                    />
                    <button className="px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-blue-600 transition-colors">
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Server size={22} className="text-gray-400"/> Rate Limits & Quotas
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Free Tier Docs/Day</label>
                    <input 
                      type="number" 
                      value={settings.limits.freeDocsPerDay}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pro Tier Docs/Day</label>
                    <input 
                      type="number" 
                      value={settings.limits.proDocsPerDay}
                      readOnly
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max PDF Upload Size (MB)</label>
                  <input 
                    type="number" 
                    value={settings.limits.maxFileSize}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none max-w-[200px]"
                  />
                  <p className="text-sm text-gray-500 mt-2">Larger files may cause timeout errors during Gemini analysis.</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'database' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Database size={22} className="text-gray-400"/> Database Configuration
              </h2>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3 mb-6">
                <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-amber-900">Advanced Settings</p>
                  <p className="text-sm text-amber-800 mt-1 leading-relaxed">Changing database URLs while the system is running may cause data loss or connection drops.</p>
                </div>
              </div>
              
              <div className="space-y-6 opacity-70 pointer-events-none">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qdrant Vector DB URL</label>
                  <input 
                    type="text" 
                    value={settings.api.qdrantUrl}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
                <button className="px-5 py-3 bg-gray-200 text-gray-600 rounded-lg text-sm font-bold w-full mt-6 shadow-inner">
                  Requires Server Restart to Modify
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
