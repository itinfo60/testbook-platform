import { useState, useEffect } from 'react';
import { examCategoryAPI } from './api';

// Canonical Fallback Categories for Rajasthan & National Exams
export const CANONICAL_EXAM_CATEGORIES = [
  {
    _id: 'ras',
    slug: 'ras',
    name: 'RPSC RAS (Prelims & Mains)',
    shortName: 'RAS',
    description: 'Rajasthan Administrative Services examination complete preparation hub.',
    icon: '🏛️',
    coursesCount: 8,
    testsCount: 45,
    isPopular: true,
  },
  {
    _id: 'patwari',
    slug: 'rsmssb-patwari',
    name: 'RSMSSB Patwari',
    shortName: 'Patwari',
    description: 'Rajasthan Patwari recruitment exam syllabus, notes and mock tests.',
    icon: '🌾',
    coursesCount: 5,
    testsCount: 30,
    isPopular: true,
  },
  {
    _id: 'pgt-political-science',
    slug: 'pgt-political-science',
    name: '1st Grade School Lecturer / PGT',
    shortName: '1st Grade',
    description: 'Political Science & GS target test series and comprehensive video classes.',
    icon: '📚',
    coursesCount: 6,
    testsCount: 35,
    isPopular: true,
  },
  {
    _id: 'senior-teacher-2nd-grade',
    slug: 'senior-teacher-2nd-grade',
    name: 'RPSC 2nd Grade (Senior Teacher)',
    shortName: '2nd Grade',
    description: 'Paper 1 GK and Subject specialization batches.',
    icon: '🎓',
    coursesCount: 4,
    testsCount: 25,
    isPopular: true,
  },
  {
    _id: 'eo-ro',
    slug: 'rpsc-eo-ro',
    name: 'RPSC EO / RO Exam',
    shortName: 'EO / RO',
    description: 'Executive Officer & Revenue Officer special act drills and full mocks.',
    icon: '⚖️',
    coursesCount: 3,
    testsCount: 20,
    isPopular: true,
  },
  {
    _id: 'rjs',
    slug: 'rjs-judiciary',
    name: 'RJS (Rajasthan Judicial Services)',
    shortName: 'RJS',
    description: 'Civil Judge Prelims & Mains legal drills and case-law analysis.',
    icon: '🏛️',
    coursesCount: 4,
    testsCount: 20,
    isPopular: true,
  },
  {
    _id: 'cet-rajasthan',
    slug: 'rajasthan-cet',
    name: 'Rajasthan CET (Graduation & 12th Level)',
    shortName: 'CET',
    description: 'Common Eligibility Test full syllabus practice & mocks.',
    icon: '📝',
    coursesCount: 5,
    testsCount: 40,
    isPopular: true,
  },
  {
    _id: 'police-si',
    slug: 'rajasthan-police-si',
    name: 'Rajasthan Police SI & Constable',
    shortName: 'Police SI',
    description: 'Hindi grammar and General Studies comprehensive test series.',
    icon: '👮',
    coursesCount: 4,
    testsCount: 28,
    isPopular: true,
  },
];

let cachedCategories = null;
let fetchPromise = null;

/**
 * Standardize category objects from any backend endpoint
 */
export function normalizeCategory(cat) {
  if (!cat) return null;
  const id = cat._id || cat.id || cat.slug;
  return {
    _id: id,
    id: id,
    name: cat.name || cat.title || 'General Exam',
    slug: cat.slug || id,
    description: cat.description || '',
    icon: cat.icon || '🎯',
    courseCount: cat.courseCount || cat.coursesCount || 0,
    coursesCount: cat.coursesCount || cat.courseCount || 0,
    testCount: cat.testCount || cat.testsCount || 0,
    testsCount: cat.testsCount || cat.testCount || 0,
    testSeriesCount: cat.testSeriesCount || 0,
    blogCount: cat.blogCount || 0,
    subcategories: Array.isArray(cat.subcategories)
      ? cat.subcategories.map(normalizeCategory).filter(Boolean)
      : [],
    parent: cat.parent || null,
  };
}

/**
 * Fetch all exam categories with caching and canonical fallbacks (Single Source of Truth)
 */
export async function getUnifiedExamCategories(forceRefresh = false) {
  if (cachedCategories && !forceRefresh) {
    return cachedCategories;
  }

  if (fetchPromise && !forceRefresh) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await examCategoryAPI.getAll();
      const rawList =
        res.data?.data?.allCategories ||
        res.data?.data?.categories ||
        res.data?.categories ||
        res.data?.data ||
        [];

      const list = Array.isArray(rawList) ? rawList.map(normalizeCategory).filter(Boolean) : [];

      cachedCategories = list;
      return list;
    } catch (err) {
      console.warn('Failed to load categories from API', err);
      cachedCategories = [];
      return [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * React Hook for consuming exam categories everywhere in client components
 */
export function useExamCategories() {
  const [categories, setCategories] = useState(cachedCategories || []);
  const [loading, setLoading] = useState(!cachedCategories);

  useEffect(() => {
    getUnifiedExamCategories().then((cats) => {
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  return { categories, loading, refresh: () => getUnifiedExamCategories(true) };
}
