import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  HiArrowRight,
  HiDocumentDownload,
  HiOutlineBookOpen,
  HiOutlineDocumentText,
  HiOutlineLightBulb,
} from 'react-icons/hi';
import { libraryAPI } from '@/services/api';

const ICON_MAP = {
  pyq: HiOutlineDocumentText,
  notes: HiOutlineLightBulb,
  syllabus: HiOutlineDocumentText,
  current_affairs: HiOutlineBookOpen,
};

const CATEGORY_LABEL = {
  pyq: 'PYQs',
  notes: 'Notes',
  syllabus: 'Syllabus',
  current_affairs: 'Current Affairs',
};

const TABS = ['All', 'PYQs', 'Syllabus', 'Current Affairs', 'Notes'];

export default function FreeResourcesLibrary() {
  const [activeTab, setActiveTab] = useState('All');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    libraryAPI
      .getAll({ limit: 12, accessLevel: 'all', isPublished: true })
      .then((res) => {
        const data = res.data?.data?.resources || res.data?.resources || res.data?.data || [];
        setResources(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeTab === 'All'
      ? resources
      : resources.filter((r) => {
          const cat = CATEGORY_LABEL[r.resourceType] || r.resourceType || '';
          return cat === activeTab;
        });

  if (!loading && resources.length === 0) return null;

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 md:flex md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-4 tracking-tight">
              Start Free. Build Your Preparation From Day One.
            </h2>
            <p className="text-lg text-navy-600">
              Official PYQs, syllabus documents, revision notes and current affairs — available
              without paying first.
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <Link
              to="/free-resources"
              className="inline-flex items-center gap-2 bg-navy-50 text-navy-900 hover:bg-navy-100 border border-navy-200 font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Open Full Free Library <HiArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-10 pb-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                activeTab === tab
                  ? 'bg-accent-50 text-accent-700 border border-accent-200 shadow-sm'
                  : 'bg-white text-navy-600 border border-navy-200 hover:bg-navy-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-44 bg-navy-50 rounded-xl animate-pulse border border-navy-100"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-navy-400">
            <p className="font-medium">No resources available yet.</p>
            <p className="text-sm mt-1">Check back soon for free study materials.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((resource) => {
              const Icon = ICON_MAP[resource.resourceType] || HiOutlineDocumentText;
              const catLabel =
                CATEGORY_LABEL[resource.resourceType] || resource.resourceType || 'Resource';

              return (
                <div
                  key={resource._id}
                  className="group bg-white rounded-xl p-6 border border-navy-100 shadow-sm hover:shadow-lg hover:border-accent-200 transition-all flex flex-col h-full"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-lg bg-navy-50 text-navy-600 flex items-center justify-center shrink-0 group-hover:bg-accent-50 group-hover:text-accent-600 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy-500 mb-1 block">
                        {catLabel}
                      </span>
                      <h3 className="font-bold text-navy-900 leading-snug">{resource.title}</h3>
                    </div>
                  </div>

                  {resource.description && (
                    <p className="text-sm text-navy-600 mb-6 flex-grow line-clamp-2">
                      {resource.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-navy-50 mt-auto">
                    <span className="text-xs font-medium text-navy-400 bg-navy-50 px-2.5 py-1 rounded">
                      PDF Document
                    </span>
                    <Link
                      to="/free-resources"
                      className="text-sm font-semibold text-accent-600 hover:text-accent-700 flex items-center gap-1 group-hover:bg-accent-50 px-3 py-1.5 rounded transition-colors"
                    >
                      <HiDocumentDownload className="h-4 w-4" /> View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
