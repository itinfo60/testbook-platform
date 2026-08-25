import SeoHead from '@/components/SeoHead';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiSearch,
  HiAcademicCap,
  HiBookOpen,
  HiClipboardList,
  HiDownload,
  HiCheckCircle,
  HiSparkles,
  HiUserGroup,
  HiBadgeCheck,
  HiShieldCheck,
  HiPlay,
  HiDocumentText,
  HiBell,
  HiArrowRight,
  HiStar,
  HiChevronRight,
  HiLightningBolt,
  HiFire,
  HiLibrary,
  HiUsers,
  HiCheck,
} from 'react-icons/hi';
import api, { blogAPI, examCategoryAPI, courseAPI } from '@/services/api';
import CourseCard from '@/features/course/components/CourseCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import JourneyHero from '@/components/home/v3/JourneyHero';
import ValueStack from '@/components/home/v3/ValueStack';
import CuratedExams from '@/components/home/v3/CuratedExams';
import CuratedCourses from '@/components/home/v3/CuratedCourses';
import CuratedTestSeries from '@/components/home/v3/CuratedTestSeries';
import TestingExperience from '@/components/home/v3/TestingExperience';
import DailyChallenge from '@/components/home/v3/DailyChallenge';
import SampleClasses from '@/components/home/v3/SampleClasses';
import FreeResources from '@/components/home/v3/FreeResources';
import CuratedArticles from '@/components/home/v3/CuratedArticles';
import PerformancePreview from '@/components/home/v3/PerformancePreview';
import FinalCTA from '@/components/home/v2/FinalCTA';

export default function CivicsHubHome() {
  return (
    <div className="min-h-screen bg-[#faf9f6] font-sans selection:bg-accent-500/30">
      <SeoHead
        title="CivicsHub — Your Exam Is the Goal. We Build the Journey."
        description="Learn the right things. Practice the right questions. Measure your progress. Improve until you're ready for RAS, RPSC, Assistant Professor, and Political Science."
      />

      <JourneyHero />
      <ValueStack />

      <CuratedExams />
      <CuratedCourses />

      <SampleClasses />
      <FreeResources />

      <TestingExperience />

      <CuratedTestSeries />
      <DailyChallenge />
      <PerformancePreview />

      <CuratedArticles />

      <FinalCTA />
    </div>
  );
}
