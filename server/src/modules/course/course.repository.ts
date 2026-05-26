import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { ICourse } from './course.model.js';
import Course from './course.model.js';
import { CourseQueryInput } from './course.validation.js';

export class CourseRepository extends TenantRepository<ICourse> {
  constructor(model: Model<ICourse> = Course as Model<ICourse>) {
    super(model);
  }

  async paginateCourses(query: CourseQueryInput): Promise<{ docs: ICourse[]; total: number }> {
    const filter: any = {};

    if (query.category) {
      filter.category = query.category;
    }

    if (query.level) {
      filter.level = query.level;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured;
    }

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      filter.effectivePrice = {};
      if (query.priceMin !== undefined) {
        filter.effectivePrice.$gte = query.priceMin;
      }
      if (query.priceMax !== undefined) {
        filter.effectivePrice.$lte = query.priceMax;
      }
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const scopedFilter = this.getScopedFilter(filter);

    let sortObj: any = { createdAt: -1 };
    if (query.sort === 'oldest') {
      sortObj = { createdAt: 1 };
    } else if (query.sort === 'price_low') {
      sortObj = { effectivePrice: 1 };
    } else if (query.sort === 'price_high') {
      sortObj = { effectivePrice: -1 };
    } else if (query.sort === 'rating') {
      sortObj = { averageRating: -1 };
    } else if (query.sort === 'popular') {
      sortObj = { enrollmentCount: -1 };
    }

    const skip = (query.page - 1) * query.limit;

    const [docs, total] = await Promise.all([
      this.model
        .find(scopedFilter)
        .populate('teacher', 'name email avatar')
        .populate('category', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(query.limit)
        .exec(),
      this.model.countDocuments(scopedFilter).exec(),
    ]);

    return { docs, total };
  }
}
export default CourseRepository;
