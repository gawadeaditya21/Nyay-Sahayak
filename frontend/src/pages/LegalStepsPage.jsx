import { Link } from "react-router-dom";

export default function LegalStepsPage() {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--color-bg-main)] px-6 text-[var(--color-text-main)]">
      <div className="max-w-2xl rounded-3xl border border-[var(--color-border-main)] bg-[var(--color-bg-surface)] p-8">
        <h1 className="mb-3 text-3xl font-bold text-[var(--color-text-main)]">Legal Steps</h1>
        <p className="mb-6 text-sm leading-7 text-slate-400">
          Yeh action page quick next steps dikhane ke liye ready hai. Isme future mein workflow cards, checklists, aur case-type guides add kiye ja sakte hain.
        </p>
        <div className="space-y-3 text-sm text-[var(--color-text-main)]">
          <p>1. Facts ko timeline mein likhiye.</p>
          <p>2. Proof aur documents secure rakhiye.</p>
          <p>3. Relevant authority ya lawyer se consult karne se pehle key questions ready kariye.</p>
        </div>
        <div className="mt-6 flex gap-3">
          <Link to="/chat" className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">
            Back to Chat
          </Link>
          <Link to="/fir" className="rounded-full border border-[var(--color-border-main)] px-5 py-2 text-sm font-semibold text-[var(--color-text-main)]">
            Write Complaint
          </Link>
        </div>
      </div>
    </div>
  );
}
