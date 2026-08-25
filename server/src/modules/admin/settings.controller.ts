import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../core/api-response.js';
import prisma from '../../config/prisma.js';

const defaultLegalSettings = {
  privacyPolicy: `At CivicsEdu, we respect your privacy and are committed to protecting student personal information. This Privacy Policy outlines how your data is collected, used, and safeguarded.

1. Information We Collect
We collect information provided directly by you during registration, including your name, mobile number, email address, exam preferences, and payment transactions via Razorpay.

2. Watermarking Security
To protect proprietary handwritten notes and course content, study materials viewable or downloadable on CivicsEdu carry a dynamic watermark displaying your registered name and student ID.

3. Data Protection & Confidentiality
We employ strict encryption and security practices to ensure your credentials and payment data remain confidential. We do not sell your personal data to third parties.`,

  termsAndConditions: `By accessing or using CivicsEdu services, courses, and test series, you agree to comply with the following terms:

1. Account & Content License
Course enrollments and test series subscriptions are personal to the registered student and non-transferable. Account sharing or public redistribution of study materials is strictly prohibited and subject to immediate account termination without refund.

2. Intellectual Property Rights
All video lectures, PDF notes, mock questions, test solutions, and study resources are proprietary intellectual property of CivicsEdu and its faculty.

3. Platform Conduct
Users agree to maintain civil and academic conduct across doubt discussions, live class chats, and community portals.`,

  refundPolicy: `Digital courses, live class access, and online test series subscriptions are non-refundable once content has been accessed or test attempts have been initiated.

1. Duplicate Payments
In the event of accidental duplicate transactions, the excess charge will be refunded to the original payment source within 5-7 business days upon receipt of transaction receipts.

2. Technical Discrepancies
If a technical defect prevents access to purchased course modules and remains unresolved by our support team within 48 hours, a pro-rated refund or store credit will be evaluated.`,

  disclaimer: `CivicsEdu is an independent educational technology platform providing exam preparation materials, mock tests, and faculty guidance. We are not officially affiliated with RPSC, UPSC, or any government commission.

All syllabus breakdowns, exam alerts, and previous year analyses are curated for educational guidance and competitive exam preparation.`,

  lastUpdated: new Date().toISOString(),
};

const defaultHelpSettings = {
  supportEmail: 'support@civicsedu.com',
  supportPhone: '+91 98765 43210',
  supportWhatsapp: '+91 98765 43210',
  supportHours: 'Mon – Sat: 9:00 AM – 7:00 PM IST',
  officeAddress: 'CivicsEdu Learning Centre, Jaipur, Rajasthan, India',
  faqs: [
    {
      id: 'faq-1',
      category: 'Course Access',
      question: 'How do I access my purchased courses & handwritten notes?',
      answer:
        'After successful payment via Razorpay, your course is automatically unlocked under "My Courses" in your Student Dashboard. Handwritten PDFs can be viewed or downloaded directly.',
    },
    {
      id: 'faq-2',
      category: 'Watermarked PDFs',
      question: 'Why are PDFs watermarked with my name & mobile number?',
      answer:
        'To prevent piracy and illegal redistribution of premium faculty handwritten notes, all paid PDFs feature a dynamic watermark indicating your registered student identity.',
    },
    {
      id: 'faq-3',
      category: 'Test Series',
      question: 'Can I re-attempt mock tests?',
      answer:
        'Each test series allows up to the designated attempt limit. Detailed solutions, state percentile, and performance analytics remain available indefinitely in your test analysis tab.',
    },
    {
      id: 'faq-4',
      category: 'Payments',
      question: 'What should I do if money is deducted but course is not unlocked?',
      answer:
        'Please allow 5-10 minutes for payment webhook confirmation. If access is still pending, submit a support ticket with your transaction ID or message our WhatsApp helpline.',
    },
    {
      id: 'faq-5',
      category: 'Video Classes',
      question: 'Can I watch video lectures on mobile and adjust playback speed?',
      answer:
        'Yes, video lectures support adaptive streaming, playback speed controls (0.75x to 2x), and offline video playback on supported mobile browsers.',
    },
  ],
};

const defaultSuccessStories = [
  {
    id: 'story-1',
    name: 'Vikram Singh Shekhawat',
    exam: 'RPSC RAS 2023',
    rank: 'Rank 14 (SDM Selected)',
    year: '2023 Batch',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    quote:
      'The Political Science & Rajasthan GS test series at CivicsEdu was the cornerstone of my Mains preparation. The answer writing feedback simulated actual commission evaluation perfectly.',
    badge: 'State Top 20',
    isFeatured: true,
  },
  {
    id: 'story-2',
    name: 'Dr. Ananya Sharma',
    exam: 'RPSC Assistant Professor (Political Science)',
    rank: 'Rank 3 (State Topper)',
    year: '2022-23',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    quote:
      'Mastering Western & Indian Political Thinkers became effortless with handwritten notes and curated unit-wise question banks. Highly recommended for all serious aspirants.',
    badge: 'Selected AP',
    isFeatured: true,
  },
  {
    id: 'story-3',
    name: 'Pooja Choudhary',
    exam: 'RPSC 1st Grade School Lecturer',
    rank: 'Rank 28 (Pol. Sci.)',
    year: '2024',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    quote:
      'The daily quizzes and live doubt resolution with faculty helped me maintain consistent study discipline throughout the 8-month intensive preparation.',
    badge: '1st Grade Teacher',
    isFeatured: true,
  },
  {
    id: 'story-4',
    name: 'Rahul Meena',
    exam: 'Rajasthan CET & Patwari',
    rank: 'Selected with 99.4 Percentile',
    year: '2024 Batch',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    quote:
      'Mock tests match the exact interface and difficulty of the official RSMSSB exams. The performance analytics identified my weak topics within minutes.',
    badge: '99+ Percentile',
    isFeatured: false,
  },
];

let inMemorySettings: any = {
  siteName: 'CivicsEdu Platform',
  siteLogo: '',
  supportEmail: 'support@civicsedu.com',
  supportPhone: '+91 98765 43210',
  maintenanceMode: false,
  allowUserRegistration: true,
  allowMockPayments: process.env.ALLOW_MOCK_PAYMENTS === 'true',
  currency: 'INR',
  currencySymbol: '₹',
  banners: [],
  legal: defaultLegalSettings,
  help: defaultHelpSettings,
  successStories: defaultSuccessStories,
  featureFlags: {},
};

async function loadSettingsFromDb() {
  try {
    const inst = await prisma.institute.findFirst();
    if (inst && inst.settings && typeof inst.settings === 'object') {
      inMemorySettings = {
        ...inMemorySettings,
        ...(inst.settings as any),
        legal: {
          ...defaultLegalSettings,
          ...((inst.settings as any)?.legal || {}),
        },
        help: {
          ...defaultHelpSettings,
          ...((inst.settings as any)?.help || {}),
        },
        successStories: Array.isArray((inst.settings as any)?.successStories)
          ? (inst.settings as any).successStories
          : defaultSuccessStories,
      };
    }
  } catch (err) {
    console.warn('Could not read settings from DB, using fallback memory:', err);
  }
}

// Initial load
loadSettingsFromDb();

async function saveSettingsToDb(newSettings: any) {
  inMemorySettings = newSettings;
  try {
    const inst = await prisma.institute.findFirst();
    if (inst) {
      await prisma.institute.update({
        where: { id: inst.id },
        data: { settings: newSettings },
      });
    }
  } catch (err) {
    console.warn('Could not save settings to DB:', err);
  }
}

export class SettingsController {
  // Public endpoint for general frontend settings
  async getPublicSettings(req: Request, res: Response, next: NextFunction) {
    try {
      await loadSettingsFromDb();
      return ApiResponse.ok(res, inMemorySettings, 'Platform settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Public endpoint for Legal policies
  async getLegalSettings(req: Request, res: Response, next: NextFunction) {
    try {
      await loadSettingsFromDb();
      const legal = inMemorySettings.legal || defaultLegalSettings;
      return ApiResponse.ok(res, legal, 'Legal policies retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Public endpoint for Help Center & FAQs
  async getHelpSettings(req: Request, res: Response, next: NextFunction) {
    try {
      await loadSettingsFromDb();
      const help = inMemorySettings.help || defaultHelpSettings;
      return ApiResponse.ok(res, help, 'Help & FAQ settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Public endpoint for Success Stories / Hall of Fame
  async getSuccessStories(req: Request, res: Response, next: NextFunction) {
    try {
      await loadSettingsFromDb();
      const stories = inMemorySettings.successStories || defaultSuccessStories;
      return ApiResponse.ok(
        res,
        { stories, total: stories.length },
        'Success stories retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Get full settings
  async getAdminSettings(req: Request, res: Response, next: NextFunction) {
    try {
      await loadSettingsFromDb();
      return ApiResponse.ok(res, inMemorySettings, 'Admin settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Update platform settings
  async updateAdminSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const merged = { ...inMemorySettings, ...req.body };
      await saveSettingsToDb(merged);
      return ApiResponse.ok(res, merged, 'Platform settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Update Legal policies
  async updateLegalSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedLegal = {
        ...defaultLegalSettings,
        ...(inMemorySettings.legal || {}),
        ...req.body,
        lastUpdated: new Date().toISOString(),
      };
      const merged = { ...inMemorySettings, legal: updatedLegal };
      await saveSettingsToDb(merged);
      return ApiResponse.ok(res, updatedLegal, 'Legal policies updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Update Help & FAQs
  async updateHelpSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedHelp = {
        ...defaultHelpSettings,
        ...(inMemorySettings.help || {}),
        ...req.body,
      };
      const merged = { ...inMemorySettings, help: updatedHelp };
      await saveSettingsToDb(merged);
      return ApiResponse.ok(res, updatedHelp, 'Help & FAQs updated successfully');
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Update Success Stories
  async updateSuccessStories(req: Request, res: Response, next: NextFunction) {
    try {
      const { stories } = req.body;
      const validStories = Array.isArray(stories) ? stories : [];
      const merged = { ...inMemorySettings, successStories: validStories };
      await saveSettingsToDb(merged);
      return ApiResponse.ok(
        res,
        { stories: validStories, total: validStories.length },
        'Success stories updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  // Admin endpoint: Add or update banner
  async updateBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const { banners } = req.body;
      inMemorySettings.banners = banners;
      const merged = { ...inMemorySettings, banners };
      await saveSettingsToDb(merged);
      return ApiResponse.ok(res, banners, 'Banners updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
