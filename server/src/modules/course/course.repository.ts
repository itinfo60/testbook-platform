import { TenantRepository } from '../../core/tenant.repository.js';
import prisma from '../../config/prisma.js';
import { CourseQueryInput } from './course.validation.js';

export class CourseRepository extends TenantRepository<any> {
  constructor(model = prisma.course) {
    super(model as any);
  }

  async paginateCourses(query: CourseQueryInput): Promise<{ docs: any[]; total: number }> {
    const filter: any = {};

    if (query.category) {
      const categoryInputs = query.category.split(',').filter(Boolean);
      const matchedCats = await prisma.category.findMany({
        where: {
          OR: [{ id: { in: categoryInputs } }, { slug: { in: categoryInputs } }],
        },
        select: { id: true },
      });

      const matchedCatIds = matchedCats.map((c) => c.id);
      const subcats = await prisma.category.findMany({
        where: { parentId: { in: matchedCatIds } },
        select: { id: true },
      });

      const allCategoryIds = [...new Set([...matchedCatIds, ...subcats.map((c) => c.id)])];

      filter.categoryId = { in: allCategoryIds.length > 0 ? allCategoryIds : categoryInputs };
    }

    if (query.level) {
      filter.level = query.level;
    }

    if (query.status) {
      if (query.status === 'published') {
        filter.isPublished = true;
      } else if (query.status === 'draft') {
        filter.isPublished = false;
      }
    }

    if (query.isFeatured !== undefined) {
      filter.isFeatured = query.isFeatured;
    }

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      filter.price = {};
      if (query.priceMin !== undefined) {
        filter.price.gte = query.priceMin;
      }
      if (query.priceMax !== undefined) {
        filter.price.lte = query.priceMax;
      }
    }

    if (query.teacher) {
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        query.teacher
      );
      if (isId) {
        filter.teacherId = query.teacher;
      } else {
        filter.teacher = { name: { contains: query.teacher, mode: 'insensitive' } };
      }
    }

    if (query.search) {
      filter.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { teacher: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const scopedFilter = this.getScopedFilter(filter);

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (query.sort === 'price_low') {
      orderBy = { price: 'asc' };
    } else if (query.sort === 'price_high') {
      orderBy = { price: 'desc' };
    } else if (query.sort === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const skip = (query.page - 1) * query.limit;

    const [docs, total] = await Promise.all([
      prisma.course.findMany({
        where: scopedFilter,
        include: {
          teacher: { select: { id: true, name: true, email: true, avatar: true } },
          category: { select: { name: true } },
        },
        orderBy,
        skip,
        take: query.limit,
      }),
      prisma.course.count({ where: scopedFilter }),
    ]);

    return { docs, total };
  }
}
export default CourseRepository;
