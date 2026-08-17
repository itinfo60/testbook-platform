import { useState, useEffect } from 'react';
import { examCategoryAPI } from './api';

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
