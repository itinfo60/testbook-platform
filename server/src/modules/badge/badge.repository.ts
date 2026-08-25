import { BaseRepository } from '../../core/base.repository.js';
import prisma from '../../config/prisma.js';

export class BadgeRepository extends BaseRepository<any> {
  constructor(model = prisma.badge) {
    super(model as any);
  }
}

export default BadgeRepository;
