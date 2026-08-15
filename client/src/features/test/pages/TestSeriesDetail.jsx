import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiClipboardList,
  HiQuestionMarkCircle,
  HiChevronDown,
  HiChevronUp,
  HiCheckCircle,
  HiSparkles,
  HiGlobe,
  HiShare,
  HiLightningBolt,
  HiAcademicCap,
  HiLockClosed,
  HiCheck,
  HiUsers,
  HiArrowRight,
  HiShieldCheck,
  HiHeart,
  HiGift,
  HiBookOpen,
  HiPlay,
} from 'react-icons/hi';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import TestItemCard from '../components/TestItemCard';

export default function TestSeriesDetail() {
  const { seriesSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Level 1: Main Tab ('Mock Tests' vs 'PYPs')
  const [activeMainTab, setActiveMainTab] = useState('Mock Tests');

  // Level 2: Section Tab (e.g. 'Chapter Tests (GS)', 'पधारो म्हारे देस (Rajasthan GK)', etc.)
  const [activeSection, setActiveSection] = useState(null);

  // Level 3: Subject / Topic Filter within that section ('All', 'Polity of India', etc.)
  const [activeTopicFilter, setActiveTopicFilter] = useState('All');

  // Level 4: Visible Count for pagination
  const [visibleCount, setVisibleCount] = useState(10);

  const [copiedToast, setCopiedToast] = useState(false);
  const [moreSeriesList, setMoreSeriesList] = useState([]);

  useEffect(() => {
    const fetchSeriesDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const [res, moreRes] = await Promise.all([
          api.get(`/test-series/${seriesSlug}`),
          api.get('/test-series', { params: { limit: 4 } }).catch(() => ({ data: { data: [] } })),
        ]);

        const data = res.data?.data?.testSeries || res.data?.testSeries;
        if (data) {
          setSeries(data);
        } else {
          setError('Test Series package not found');
        }

        const more = moreRes.data?.data?.testSeries || moreRes.data?.testSeries || [];
        setMoreSeriesList(Array.isArray(more) ? more.filter((s) => s.slug !== seriesSlug) : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load test series details');
      } finally {
        setLoading(false);
      }
    };
    fetchSeriesDetail();
  }, [seriesSlug]);

  // Reset pagination & topic filter when main tab or section changes
  useEffect(() => {
    setActiveTopicFilter('All');
    setVisibleCount(10);
  }, [activeMainTab, activeSection]);

  const finalPrice = Number(series?.price) || 0;
  const isEnrolled = Boolean(
    series?.isPurchased || series?.isEnrolled || series?.isFree || finalPrice === 0
  );

  const handlePrimaryAction = () => {
    if (isEnrolled) {
      const el = document.getElementById('tests-main-container');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    navigate(`/checkout/${series._id}?type=test_series`);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  // ════════ DYNAMIC TESTS TAXONOMY & SYNTHESIS ════════
  // We structure all tests into Level 1 (Mock Tests vs PYPs), Level 2 (Sections), Level 3 (Topics), and Level 4 (Tests)
  const categorizedData = useMemo(() => {
    if (!series) return { mockSections: [], pypSections: [], allTests: [] };

    const rawTests = series.tests || [];

    // Built-in Syllabus presets for RPSC RAS & Competitive Test Series
    const rasDefaultMockSections = [
      {
        sectionName: 'Chapter Tests (GS)',
        count: 59,
        topics: [
          'All',
          'Polity of India',
          'Indian History',
          'Geography of India and World',
          'Indian Economy',
          'Environment and Scientific Developments',
        ],
        sampleTitles: [
          {
            title: 'RPSC RAS: Constituent Assembly and Basic Features',
            topic: 'Polity of India',
            isFree: true,
            users: '5.4k',
          },
          {
            title: 'CT 2: Union Territory and Citizenship',
            topic: 'Polity of India',
            isFree: false,
            users: '1.8k',
          },
          {
            title: 'CT 3: Fundamental Rights',
            topic: 'Polity of India',
            isFree: false,
            users: '1.1k',
          },
          {
            title: 'CT 4: DPSP and Fundamental Duties',
            topic: 'Polity of India',
            isFree: false,
            users: '950',
          },
          {
            title: 'CT 5: Basic Structure and Important Amendments',
            topic: 'Polity of India',
            isFree: false,
            users: '820',
          },
          {
            title: 'CT 6: Parliamentary and Federal features',
            topic: 'Polity of India',
            isFree: false,
            users: '760',
          },
          {
            title: 'CT 7: Central Executive System',
            topic: 'Polity of India',
            isFree: false,
            users: '680',
          },
          {
            title: 'CT 8: Parliament and Its Procedures',
            topic: 'Polity of India',
            isFree: false,
            users: '610',
          },
          {
            title: 'CT 9: Judiciary System',
            topic: 'Polity of India',
            isFree: false,
            users: '540',
          },
          {
            title: 'CT 10: Panchayati Raj and Local Government',
            topic: 'Polity of India',
            isFree: false,
            users: '490',
          },
          {
            title: 'CT 11: Ancient Indian Civilizations & Vedic Age',
            topic: 'Indian History',
            isFree: false,
            users: '1.2k',
          },
          {
            title: 'CT 12: Maurya & Gupta Empires',
            topic: 'Indian History',
            isFree: false,
            users: '890',
          },
          {
            title: 'CT 13: Indian Freedom Struggle 1857-1947',
            topic: 'Indian History',
            isFree: false,
            users: '1.5k',
          },
          {
            title: 'CT 14: Physiographic Divisions of India',
            topic: 'Geography of India and World',
            isFree: false,
            users: '720',
          },
          {
            title: 'CT 15: Climate, Monsoons and Drainage System',
            topic: 'Geography of India and World',
            isFree: false,
            users: '650',
          },
          {
            title: 'CT 16: Basic Concepts of Indian National Income & Budget',
            topic: 'Indian Economy',
            isFree: false,
            users: '810',
          },
          {
            title: 'CT 17: Banking, Monetary Policy & RBI Functions',
            topic: 'Indian Economy',
            isFree: false,
            users: '730',
          },
          {
            title: 'CT 18: Biodiversity, Ecology & Wildlife Protection',
            topic: 'Environment and Scientific Developments',
            isFree: false,
            users: '920',
          },
        ],
      },
      {
        sectionName: 'पधारो म्हारे देस (Rajasthan GK)',
        count: 32,
        topics: [
          'All',
          'History, Culture and Heritage of Rajasthan',
          'Geography of Rajasthan',
          'Polity of Rajasthan',
          'Economy of Rajasthan',
        ],
        sampleTitles: [
          {
            title: 'CT 1: Major Landmarks in the History of Rajasthan',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '2.2k',
          },
          {
            title: 'CT 2: Major Dynasties and Their Administrative System',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '1.1k',
          },
          {
            title: 'CT 3: Socio-Cultural Issues in Rajasthan History',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '840',
          },
          {
            title: 'CT 4: Freedom Movement, Political Awakening and Integration',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '1.6k',
          },
          {
            title: 'CT 5: Salient Features of Rajasthani Architecture – Forts',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '1.3k',
          },
          {
            title: 'CT 6: Rajasthani Arts, Paintings and Handicrafts',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '910',
          },
          {
            title: 'CT 7: Important Works of Rajasthani Literature',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '740',
          },
          {
            title: 'CT 8: Fairs, Festivals, Folk Music and Folk Dances',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '1.2k',
          },
          {
            title: 'CT 9: Rajasthani Culture, Traditions and Heritage',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '880',
          },
          {
            title: 'CT 10: Religious Movements, Saints and Lok Devtas',
            topic: 'History, Culture and Heritage of Rajasthan',
            isFree: false,
            users: '1.4k',
          },
          {
            title: 'CT 11: Physiography & Climate of Rajasthan',
            topic: 'Geography of Rajasthan',
            isFree: false,
            users: '1.1k',
          },
          {
            title: 'CT 12: Rivers, Lakes and Irrigation Projects of Rajasthan',
            topic: 'Geography of Rajasthan',
            isFree: false,
            users: '950',
          },
          {
            title: 'CT 13: Governor, Chief Minister & State Assembly',
            topic: 'Polity of Rajasthan',
            isFree: false,
            users: '1.3k',
          },
          {
            title: 'CT 14: State Human Rights Commission & Lokayukta',
            topic: 'Polity of Rajasthan',
            isFree: false,
            users: '870',
          },
          {
            title: 'CT 15: Agriculture, Industry & Infrastructure in Rajasthan',
            topic: 'Economy of Rajasthan',
            isFree: false,
            users: '780',
          },
        ],
      },
      {
        sectionName: 'Chapter Tests (Mental Ability)',
        count: 27,
        topics: ['All', 'Quantitative Aptitude', 'Reasoning Ability'],
        sampleTitles: [
          {
            title: 'CT 1: Ratio Proportion',
            topic: 'Quantitative Aptitude',
            isFree: false,
            users: '1.1k',
          },
          {
            title: 'CT 2: Percentage',
            topic: 'Quantitative Aptitude',
            isFree: false,
            users: '980',
          },
          {
            title: 'CT 3: Permutation & Combination',
            topic: 'Quantitative Aptitude',
            isFree: false,
            users: '720',
          },
          {
            title: 'CT 4: Mensuration',
            topic: 'Quantitative Aptitude',
            isFree: false,
            users: '650',
          },
          {
            title: 'CT 5: Data Interpretation & Tables',
            topic: 'Quantitative Aptitude',
            isFree: false,
            users: '840',
          },
          {
            title: 'CT 6: Mathematical Statistics & Probability',
            topic: 'Quantitative Aptitude',
            isFree: false,
            users: '590',
          },
          {
            title: 'CT 7: Simple & Compound Interest',
            topic: 'Quantitative Aptitude',
            isFree: false,
            users: '770',
          },
          {
            title: 'CT 8: Statement and Argument',
            topic: 'Reasoning Ability',
            isFree: false,
            users: '1.4k',
          },
          {
            title: 'CT 9: Statement and Assumption',
            topic: 'Reasoning Ability',
            isFree: false,
            users: '1.2k',
          },
          {
            title: 'CT 10: Course of Action',
            topic: 'Reasoning Ability',
            isFree: false,
            users: '890',
          },
          {
            title: 'CT 11: Statement and Conclusions',
            topic: 'Reasoning Ability',
            isFree: false,
            users: '960',
          },
          {
            title: 'CT 12: Coding Decoding',
            topic: 'Reasoning Ability',
            isFree: false,
            users: '1.5k',
          },
          {
            title: 'CT 13: Blood Relation',
            topic: 'Reasoning Ability',
            isFree: false,
            users: '1.3k',
          },
          {
            title: 'CT 14: Distance and Direction (LR)',
            topic: 'Reasoning Ability',
            isFree: false,
            users: '1.1k',
          },
          {
            title: 'CT 15: Sitting Arrangement & Puzzles',
            topic: 'Reasoning Ability',
            isFree: false,
            users: '1.7k',
          },
        ],
      },
      {
        sectionName: 'Current Affairs',
        count: 29,
        topics: [
          'All',
          'Rajasthan Current Affairs',
          'National & International',
          'Government Schemes',
        ],
        sampleTitles: [
          {
            title: 'CA 1: Rajasthan Current Affairs Monthly Drill (Part I)',
            topic: 'Rajasthan Current Affairs',
            isFree: false,
            users: '2.1k',
          },
          {
            title: 'CA 2: Rajasthan Major Welfare Schemes & Policies',
            topic: 'Government Schemes',
            isFree: false,
            users: '1.8k',
          },
          {
            title: 'CA 3: National & International Summits, Awards & Sports',
            topic: 'National & International',
            isFree: false,
            users: '1.5k',
          },
          {
            title: 'CA 4: Economic Review & Budget Key Highlights',
            topic: 'Rajasthan Current Affairs',
            isFree: false,
            users: '2.4k',
          },
        ],
      },
      {
        sectionName: 'Subject Tests',
        count: 11,
        topics: ['All', 'Polity', 'History', 'Geography', 'Economy', 'Science & Tech'],
        sampleTitles: [
          {
            title: 'ST 1: Comprehensive Rajasthan GK Sectional Mock',
            topic: 'History',
            isFree: false,
            users: '3.1k',
          },
          {
            title: 'ST 2: Comprehensive Indian Polity & Constitution Drill',
            topic: 'Polity',
            isFree: false,
            users: '2.8k',
          },
          {
            title: 'ST 3: Indian & World Geography Sectional Mock',
            topic: 'Geography',
            isFree: false,
            users: '2.2k',
          },
          {
            title: 'ST 4: Science & Technological Advancements Drill',
            topic: 'Science & Tech',
            isFree: false,
            users: '1.9k',
          },
        ],
      },
      {
        sectionName: 'Full Tests',
        count: 5,
        topics: ['All', 'Full Length Mock'],
        sampleTitles: [
          {
            title: 'FT 1: Rajasthan State and Subordinate Services CCE Prelims 2026',
            topic: 'Full Length Mock',
            isFree: false,
            users: '1.3k',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'FT 2: Rajasthan State and Subordinate Services CCE Prelims 2026',
            topic: 'Full Length Mock',
            isFree: false,
            users: '1.1k',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'FT 3: Rajasthan State and Subordinate Services CCE Prelims 2026',
            topic: 'Full Length Mock',
            isFree: false,
            users: '920',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'FT 4: Rajasthan State and Subordinate Services CCE Prelims 2026',
            topic: 'Full Length Mock',
            isFree: false,
            users: '840',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'FT 5: Rajasthan State and Subordinate Services CCE Prelims 2026',
            topic: 'Full Length Mock',
            isFree: false,
            users: '790',
            qs: 150,
            marks: 200,
            mins: 180,
          },
        ],
      },
    ];

    const rasDefaultPypSections = [
      {
        sectionName: 'Previous Year Papers',
        count: 7,
        topics: ['All', 'Official Papers'],
        sampleTitles: [
          {
            title: 'RPSC RAS 2025 Preliminary Exam Official Paper (Held On: 02 Feb, 2025)',
            topic: 'Official Papers',
            isFree: false,
            users: '1.7k',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'Rajasthan RAS Prelims 2023 Official Paper',
            topic: 'Official Papers',
            isFree: false,
            users: '1.4k',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'Rajasthan PSC RAS Prelims 2021 Official Paper',
            topic: 'Official Papers',
            isFree: false,
            users: '1.2k',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'Rajasthan RAS Prelims 2018 Official Paper',
            topic: 'Official Papers',
            isFree: false,
            users: '980',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'Rajasthan PSC RAS Prelims Official Paper 2016',
            topic: 'Official Papers',
            isFree: false,
            users: '850',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'Rajasthan RAS Prelims 2015 Official Paper (Re-exam of 2013)',
            topic: 'Official Papers',
            isFree: false,
            users: '720',
            qs: 150,
            marks: 200,
            mins: 180,
          },
          {
            title: 'Rajasthan RAS Prelims 2013 Official Papers',
            topic: 'Official Papers',
            isFree: false,
            users: '690',
            qs: 150,
            marks: 200,
            mins: 180,
          },
        ],
      },
      {
        sectionName: 'Previous Year Subject Tests',
        count: 102,
        topics: [
          'All',
          'Current Affairs',
          'General Knowledge',
          'General Science',
          'Logical Reasoning',
          'Quantitative Aptitude',
        ],
        sampleTitles: [
          {
            title: 'PYCT: Government Policies and Schemes',
            topic: 'Current Affairs',
            isFree: false,
            users: '1.8k',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Government Policies and Schemes II',
            topic: 'Current Affairs',
            isFree: false,
            users: '1.2k',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Government Policies and Schemes III',
            topic: 'Current Affairs',
            isFree: false,
            users: '910',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: International Affairs',
            topic: 'Current Affairs',
            isFree: false,
            users: '1.1k',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Science and Technology',
            topic: 'General Science',
            isFree: false,
            users: '1.4k',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Science and Technology II',
            topic: 'General Science',
            isFree: false,
            users: '950',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Sports & Games',
            topic: 'Current Affairs',
            isFree: false,
            users: '820',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: State Affairs & Administration',
            topic: 'General Knowledge',
            isFree: false,
            users: '1.5k',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Coding Decoding (Past Questions)',
            topic: 'Logical Reasoning',
            isFree: false,
            users: '1.3k',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Logical Reasoning MISC I',
            topic: 'Logical Reasoning',
            isFree: false,
            users: '1.1k',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Logical Reasoning MISC II',
            topic: 'Logical Reasoning',
            isFree: false,
            users: '940',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
          {
            title: 'PYCT: Quantitative Aptitude Arithmetic Drill',
            topic: 'Quantitative Aptitude',
            isFree: false,
            users: '1.2k',
            qs: 10,
            marks: 13.33,
            mins: 10,
          },
        ],
      },
    ];

    // First real DB test ID to fall back on for playable tests
    const firstRealTest = rawTests.find((t) => t._id && /^[0-9a-fA-F]{24}$/.test(t._id.toString()));
    const fallbackTestId = firstRealTest?._id?.toString() || '';

    // Build synthesized tests map
    const buildSectionTests = (secDef, isPyp) => {
      // Find actual tests matching this section
      const dbMatches = rawTests.filter(
        (t) =>
          (t.sectionName && t.sectionName.toLowerCase() === secDef.sectionName.toLowerCase()) ||
          (t.categoryTag === (isPyp ? 'PYPs' : 'Mock Tests') && t.subjectTag === secDef.sectionName)
      );

      // Synthesize full sample list
      const synthetic = secDef.sampleTitles.map((item, idx) => ({
        _id:
          dbMatches[idx]?._id?.toString() ||
          (idx === 0 && fallbackTestId
            ? fallbackTestId
            : `${secDef.sectionName.replace(/\s+/g, '-').toLowerCase()}-${idx}`),
        realTestId: dbMatches[idx]?._id?.toString() || fallbackTestId,
        title: item.title,
        subjectTag: item.topic,
        sectionName: secDef.sectionName,
        categoryTag: isPyp ? 'PYPs' : 'Mock Tests',
        questionsCount: item.qs || 15,
        totalMarks: item.marks || 20,
        duration: item.mins || 18,
        isFree: item.isFree || false,
        userCountStr: item.users || '1.2k Users',
        testNumber: idx + 1,
      }));

      // Combine actual DB matches with synthetic ones (prioritizing DB matches)
      const combined = [...dbMatches];
      synthetic.forEach((syn) => {
        if (!combined.some((t) => t.title?.toLowerCase() === syn.title?.toLowerCase())) {
          combined.push(syn);
        }
      });

      return {
        ...secDef,
        id: `${isPyp ? 'pyp' : 'mock'}-${secDef.sectionName.replace(/\s+/g, '-').toLowerCase()}`,
        isPyp,
        tests: combined,
        count: Math.max(secDef.count, combined.length),
      };
    };

    const mockSections = rasDefaultMockSections.map((s) => buildSectionTests(s, false));
    const pypSections = rasDefaultPypSections.map((s) => buildSectionTests(s, true));

    // Handle any additional custom DB sections
    const knownSecNames = new Set([
      ...rasDefaultMockSections.map((s) => s.sectionName.toLowerCase()),
      ...rasDefaultPypSections.map((s) => s.sectionName.toLowerCase()),
    ]);

    rawTests.forEach((t) => {
      const sec = t.sectionName || 'Custom Practice Tests';
      if (!knownSecNames.has(sec.toLowerCase())) {
        const isPyp = t.categoryTag === 'PYPs' || t.testType === 'pyq';
        const target = isPyp ? pypSections : mockSections;
        let existing = target.find((s) => s.sectionName.toLowerCase() === sec.toLowerCase());
        if (!existing) {
          existing = {
            id: `${isPyp ? 'pyp' : 'mock'}-${sec.replace(/\s+/g, '-').toLowerCase()}`,
            sectionName: sec,
            isPyp,
            count: 0,
            topics: ['All'],
            tests: [],
          };
          target.push(existing);
        }
        existing.tests.push(t);
        existing.count = existing.tests.length;
        if (t.subjectTag && !existing.topics.includes(t.subjectTag)) {
          existing.topics.push(t.subjectTag);
        }
      }
    });

    return {
      mockSections,
      pypSections,
      allTests: rawTests,
    };
  }, [series]);

  // Active section list based on main tab
  const currentSections =
    activeMainTab === 'Mock Tests' ? categorizedData.mockSections : categorizedData.pypSections;

  // Selected section object
  const currentSectionObj =
    currentSections.find((s) => s.sectionName === activeSection) || currentSections[0] || null;

  // Set default active section once loaded
  useEffect(() => {
    if (
      currentSections.length > 0 &&
      (!activeSection || !currentSections.some((s) => s.sectionName === activeSection))
    ) {
      setActiveSection(currentSections[0].sectionName);
    }
  }, [activeMainTab, currentSections, activeSection]);

  // Filtered tests in active section
  const sectionFilteredTests = useMemo(() => {
    if (!currentSectionObj) return [];
    const tests = currentSectionObj.tests || [];
    if (activeTopicFilter === 'All') return tests;
    return tests.filter((t) => t.subjectTag === activeTopicFilter);
  }, [currentSectionObj, activeTopicFilter]);

  // Paginated tests slice
  const displayedTests = sectionFilteredTests.slice(0, visibleCount);
  const hasMoreTests = sectionFilteredTests.length > visibleCount;

  // Total counts for header
  const totalMockCount = categorizedData.mockSections.reduce((acc, s) => acc + s.count, 0);
  const totalPypCount = categorizedData.pypSections.reduce((acc, s) => acc + s.count, 0);
  const grandTotalTests = totalMockCount + totalPypCount;

  // Free tests in this series
  const freeTestsInSeries = useMemo(() => {
    const free = [];
    [...categorizedData.mockSections, ...categorizedData.pypSections].forEach((sec) => {
      sec.tests.forEach((t) => {
        if (t.isFree && !free.some((f) => f.title === t.title)) free.push(t);
      });
    });
    return free;
  }, [categorizedData]);

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex justify-center items-center bg-dark-50 dark:bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-dark-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-dark-900 rounded-3xl shadow-xl max-w-md w-full mx-4">
          <div className="h-20 w-20 mx-auto bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-5">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Not Found</h2>
          <p className="text-dark-500 mb-6">{error || 'Test series package not found'}</p>
          <Link
            to="/test-series"
            className="block w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all"
          >
            Browse Test Series
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50/50 dark:bg-dark-950 pb-24 text-dark-900 dark:text-dark-100">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-dark-900 text-white text-sm font-bold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-dark-700 animate-slide-up">
          <HiCheckCircle className="h-5 w-5 text-emerald-400" /> Link Copied to Clipboard!
        </div>
      )}

      {/* ════════ HERO & BREADCRUMB ════════ */}
      <section className="bg-gradient-to-br from-primary-800 via-indigo-900 to-dark-950 text-white pt-8 pb-14 lg:pt-10 lg:pb-20 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary-200/80 mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/test-series" className="hover:text-white transition-colors">
              Test Series
            </Link>
            <span>/</span>
            <span className="text-white truncate max-w-xs">{series.title}</span>
          </nav>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-white mb-3 leading-tight">
                {series.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-primary-200/90 mb-5">
                <span>
                  Last updated on{' '}
                  {new Date().toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span>•</span>
                <span className="text-amber-300 font-bold">⭐ 4.8 Rating</span>
                <span>•</span>
                <span className="text-white font-bold">{grandTotalTests} Total Tests</span>
                <span>•</span>
                <span className="text-emerald-300 font-bold">
                  {freeTestsInSeries.length || 1} Free Tests
                </span>
                <span>•</span>
                <span>21.2k Users</span>
                <span>•</span>
                <span>English, Hindi</span>
              </div>

              {/* Breakdown Pills Strip */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[...categorizedData.mockSections, ...categorizedData.pypSections].map(
                  (sec, idx) => (
                    <span
                      key={sec.id || `${sec.sectionName}-${idx}`}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-white/10 text-white/90 border border-white/15 backdrop-blur-sm"
                    >
                      {sec.count} {sec.sectionName}
                    </span>
                  )
                )}
              </div>

              {/* Action Buttons for Mobile */}
              <div className="flex items-center gap-3 lg:hidden mt-6">
                <button
                  onClick={handlePrimaryAction}
                  className={`flex-1 ${
                    isEnrolled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-dark-950 shadow-orange-500/20'
                  } font-black py-3.5 px-6 rounded-2xl shadow-xl text-center text-sm cursor-pointer flex items-center justify-center gap-2`}
                >
                  {isEnrolled ? (
                    <>
                      <HiCheckCircle className="h-5 w-5" /> Start Practicing
                    </>
                  ) : series.isFree || finalPrice === 0 ? (
                    'Start Free Tests'
                  ) : (
                    `Unlock Now for ₹${finalPrice}`
                  )}
                </button>
                <button
                  onClick={handleShare}
                  className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  <HiShare className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Pass / Unlock Banner (Desktop Hero Card) */}
            {isEnrolled ? (
              <div className="hidden lg:block bg-gradient-to-br from-emerald-900/60 via-teal-900/40 to-dark-900/80 border border-emerald-500/40 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white flex items-center gap-1">
                    <HiCheckCircle className="h-3.5 w-3.5" /> Enrolled • Full Access
                  </span>
                  <span className="text-xs font-bold text-emerald-300">Active Access</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  You Have Full Access to This Series
                </h3>
                <p className="text-xs text-emerald-100/90 mb-5 leading-relaxed">
                  All {grandTotalTests} tests, chapter-wise drills, full mocks & previous year
                  papers are unlocked and ready.
                </p>
                <button
                  onClick={handlePrimaryAction}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 rounded-2xl shadow-lg transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <HiPlay className="h-4 w-4" /> Start Practicing Now
                </button>
              </div>
            ) : (
              <div className="hidden lg:block bg-gradient-to-br from-white/15 to-white/5 border border-white/20 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-dark-950">
                    New • Pass Pro
                  </span>
                  <span className="text-xs font-bold text-primary-200">Full Access</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">
                  Unlock All Test Series with Pass
                </h3>
                <p className="text-xs text-primary-100/80 mb-4 leading-relaxed">
                  Get unlimited access to 270+ mock tests, topic drills, state rank predictor &
                  detailed explanations.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-white mb-6">
                  {[
                    'Mock Tests',
                    'Live Tests',
                    'Study Notes',
                    'Doubt Support',
                    'PYPs',
                    'Re-Attempt Mode',
                    'Unlimited Practice',
                  ].map((feature, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 text-primary-100">
                      <HiCheck className="h-4 w-4 text-emerald-400 shrink-0" /> {feature}
                    </span>
                  ))}
                </div>

                <button
                  onClick={handlePrimaryAction}
                  className="w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-dark-950 font-black py-3.5 rounded-2xl shadow-lg transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>
                    {series.isFree || finalPrice === 0
                      ? 'Start Practicing for Free'
                      : `Unlock Pass for ₹${finalPrice}`}
                  </span>
                  <HiArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════ MAIN CONTENT SECTION ════════ */}
      <section
        id="tests-main-container"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 lg:-mt-10 relative z-20"
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT: Tests Explorer */}
          <div className="flex-1 min-w-0">
            {/* ── Level 1: Main Category Tabs (Mock Tests vs PYPs) ── */}
            <div className="bg-white dark:bg-dark-900 p-2 rounded-3xl shadow-sm border border-dark-100 dark:border-dark-800 flex items-center gap-2 mb-6">
              <button
                onClick={() => setActiveMainTab('Mock Tests')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeMainTab === 'Mock Tests'
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800'
                }`}
              >
                <HiClipboardList className="h-5 w-5" />
                <span>Mock Tests</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    activeMainTab === 'Mock Tests'
                      ? 'bg-white/20 text-white'
                      : 'bg-dark-100 dark:bg-dark-800 text-dark-500'
                  }`}
                >
                  {totalMockCount}
                </span>
              </button>

              <button
                onClick={() => setActiveMainTab('PYPs')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeMainTab === 'PYPs'
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                    : 'text-dark-600 dark:text-dark-400 hover:bg-dark-50 dark:hover:bg-dark-800'
                }`}
              >
                <HiAcademicCap className="h-5 w-5" />
                <span>PYPs (Previous Papers)</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    activeMainTab === 'PYPs'
                      ? 'bg-white/20 text-white'
                      : 'bg-dark-100 dark:bg-dark-800 text-dark-500'
                  }`}
                >
                  {totalPypCount}
                </span>
              </button>
            </div>

            {/* ── Level 2: Section Tabs / Pills (e.g. Chapter Tests (GS), Rajasthan GK, Mental Ability, etc.) ── */}
            <div className="overflow-x-auto pb-2 mb-4 hide-scrollbar">
              <div className="flex gap-2 min-w-max">
                {currentSections.map((sec, idx) => (
                  <button
                    key={sec.id || `${sec.sectionName}-${idx}`}
                    onClick={() => setActiveSection(sec.sectionName)}
                    className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                      activeSection === sec.sectionName
                        ? 'bg-dark-900 text-white dark:bg-white dark:text-dark-900 shadow-md'
                        : 'bg-white dark:bg-dark-900 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-800 hover:bg-dark-50 dark:hover:bg-dark-800'
                    }`}
                  >
                    <span>{sec.sectionName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                        activeSection === sec.sectionName
                          ? 'bg-white/20 text-white dark:bg-dark-900/20 dark:text-dark-900'
                          : 'bg-dark-100 dark:bg-dark-800 text-dark-500'
                      }`}
                    >
                      {sec.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Level 3: Subject / Topic Filter Chips ── */}
            {currentSectionObj &&
              currentSectionObj.topics &&
              currentSectionObj.topics.length > 1 && (
                <div className="bg-white dark:bg-dark-900 p-4 rounded-3xl border border-dark-100 dark:border-dark-800 mb-6 shadow-sm">
                  <div className="text-xs font-black uppercase tracking-wider text-dark-400 mb-2.5">
                    Filter by Topic / Subject:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentSectionObj.topics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setActiveTopicFilter(topic)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeTopicFilter === topic
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-dark-50 dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200 dark:border-dark-700/60 hover:bg-dark-100 dark:hover:bg-dark-700'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* ── Level 4: Tests Grid & List ── */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-dark-900 dark:text-white flex items-center gap-2">
                  <span>{currentSectionObj?.sectionName}</span>
                  <span className="text-xs font-bold text-dark-400">
                    ({sectionFilteredTests.length} Tests Available)
                  </span>
                </h3>
              </div>

              {displayedTests.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-3xl border border-dashed border-dark-200 dark:border-dark-800 p-8">
                  <span className="text-4xl mb-2 block opacity-40">🔍</span>
                  <h4 className="text-base font-bold text-dark-900 dark:text-white mb-1">
                    No tests found for "{activeTopicFilter}"
                  </h4>
                  <p className="text-xs text-dark-500 mb-4">
                    Try selecting another topic filter above.
                  </p>
                  <button
                    onClick={() => setActiveTopicFilter('All')}
                    className="btn-outline text-xs font-bold px-4 py-2"
                  >
                    Show All Tests in {currentSectionObj?.sectionName}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedTests.map((test) => {
                    const isLocked =
                      !series.isFree && finalPrice > 0 && !test.isFree && !test.isPurchased;
                    return (
                      <TestItemCard
                        key={test._id || test.title}
                        test={test}
                        isLocked={isLocked}
                        onShare={handleShare}
                        onUnlock={handlePrimaryAction}
                      />
                    );
                  })}
                </div>
              )}

              {/* "View More" Pagination Button */}
              {hasMoreTests && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="bg-white dark:bg-dark-900 hover:bg-dark-50 dark:hover:bg-dark-800 border-2 border-primary-500 text-primary-600 dark:text-primary-400 font-extrabold px-8 py-3.5 rounded-2xl shadow-sm hover:shadow-md transition-all text-xs sm:text-sm cursor-pointer"
                  >
                    View More ({sectionFilteredTests.length - visibleCount} Remaining) ↓
                  </button>
                </div>
              )}
            </div>

            {/* ── Free Mock Tests Showcase Section ── */}
            {freeTestsInSeries.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-dark-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 mb-12 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                      Free Practice Tests
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                      {series.title} Free Mock Tests
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-200/80 mt-0.5">
                      Start with official sample tests and check your rank for free.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {freeTestsInSeries.map((fTest) => (
                    <TestItemCard
                      key={fTest._id || fTest.title}
                      test={{ ...fTest, isFree: true }}
                      isLocked={false}
                      onShare={handleShare}
                      onUnlock={handlePrimaryAction}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── More Test Series for You (Cross Sell) ── */}
            {moreSeriesList.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-dark-900 dark:text-white">
                      More Test Series for You
                    </h3>
                    <p className="text-xs text-dark-500">
                      Popular practice packs aligned with your exam goals
                    </p>
                  </div>
                  <Link
                    to="/test-series"
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    View All <HiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {moreSeriesList.slice(0, 4).map((mSeries) => (
                    <Link
                      key={mSeries._id}
                      to={`/test-series/${mSeries.slug || mSeries._id}`}
                      className="p-5 bg-white dark:bg-dark-900 rounded-2xl border border-dark-100 dark:border-dark-800 hover:border-primary-400 hover:shadow-md transition-all block group"
                    >
                      <div className="flex items-center justify-between text-xs text-dark-400 mb-2">
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                          {mSeries.examCategory?.name || 'Test Series'}
                        </span>
                        <span>{mSeries.testsCount || 45} Tests</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-dark-900 dark:text-white group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                        {mSeries.title}
                      </h4>
                      <p className="text-xs text-dark-500 line-clamp-2">{mSeries.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Why Take this Test Series ? ── */}
            <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 border border-dark-100 dark:border-dark-800 mb-8 shadow-sm">
              <h3 className="text-xl font-black text-dark-900 dark:text-white mb-6 text-center">
                Why Take This Test Series?
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center text-2xl flex-shrink-0">
                    🏆
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-dark-900 dark:text-white mb-1">
                      All India & State Rank
                    </h4>
                    <p className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed">
                      Compete with thousands of students across Rajasthan & India with live
                      percentile calculations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl flex-shrink-0">
                    🎯
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-dark-900 dark:text-white mb-1">
                      Personal Recommendation
                    </h4>
                    <p className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed">
                      Instant feedback and recommendations for you based on your strong & weak
                      subject areas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl flex-shrink-0">
                    💎
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-dark-900 dark:text-white mb-1">
                      No.1 Quality by Experts
                    </h4>
                    <p className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed">
                      Designed by subject faculties with years of experience. Based strictly on the
                      latest official pattern.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl flex-shrink-0">
                    🎁
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-dark-900 dark:text-white mb-1">
                      Earn Cashback & Referral
                    </h4>
                    <p className="text-xs text-dark-500 dark:text-dark-400 leading-relaxed">
                      Invite your study peers and earn cashback rewards directly to your wallet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Sticky Sidebar (Desktop) */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Purchase Card */}
              <div className="bg-white dark:bg-dark-900 rounded-3xl p-6 shadow-xl shadow-black/5 border border-dark-100 dark:border-dark-800">
                <div className="mb-6">
                  {isEnrolled ? (
                    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <HiCheckCircle className="h-7 w-7" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Enrollment Status
                        </div>
                        <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                          Enrolled • Full Access
                        </div>
                      </div>
                    </div>
                  ) : series.isFree || finalPrice === 0 ? (
                    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <HiSparkles className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Access
                        </div>
                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                          FREE
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-dark-400 mb-1">
                        Unlock Complete Test Series
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-black text-dark-900 dark:text-white">
                          ₹{finalPrice}
                        </span>
                        {series.discountPrice > finalPrice && (
                          <span className="text-lg text-dark-400 line-through">
                            ₹{series.discountPrice}
                          </span>
                        )}
                      </div>
                      {series.discountPrice > finalPrice && (
                        <span className="inline-block px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black rounded-lg uppercase tracking-wider">
                          {Math.round(
                            ((series.discountPrice - finalPrice) / series.discountPrice) * 100
                          )}
                          % OFF Today
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={handlePrimaryAction}
                    className={`w-full py-4 ${
                      isEnrolled
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-primary-500/25'
                    } text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm`}
                  >
                    {isEnrolled ? (
                      <>
                        <HiPlay className="h-4 w-4" /> Start Practicing Now
                      </>
                    ) : series.isFree || finalPrice === 0 ? (
                      'Start Practicing Now'
                    ) : (
                      'Buy Test Series Now'
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full py-3 bg-dark-50 hover:bg-dark-100 dark:bg-dark-800 dark:hover:bg-dark-700 text-dark-700 dark:text-dark-200 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-dark-200 dark:border-dark-700 text-xs cursor-pointer"
                  >
                    <HiShare className="h-4 w-4" /> Share with Friends
                  </button>
                </div>

                {/* Package Highlights */}
                <div className="pt-6 border-t border-dark-100 dark:border-dark-800">
                  <h4 className="text-xs font-black text-dark-900 dark:text-white uppercase tracking-wider mb-4">
                    This Package Includes:
                  </h4>
                  <div className="space-y-3 text-xs font-semibold text-dark-600 dark:text-dark-300">
                    <div className="flex items-center gap-2.5">
                      <HiClipboardList className="h-4 w-4 text-primary-500 shrink-0" />
                      <span>{grandTotalTests} Total Tests Available</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <HiQuestionMarkCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>3,500+ Questions with Solutions</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <HiGlobe className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>Bilingual (English & Hindi Medium)</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <HiLightningBolt className="h-4 w-4 text-orange-500 shrink-0" />
                      <span>Instant Percentile & State Rank</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <HiShieldCheck className="h-4 w-4 text-teal-500 shrink-0" />
                      <span>Unlimited Re-attempt Mode</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ MOBILE STICKY BOTTOM BAR (PURCHASE) ════════ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-dark-900 border-t border-dark-200 dark:border-dark-800 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.15)] lg:hidden z-40">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            {isEnrolled ? (
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <HiCheckCircle className="h-5 w-5 shrink-0" /> Enrolled
              </span>
            ) : series.isFree || finalPrice === 0 ? (
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                100% FREE
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="text-2xl font-black text-dark-900 dark:text-white leading-none">
                  ₹{finalPrice}
                </span>
                {series.discountPrice > finalPrice && (
                  <span className="text-xs text-dark-400 line-through mt-0.5">
                    ₹{series.discountPrice}
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handlePrimaryAction}
            className={`flex-1 py-3.5 ${
              isEnrolled
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-primary-600 to-indigo-600 active:from-primary-700 active:to-indigo-700 shadow-primary-500/25'
            } text-white font-black rounded-xl transition-all shadow-lg cursor-pointer text-sm flex items-center justify-center gap-1.5`}
          >
            {isEnrolled ? (
              <>
                <HiPlay className="h-4 w-4" /> Start Practicing
              </>
            ) : series.isFree || finalPrice === 0 ? (
              'Start Free Tests'
            ) : (
              'Unlock Now'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
