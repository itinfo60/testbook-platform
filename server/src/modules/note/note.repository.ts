import { Model } from 'mongoose';
import { TenantRepository } from '../../core/tenant.repository.js';
import { INote } from './note.dto.js';
import Note from './note.model.js';

export class NoteRepository extends TenantRepository<INote> {
  constructor(model: Model<INote> = Note) {
    super(model);
  }
}

export default NoteRepository;
