import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiBookmark,
  HiChartBar,
  HiClock,
  HiShieldCheck,
  HiTrendingUp,
} from 'react-icons/hi';

export default function TestingExperience() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-50 border border-accent-200 text-accent-700 text-xs font-extrabold uppercase tracking-wider mb-4">
            <HiShieldCheck className="h-4 w-4 text-accent-500" /> Real Exam Simulation & Analytics
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-extrabold text-navy-950 tracking-tight mb-4">
            Don't Guess If You're Ready. Measure It.
          </h2>
          <p className="text-lg md:text-xl text-navy-600 leading-relaxed">
            Practice in the exact RPSC/RAS exam environment. Measure yourself against 25,000+ state
            aspirants with precision accuracy and state-rank analytics.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Realistic Test Engine Mockup (7 cols) */}
          <div className="lg:col-span-7 bg-[#faf9f6] rounded-3xl p-4 sm:p-6 border border-navy-100 shadow-2xl shadow-navy-900/5 relative">
            <div className="absolute -top-6 -left-6 w-28 h-28 bg-accent-200/50 rounded-full blur-2xl opacity-60 pointer-events-none" />

            <div className="bg-white rounded-2xl shadow-sm border border-navy-200/80 overflow-hidden relative z-10 flex flex-col">
              {/* Test Engine Header Bar */}
              <div className="bg-navy-950 text-white px-4 py-3 flex justify-between items-center text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="font-bold">RAS Prelims Full Mock 04</span>
                </div>
                <div className="flex items-center gap-2 bg-navy-900 border border-navy-800 px-3 py-1 rounded-lg text-accent-400 font-mono font-bold">
                  <HiClock className="h-4 w-4" />
                  <span>01:42:18</span>
                </div>
              </div>

              {/* Engine Main Workspace */}
              <div className="flex flex-col sm:flex-row min-h-[380px]">
                {/* Question & Options Area */}
                <div className="flex-1 p-5 sm:p-6 border-b sm:border-b-0 sm:border-r border-navy-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-navy-50">
                      <span className="text-xs font-extrabold text-navy-900 uppercase tracking-wide">
                        Question 38 of 150
                      </span>
                      <span className="text-[11px] font-semibold text-accent-700 bg-accent-50 px-2 py-0.5 rounded border border-accent-200">
                        +2.00 / -0.66 Mark
                      </span>
                    </div>

                    <div className="text-navy-900 text-sm sm:text-base font-semibold mb-5 leading-relaxed">
                      Which of the following constitutional articles grants special powers to the
                      Governor of Rajasthan in Scheduled Areas under the Fifth Schedule?
                    </div>

                    <div className="space-y-2.5 mb-6">
                      {[
                        {
                          opt: 'A',
                          text: 'Article 244(1) read with Fifth Schedule',
                          selected: true,
                        },
                        { opt: 'B', text: 'Article 371A (Special Provisions)', selected: false },
                        { opt: 'C', text: 'Article 164(1) Tribal Welfare', selected: false },
                        { opt: 'D', text: 'Article 275(1) Grants-in-Aid', selected: false },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center gap-3 transition-colors ${
                            item.selected
                              ? 'border-accent-500 bg-accent-50/80 font-bold text-navy-950 shadow-sm'
                              : 'border-navy-100 bg-white hover:border-navy-300 text-navy-700'
                          }`}
                        >
                          <div
                            className={`h-5 w-5 rounded-full text-[11px] font-extrabold flex items-center justify-center border ${
                              item.selected
                                ? 'border-accent-600 bg-accent-500 text-white'
                                : 'border-navy-200 text-navy-500 bg-navy-50'
                            }`}
                          >
                            {item.opt}
                          </div>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Bottom Action Controls */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-navy-50">
                    <button className="px-3 py-1.5 text-xs font-bold text-navy-600 bg-navy-50 border border-navy-200 rounded-lg flex items-center gap-1 hover:bg-navy-100 transition-colors">
                      <HiBookmark className="h-3.5 w-3.5 text-navy-400" /> Mark for Review
                    </button>
                    <button className="px-5 py-2 text-xs font-bold text-white bg-navy-950 hover:bg-navy-900 rounded-lg shadow-sm transition-transform active:scale-95">
                      Save & Next →
                    </button>
                  </div>
                </div>

                {/* Question Palette Sidebar */}
                <div className="w-full sm:w-36 bg-[#faf9f6] p-4 flex flex-col justify-between border-t sm:border-t-0 border-navy-100">
                  <div>
                    <span className="text-[10px] font-black text-navy-400 uppercase tracking-widest block mb-2">
                      Question Grid
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-3 gap-1.5 mb-4">
                      {[...Array(12)].map((_, i) => {
                        const qNum = i + 35;
                        const isCurrent = qNum === 38;
                        const isAnswered = [35, 36, 37].includes(qNum);
                        const isReview = qNum === 40;
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold border transition-all ${
                              isCurrent
                                ? 'border-accent-500 bg-white text-accent-700 ring-2 ring-accent-400'
                                : isAnswered
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                  : isReview
                                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                                    : 'border-navy-200 bg-white text-navy-400'
                            }`}
                          >
                            {qNum}
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-1 text-[10px] font-semibold text-navy-500">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Answered (32)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-purple-500"></span> Marked (4)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-navy-300"></span> Not Visited (114)
                      </div>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 px-3 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors text-center">
                    Submit Mock
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Measurement & State Analytics (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#faf9f6] rounded-3xl p-6 sm:p-8 border border-navy-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-navy-100">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-600">
                    <HiTrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-navy-950 text-base">
                      Instant Performance Scorecard
                    </h3>
                    <p className="text-xs text-navy-500">Benchmark vs 18,400+ Test Takers</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                  Top 2.5%
                </span>
              </div>

              {/* 4 Core Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white p-4 rounded-2xl border border-navy-100 shadow-sm">
                  <span className="text-[11px] font-bold text-navy-400 uppercase tracking-wider block mb-1">
                    State Rank
                  </span>
                  <div className="text-2xl font-black text-navy-950 flex items-baseline gap-1 font-display">
                    #42 <span className="text-xs font-semibold text-navy-400">/ 18.4k</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-navy-100 shadow-sm">
                  <span className="text-[11px] font-bold text-navy-400 uppercase tracking-wider block mb-1">
                    Accuracy
                  </span>
                  <div className="text-2xl font-black text-emerald-600 flex items-baseline gap-1 font-display">
                    84.6% <span className="text-xs font-semibold text-emerald-500">↑ 6%</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-navy-100 shadow-sm">
                  <span className="text-[11px] font-bold text-navy-400 uppercase tracking-wider block mb-1">
                    Percentile
                  </span>
                  <div className="text-2xl font-black text-accent-600 font-display">97.8%</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-navy-100 shadow-sm">
                  <span className="text-[11px] font-bold text-navy-400 uppercase tracking-wider block mb-1">
                    Speed / Q
                  </span>
                  <div className="text-2xl font-black text-blue-600 font-display">
                    54s <span className="text-xs font-semibold text-navy-400">avg</span>
                  </div>
                </div>
              </div>

              {/* Weak Topic Diagnostic */}
              <div className="bg-white p-4 rounded-2xl border border-navy-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-navy-900 flex items-center gap-1.5">
                    <HiChartBar className="h-4 w-4 text-accent-500" /> Topic Weakness Detection
                  </span>
                  <span className="text-red-500 font-extrabold text-[11px]">Action Required</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-navy-600 mb-1">
                      <span>Rajasthan Geography (Soil & Rivers)</span>
                      <span className="text-emerald-600 font-bold">92% (Strong)</span>
                    </div>
                    <div className="h-1.5 w-full bg-navy-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: '92%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-navy-600 mb-1">
                      <span>Indian Polity (Constitutional Amendments)</span>
                      <span className="text-red-500 font-bold">48% (Weak)</span>
                    </div>
                    <div className="h-1.5 w-full bg-navy-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '48%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/tests"
                className="flex-1 px-8 py-4 bg-navy-950 hover:bg-navy-900 text-white rounded-full font-bold text-sm sm:text-base transition-transform hover:scale-[1.02] shadow-xl shadow-navy-900/10 flex items-center justify-center gap-2 text-center"
              >
                Attempt a Free Mock Test <HiArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
