import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

interface MainLayoutProps {
  children: React.ReactNode;
  hasNavbarOffset?: boolean;
}

export default function MainLayout({ children, hasNavbarOffset = true }: MainLayoutProps) {
  return (
    <>
      <Navbar />
      <main className={hasNavbarOffset ? 'pt-24' : ''}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
} 