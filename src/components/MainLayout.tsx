import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface MainLayoutProps {
  children: React.ReactNode;
  hasNavbarOffset?: boolean;
}

export default function MainLayout({ children, hasNavbarOffset = true }: MainLayoutProps) {
  return (
    <>
      <Navbar />
      <main className={hasNavbarOffset ? 'pt-24' : ''}>
        {children}
      </main>
      <Footer />
    </>
  );
} 