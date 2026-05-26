export interface CourseQueryFilters {
  page?: number | string;
  limit?: number | string;
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  search?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  priceMin?: number | string;
  priceMax?: number | string;
}
