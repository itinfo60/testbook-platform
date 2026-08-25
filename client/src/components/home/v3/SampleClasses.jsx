import { useState, useRef, useEffect } from 'react';
import VideoPlayer from '@/features/course/components/learning/VideoPlayer';
import { courseAPI } from '@/services/api';
import {
  HiArrowRight,
  HiOutlineArrowsExpand,
  HiOutlineClock,
  HiPlay,
  HiVideoCamera,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function SampleClasses() {
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef({});

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const response = await courseAPI.getSamples();
        if (response.data?.data?.samples) {
          // Add a stable id for UI rendering
          const mappedSamples = response.data.data.samples.map((s, index) => ({
            ...s,
            id: s.id || s._id || s.videoUrl || `sample-${index}`,
            topic: s.courseTitle,
            faculty: s.teacher?.name || 'Expert Faculty',
            role: 'Senior Educator',
            thumbnail:
              s.thumbnail?.url ||
              (typeof s.thumbnail === 'string' && s.thumbnail) ||
              'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=60',
            duration: s.duration
              ? `${Math.floor(s.duration / 60)}:${(s.duration % 60).toString().padStart(2, '0')} Min`
              : 'Free Class',
          }));
          setClasses(mappedSamples);
        }
      } catch (err) {
        console.error('Failed to fetch sample classes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSamples();
  }, []);

  const handlePlay = (id) => {
    setActiveVideoId(id);
    setTimeout(() => {
      if (videoRefs.current[id]) {
        videoRefs.current[id].play().catch(() => {});
      }
    }, 100);
  };

  const handleFullScreen = (id, e) => {
    e.stopPropagation();
    const videoEl = videoRefs.current[id];
    if (videoEl) {
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen();
      } else if (videoEl.webkitRequestFullscreen) {
        videoEl.webkitRequestFullscreen();
      } else if (videoEl.msRequestFullscreen) {
        videoEl.msRequestFullscreen();
      }
    }
  };

  return (
    <section className="py-20 md:py-24 bg-navy-950 text-white relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-accent-400 mb-2">
              Free Video Demonstrations
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-white tracking-tight">
              See the Teaching Before You Commit
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-2xl">
              Watch authentic classroom sample lectures right now. Judge the faculty, pedagogy &
              depth for yourself.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-accent-400 hover:text-accent-300 transition-colors border-b-2 border-accent-400/40 hover:border-accent-300 pb-1 whitespace-nowrap self-start md:self-auto"
          >
            Explore All Courses & Lectures <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {classes.length === 0 && !loading ? (
          <div className="text-center py-12 bg-navy-900 rounded-3xl border border-navy-800">
            <h3 className="text-xl font-bold text-slate-300">
              No free classes currently available
            </h3>
            <p className="text-slate-400 mt-2">Check back later for newly added free lectures.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {classes.map((cls) => {
              const isPlaying = activeVideoId === cls.id;

              return (
                <div
                  key={cls.id}
                  className="group rounded-3xl overflow-hidden bg-navy-900 border border-navy-800/80 shadow-xl hover:shadow-2xl hover:border-navy-700 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Video Player / Thumbnail Aspect Container */}
                  <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                    {isPlaying ? (
                      <div className="relative w-full h-full">
                        <VideoPlayer url={cls.videoUrl} autoPlay={true} />
                      </div>
                    ) : (
                      <div
                        onClick={() => handlePlay(cls.id)}
                        className="relative w-full h-full cursor-pointer overflow-hidden"
                      >
                        <img
                          src={cls.thumbnail}
                          alt={cls.title}
                          className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700"
                        />

                        {/* Dark Vignette Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />

                        {/* Top Badges: Exam Tag & Duration */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider text-amber-300 border border-white/10">
                            {cls.topic}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                            <HiOutlineClock className="h-3.5 w-3.5 text-accent-400" />{' '}
                            {cls.duration}
                          </span>
                        </div>

                        {/* Center Pulsing Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-14 w-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-navy-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                            <HiPlay className="h-7 w-7 ml-0.5 text-navy-950" />
                          </div>
                        </div>

                        {/* Click to Play Hint */}
                        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] font-bold text-slate-300">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <HiVideoCamera className="h-3.5 w-3.5" /> HD 1080p Lecture
                          </span>
                          <span className="bg-white/10 px-2 py-0.5 rounded text-white/80">
                            Click to Play
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <Link
                        to={`/courses/${cls.courseSlug || cls.courseId}`}
                        className="text-base sm:text-lg font-bold text-white font-display line-clamp-2 mb-2 hover:text-accent-400 transition-colors block"
                        title={`View full course: ${cls.courseTitle}`}
                      >
                        {cls.title}
                      </Link>
                      <p className="text-xs text-slate-400 mb-4">{cls.courseTitle || cls.role}</p>
                    </div>

                    <div className="pt-4 border-t border-navy-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-accent-500/20 text-accent-400 flex items-center justify-center text-xs font-black border border-accent-400/30">
                          {cls.faculty.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-200">{cls.faculty}</span>
                      </div>

                      {!isPlaying ? (
                        <button
                          onClick={() => handlePlay(cls.id)}
                          className="text-xs font-extrabold text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Watch Demo <HiPlay className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleFullScreen(cls.id, e)}
                          className="text-xs font-extrabold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          Fullscreen <HiOutlineArrowsExpand className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Centered View All Link */}
        <div className="mt-12 text-center">
          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-navy-900 hover:bg-navy-800 text-white border border-navy-700 hover:border-navy-600 rounded-full font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            Explore All Courses & Video Lectures{' '}
            <HiArrowRight className="h-4 w-4 text-accent-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
