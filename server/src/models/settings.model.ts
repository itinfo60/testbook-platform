import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  badge?: string;
  isActive: boolean;
  order: number;
}

export interface IPlatformSettings extends Document {
  siteName: string;
  siteLogo?: string;
  supportEmail: string;
  supportPhone?: string;
  maintenanceMode: boolean;
  allowUserRegistration: boolean;
  allowMockPayments: boolean;
  currency: string;
  currencySymbol: string;
  defaultStudentLimit: number;
  banners: IBanner[];
  featureFlags: Map<string, boolean>;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  linkUrl: { type: String, default: '' },
  badge: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
});

const settingsSchema = new Schema<IPlatformSettings>(
  {
    siteName: { type: String, default: 'Testbook Platform' },
    siteLogo: { type: String, default: '' },
    supportEmail: { type: String, default: 'support@testbook.com' },
    supportPhone: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    allowUserRegistration: { type: Boolean, default: true },
    allowMockPayments: { type: Boolean, default: true },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    defaultStudentLimit: { type: Number, default: 500 },
    banners: { type: [bannerSchema], default: [] },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: () =>
        new Map([
          ['enableLiveClasses', true],
          ['enableAIHelper', true],
          ['enableAffiliates', true],
          ['enableDiscussionForum', true],
          ['enableCertificates', true],
        ]),
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model<IPlatformSettings>('PlatformSettings', settingsSchema);
export default PlatformSettings;
