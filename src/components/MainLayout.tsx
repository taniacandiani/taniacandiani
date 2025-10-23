import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import GoToTopButton from '@/components/ui/GoToTopButton';

interface MainLayoutProps {
  children: React.ReactNode;
  hasNavbarOffset?: boolean;
}

export default function MainLayout({ children, hasNavbarOffset = true }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`relative flex-grow ${hasNavbarOffset ? 'pt-24' : ''}`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <Footer />
      <GoToTopButton />
    </div>
  );
} 