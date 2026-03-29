import { Link } from "react-router-dom";

export default function FirPage() {
  return (
    <div className="flex h-full items-center justify-center bg-[#0a0a0b] px-6 text-slate-300">
      <div className="max-w-2xl rounded-3xl border border-white/10 bg-[#121215] p-8">
        <h1 className="mb-3 text-3xl font-bold text-white">FIR Action Center</h1>
        <p className="mb-6 text-sm leading-7 text-slate-400">
          Yeh placeholder action page hai jahan aap FIR drafting ya complaint workflow connect kar sakte hain.
        </p>
        <div className="space-y-3 text-sm text-slate-300">
          <p>1. Incident date, time, place, aur device details collect karein.</p>
          <p>2. IMEI, bill, screenshots, witnesses, aur proof ready rakhein.</p>
          <p>3. Nearest police station ya online FIR workflow integrate karein.</p>
        </div>
        <div className="mt-6 flex gap-3">
          <Link to="/chat" className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">
            Back to Chat
          </Link>
          <Link to="/analyze" className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200">
            Analyze Document
          </Link>
        </div>
      </div>
    </div>
  );
}
