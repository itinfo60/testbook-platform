import HeroSection from '@/components/home/HeroSection';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import PopularCourses from '@/components/home/PopularCourses';
import DailyChallengeBanner from '@/components/home/DailyChallengeBanner';
import TrendingTests from '@/components/home/TrendingTests';
import StatsSection from '@/components/home/StatsSection';
import TestimonialSection from '@/components/home/TestimonialSection';
export default function Home() {
  return (
    <div>
      <HeroSection />
      <FeaturedCategories />
      <PopularCourses />
      <DailyChallengeBanner />
      <TrendingTests />
      <StatsSection />
      <TestimonialSection />
    </div>
  );
}
