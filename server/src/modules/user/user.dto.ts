export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  isActive: boolean;
  isEmailVerified: boolean;
  phone?: string;
  bio?: string;
  avatar?: {
    url: string;
    publicId: string;
  };
  totalPoints: number;
  streak: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserQueryFilters {
  page?: number | string;
  limit?: number | string;
  search?: string;
  role?: string;
  isActive?: boolean | string;
}
