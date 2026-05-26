export interface IGdprExportPayload {
  exportedAt: string;
  personal: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    role: string;
    createdAt: Date;
    lastActiveAt?: Date;
    consentGiven: boolean;
    consentAt?: Date;
  };
  enrollments: Array<{
    courseId: string;
    enrolledAt: Date;
    completedAt?: Date;
    completionPercentage: number;
  }>;
  payments: Array<{
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
  }>;
}

export interface IEraseMyDataInput {
  password?: string;
}

export interface IRecordConsentInput {
  version?: string;
}
