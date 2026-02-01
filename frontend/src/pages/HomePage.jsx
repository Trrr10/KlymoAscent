import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-linear-to-b from-indigo-50 to-white">

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">
          Anonymous. Safe. Real Conversations.
        </h1>

        <p className="mt-4 max-w-xl text-slate-600 text-sm md:text-base">
          Chat freely without revealing your identity.  
          No profiles, no screenshots, no personal data stored.
        </p>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <TrustCard title="100% Anonymous" desc="No name, no phone, no email" />
          <TrustCard title="No Data Stored" desc="Chats are not saved on servers" />
          <TrustCard title="Safe by Design" desc="Community rules & moderation" />
        </div>

        {/* CTA Button */}
        <button
          onClick={() => navigate("/Onboarding")}
          className="mt-10 px-10 py-4 bg-indigo-600 text-white rounded-full font-bold tracking-wide hover:bg-indigo-700 active:scale-95 transition"
        >
          Start Chat 🚀
        </button>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t">
        <p>🔒 We don’t store chats • No tracking • No identity</p>
        <p className="mt-1">Built for privacy-first conversations</p>
      </footer>
    </div>
  );
}

function TrustCard({ title, desc }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border text-center">
      <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </div>
  );
}
