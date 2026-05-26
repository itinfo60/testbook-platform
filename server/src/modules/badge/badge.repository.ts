import { Model } from 'mongoose';
import { BaseRepository } from '../../core/base.repository.js';
import { IBadge } from './badge.dto.js';
import Badge from './badge.model.js';

export class BadgeRepository extends BaseRepository<IBadge> {
  constructor(model: Model<IBadge> = Badge) {
    super(model);
  }
}

export default BadgeRepository;
