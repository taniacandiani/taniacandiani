import Link from 'next/link';
import { NAVIGATION_ITEMS } from '@/constants/navigation';

interface NavigationProps {
  className?: string;
  itemClassName?: string;
  orientation?: 'horizontal' | 'vertical';
}

const Navigation: React.FC<NavigationProps> = ({ 
  className = '', 
  itemClassName = '',
  orientation = 'horizontal'
}) => {
  const containerClass = orientation === 'horizontal' ? 'flex space-x-8' : 'flex flex-col gap-8';
  
  return (
    <nav className={className}>
      <ul className={containerClass}>
        {NAVIGATION_ITEMS.map((item) => (
          <li key={item.href}>
            <Link 
              href={item.href} 
              className={`hover:underline ${itemClassName}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation; 