export interface InstituteResponseDto {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  logo?: {
    url: string;
    publicId: string;
  };
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    bannerUrl: string;
    faviconUrl: string;
  };
  websiteTitle?: string;
  contactDetails?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  isActive: boolean;
  owner: string;
  subscription: {
    status: string;
    expiresAt: Date;
  };
  limits: {
    studentLimit: number;
    teacherLimit: number;
    storageLimit: number;
  };
  storageUsed: number;
}
