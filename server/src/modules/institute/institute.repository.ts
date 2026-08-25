import { BaseRepository } from '../../core/base.repository.js';
import prisma from '../../config/prisma.js';

export class InstituteRepository extends BaseRepository<any> {
  constructor(model = prisma.institute) {
    super(model as any);
  }

  async findBySubdomain(subdomain: string): Promise<any> {
    return this.model.findFirst({
      where: { subdomain: subdomain.toLowerCase(), isActive: true },
    });
  }

  async findByCustomDomain(customDomain: string): Promise<any> {
    return this.model.findFirst({
      where: { customDomain: customDomain.toLowerCase(), isActive: true },
    });
  }

  async findActiveById(id: string): Promise<any> {
    return this.model.findFirst({
      where: { id, isActive: true },
    });
  }
}
export default InstituteRepository;
