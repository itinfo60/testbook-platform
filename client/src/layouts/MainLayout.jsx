import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center py-32">
    <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
