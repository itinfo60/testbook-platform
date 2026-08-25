import { TenantRepository } from '../../core/tenant.repository.js';
import prisma from '../../config/prisma.js';

export class NoteRepository extends TenantRepository<any> {
  constructor(model = prisma.note) {
    super(model as any);
  }
}

export default NoteRepository;
