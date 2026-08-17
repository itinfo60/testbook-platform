import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiBookmark,
  HiCheckCircle,
  HiClock,
  HiTrendingUp,
  HiXCircle,
} from 'react-icons/hi';

export default function MockTestShowcase() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-4 tracking-tight">
            Practice Like It's Exam Day.
          </h2>
          <p className="text-lg text-navy-600">
            Stop taking random tests. Start training against the actual exam environment and measure
            yourself against state-level competition.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Mock UI */}
          <div className="bg-navy-50 rounded-2xl p-4 sm:p-6 border border-navy-100 shadow-xl shadow-navy-900/5 relative">
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-accent-100 rounded-full blur-2xl opacity-60" />

            <div className="bg-white rounded-xl shadow-sm border border-navy-100 overflow-hidden relative z-10 flex flex-col h-[400px]">
              {/* Header */}
              <div className="bg-navy-900 text-white p-3 flex justify-between items-center text-sm">
                <span className="font-semibold">RAS Prelims Mock 4</span>
                <div className="flex items-center gap-2 bg-navy-800 px-3 py-1 rounded">
                  <HiClock className="text-accent-500" />
                  <span className="font-mono">01:45:22</span>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Main Question Area */}
                <div className="flex-1 p-5 border-r border-navy-100 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-navy-900">Question 42</span>
                    <span className="text-xs text-navy-500 font-medium">Marks: +1.33, -0.44</span>
                  </div>

                  <div className="text-navy-800 text-sm mb-6 leading-relaxed flex-1">
                    Which of the following constitutional amendments is responsible for the addition
                    of the Ninth Schedule to the Constitution of India?
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      'First Amendment',
                      'Fourth Amendment',
                      'Seventh Amendment',
                      'Ninth Amendment',
                    ].map((opt, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded border text-sm flex items-center gap-3 ${i === 0 ? 'border-accent-500 bg-accent-50' : 'border-navy-200 hover:border-navy-300'}`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full border ${i === 0 ? 'border-accent-500 bg-accent-500 flex items-center justify-center' : 'border-navy-300'}`}
                        >
                          {i === 0 && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                        </div>
                        <span className={i === 0 ? 'text-accent-900 font-medium' : 'text-navy-700'}>
                          {opt}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-between mt-auto">
                    <button className="px-3 py-1.5 text-xs font-semibold text-navy-600 bg-navy-50 border border-navy-200 rounded flex items-center gap-1 hover:bg-navy-100">
                      <HiBookmark /> Mark for Review
                    </button>
                    <button className="px-4 py-1.5 text-xs font-semibold text-white bg-accent-600 rounded shadow-sm hover:bg-accent-700">
                      Save & Next
                    </button>
                  </div>
                </div>

                {/* Palette */}
                <div className="w-32 bg-navy-50/50 p-3 hidden sm:block overflow-y-auto">
                  <span className="text-[10px] font-bold text-navy-900 uppercase tracking-wider block mb-3">
                    Palette
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[...Array(15)].map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center text-xs font-medium rounded-sm border ${
                          i === 41
                            ? 'border-accent-500 bg-white text-accent-700'
                            : i % 3 === 0
                              ? 'border-green-300 bg-green-100 text-green-700'
                              : i % 7 === 0
                                ? 'border-red-300 bg-red-100 text-red-700'
                                : i % 5 === 0
                                  ? 'border-purple-300 bg-purple-100 text-purple-700'
                                  : 'border-navy-200 bg-white text-navy-400'
                        }`}
                      >
                        {i + 31}
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 px-2 py-2 text-xs font-bold text-white bg-red-600 rounded shadow-sm hover:bg-red-700 text-center">
                    Submit Test
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Analytics */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-green-100 border border-green-200 text-green-800 text-xs font-bold uppercase tracking-wider mb-6">
              Instant Analytics Generation
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-6">Your Performance, Decoded.</h3>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl border border-navy-100 bg-white shadow-sm flex items-start gap-4">
                <div className="mt-1">
                  <HiCheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-navy-500 font-medium">Accuracy</p>
                  <p className="text-xl font-bold text-navy-900">84%</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-navy-100 bg-white shadow-sm flex items-start gap-4">
                <div className="mt-1">
                  <HiClock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-navy-500 font-medium">Speed</p>
                  <p className="text-xl font-bold text-navy-900">72%</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-navy-100 bg-navy-900 shadow-sm flex items-start gap-4">
                <div className="mt-1">
                  <HiTrendingUp className="h-6 w-6 text-accent-500" />
                </div>
                <div>
                  <p className="text-xs text-navy-300 font-medium">Percentile</p>
                  <p className="text-xl font-bold text-white">96.4%</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-navy-100 bg-white shadow-sm flex items-start gap-4">
                <div className="mt-1">
                  <HiBookmark className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-navy-500 font-medium">State Rank</p>
                  <p className="text-xl font-bold text-navy-900">#384</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50">
                <span className="text-sm font-medium text-red-800 flex items-center gap-2">
                  <HiXCircle className="h-4 w-4" /> Weakest Topic
                </span>
                <span className="text-sm font-bold text-red-900">Indian Polity</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-green-100 bg-green-50">
                <span className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <HiCheckCircle className="h-4 w-4" /> Strongest Topic
                </span>
                <span className="text-sm font-bold text-green-900">Rajasthan Geography</span>
              </div>
            </div>

            <Link
              to="/tests"
              className="inline-flex items-center gap-2 bg-navy-900 text-white font-semibold px-6 py-3 rounded hover:bg-navy-800 transition-all"
            >
              Explore All Test Series <HiArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
