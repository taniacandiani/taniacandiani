'use client';

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

interface NavigationLink {
  id: string
  label: string
  label_en: string
  url: string
  openInNewTab: boolean
  order: number
}

interface DynamicNavigationProps {
  className?: string
  itemClassName?: string
  orientation?: 'horizontal' | 'vertical'
  area?: 'footer' | 'header' | 'sidebar'
}

const DynamicNavigation: React.FC<DynamicNavigationProps> = ({
  className = '',
  itemClassName = '',
  orientation = 'horizontal',
  area = 'footer'
}) => {
  const { language } = useLanguage();

  // Static navigation items
  const navigationItems = [
    { id: 'nav-1', label: 'Proyectos', label_en: 'Projects', url: '/proyectos', openInNewTab: false, order: 1 },
    { id: 'nav-2', label: 'Noticias', label_en: 'News', url: '/noticias', openInNewTab: false, order: 2 },
    { id: 'nav-3', label: 'Acerca', label_en: 'About', url: '/acerca', openInNewTab: false, order: 3 },
    { id: 'nav-4', label: 'Contacto', label_en: 'Contact', url: '/contacto', openInNewTab: false, order: 4 },
  ]

  const containerClass = orientation === 'horizontal' ? 'flex space-x-8' : 'flex flex-col gap-8'

  // Sort links by order
  const sortedLinks = [...navigationItems].sort((a, b) => a.order - b.order)

  if (sortedLinks.length === 0) {
    return null
  }

  return (
    <nav className={className}>
      <ul className={containerClass}>
        {sortedLinks.map((link) => (
          <li key={link.id}>
            <Link
              href={link.url}
              target={link.openInNewTab ? '_blank' : undefined}
              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
              className={`hover:underline ${itemClassName}`}
            >
              {language === 'en' ? link.label_en : link.label}
            </Link>
          </li>
        ))}
      </ul>


    </nav>
  )
}

export default DynamicNavigation 