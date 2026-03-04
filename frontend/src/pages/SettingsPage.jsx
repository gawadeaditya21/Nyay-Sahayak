export default function SettingsPage() {
  return (
    <main className="flex-1 p-8 bg-brand-base text-brand-primary overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-8">Settings</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-brand-surface p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Preferences</h2>
          <div className="flex items-center justify-between py-3 border-b border-brand-surface/50">
            <span>Language</span>
            <select className="bg-brand-base border border-brand-surface rounded p-1 outline-none focus:ring-2 focus:ring-brand-accent">
              <option>English</option>
              <option>Hindi</option>
              <option>Marathi</option>
            </select>
          </div>
        </div>
      </div>
    </main>
  );
}