import { useState, useEffect } from 'react';
import api from './api';

// ── per-type cache ────────────────────────────────────────────────────────────
const cache = { exam: null, category: null, all: null };
const pending = { exam: null, category: null, all: null };

/**
 * Standardize a raw category/exam document from any API endpoint.
 */
export function normalizeCategory(cat) {
  if (!cat) return null;
  const id = cat._id || cat.id || cat.slug;
  return {
    _id: id,
    id: id,
    name: cat.name || cat.title || 'General',
    slug: cat.slug || id,
    description: cat.description || '',
    icon: cat.icon || '🎯',
    type: cat.type || 'category',
    // Exam metadata
    latestStatus: cat.latestStatus || '',
    conductingBody: cat.conductingBody || '',
    officialWebsite: cat.officialWebsite || '',
    syllabus: cat.syllabus || '',
    examPattern: cat.examPattern || '',
    eligibility: cat.eligibility || '',
    selectionProcess: cat.selectionProcess || '',
    importantDates: cat.importantDates || [],
    isActive: cat.isActive !== false,
    order: cat.order || 0,
    courseCount: cat.courseCount || cat.coursesCount || 0,
    coursesCount: cat.coursesCount || cat.courseCount || 0,
    testCount: cat.testCount || cat.testsCount || 0,
    testsCount: cat.testsCount || cat.testCount || 0,
    testSeriesCount: cat.testSeriesCount || 0,
    blogCount: cat.blogCount || 0,
    subcategories: Array.isArray(cat.subcategories)
      ? cat.subcategories.map(normalizeCategory).filter(Boolean)
      : [],
    parentId: cat.parentId || null,
    parent: cat.parent || null,
  };
}

/**
 * Internal fetcher. Calls the public GET /categories endpoint with an optional
 * `type` param and normalises the result. Results are cached per type key.
 *
 * type: 'exam' | 'category' | undefined (= all)
 */
async function fetchByType(type, forceRefresh = false) {
  const key = type || 'all';

  if (cache[key] && !forceRefresh) return cache[key];
  if (pending[key] && !forceRefresh) return pending[key];

  pending[key] = (async () => {
    try {
      const params = type ? { type } : {};
      const res = await api.get('/categories', { params });
      const raw = res.data?.data;
      // Public endpoint shape: { categories: [...], allCategories: [...] }
      const rawList = Array.isArray(raw) ? raw : raw?.allCategories || raw?.categories || [];

      const list = rawList
        .filter((c) => (type === 'resource' ? c.type === 'resource' : c.type !== 'resource'))
        .map(normalizeCategory)
        .filter(Boolean);
      cache[key] = list;
      return list;
    } catch (err) {
      console.warn(`Failed to load categories (type=${key})`, err);
      cache[key] = [];
      return [];
    } finally {
      pending[key] = null;
    }
  })();

  return pending[key];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch only `type:'exam'` records — used by /exams pages, CuratedExams section.
 */
export function getUnifiedExams(forceRefresh = false) {
  return fetchByType('exam', forceRefresh);
}

/**
 * Fetch only `type:'category'` records — used by course catalog filter and
 * the teacher/admin course creation category dropdown.
 */
export function getUnifiedCategories(forceRefresh = false) {
  return fetchByType('category', forceRefresh);
}

/**
 * Fetch all records regardless of type (legacy — kept for backwards compat).
 * New code should prefer getUnifiedExams or getUnifiedCategories.
 */
export function getUnifiedExamCategories(forceRefresh = false) {
  return fetchByType(undefined, forceRefresh);
}

// ── React Hooks ───────────────────────────────────────────────────────────────

/**
 * Hook: returns only exams (type:'exam') — for home section and exam catalog.
 */
export function useExamCategories() {
  const [categories, setCategories] = useState(cache.exam || []);
  const [loading, setLoading] = useState(!cache.exam);

  useEffect(() => {
    let cancelled = false;
    getUnifiedExams().then((list) => {
      if (!cancelled) {
        setCategories(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, refresh: () => getUnifiedExams(true).then(setCategories) };
}

/**
 * Hook: returns only course categories (type:'category') — for course forms.
 */
export function useCourseCategories() {
  const [categories, setCategories] = useState(cache.category || []);
  const [loading, setLoading] = useState(!cache.category);

  useEffect(() => {
    let cancelled = false;
    getUnifiedCategories().then((list) => {
      if (!cancelled) {
        setCategories(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, refresh: () => getUnifiedCategories(true).then(setCategories) };
}
