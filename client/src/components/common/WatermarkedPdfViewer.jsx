import { useState } from 'react';
import { useSelector } from 'react-redux';
import { HiDocumentText, HiLockClosed, HiDownload, HiShieldCheck } from 'react-icons/hi';

export default function WatermarkedPdfViewer({ title, fileUrl, accessLevel = 'paid' }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [downloading, setDownloading] = useState(false);

  const watermarkText = user
    ? `Licensed to: ${user.name} (${user.email || user.phone || 'Student'}) • EduPortal Copy Protected`
    : 'Licensed to Registered EduPortal Student • Copy Protected';

  return (
    <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-dark-800">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-dark-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-1">
            <HiShieldCheck className="h-4 w-4" /> Watermarked Digital Material
          </div>
          <h3 className="text-xl font-extrabold text-dark-900 dark:text-white">
            {title || 'Handwritten Study Notes'}
          </h3>
        </div>

        <button
          onClick={() => {
            setDownloading(true);
            setTimeout(() => {
              window.open(fileUrl || '#', '_blank');
              setDownloading(false);
            }, 500);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2"
        >
          <HiDownload className="h-4 w-4" />
          <span>{downloading ? 'Preparing PDF...' : 'Download Watermarked PDF'}</span>
        </button>
      </div>

      {/* PDF Viewer Simulation Box with Diagonal Repeat Watermark */}
      <div className="relative h-96 w-full rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 flex flex-col justify-between p-6 text-slate-100 select-none">
        {/* Diagonal Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-around items-center opacity-25 rotate-[-25deg] scale-125 font-bold text-xs sm:text-sm text-amber-400 tracking-wider">
          <p>{watermarkText}</p>
          <p>{watermarkText}</p>
          <p>{watermarkText}</p>
          <p>{watermarkText}</p>
        </div>

        {/* Content Mock Preview */}
        <div className="relative z-0 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold border-b border-slate-800 pb-3">
            <HiDocumentText className="h-5 w-5" />
            <span>EduPortal Premium Handwritten Notes — Chapter Summary</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-serif leading-relaxed">
            <p className="font-bold text-amber-300">
              Section 1.1: Core Principles & Constitutional Setup
            </p>
            <p>
              1. The Constitution of India provides a quasi-federal structure with a strong
              centralizing tendency. Article 1 defines India as a 'Union of States'.
            </p>
            <p>
              2. Fundamental Rights (Articles 12-35) form the cornerstone of individual liberty and
              democratic governance.
            </p>
            <p className="font-bold text-amber-300 mt-4">
              Section 1.2: RPSC Important Notes & Memory Tricks
            </p>
            <p>
              • Key Articles for State Executive: Governor (Art 153), Council of Ministers (Art
              163), Advocate General (Art 165).
            </p>
          </div>
        </div>

        <div className="relative z-0 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Protected PDF • Page 1 of 12</span>
          <span className="text-amber-400 font-semibold">{watermarkText}</span>
        </div>
      </div>
    </div>
  );
}
