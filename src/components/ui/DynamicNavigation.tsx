import Link from 'next/link'

interface NavigationLink {
  id: string
  label: string
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
  // Static navigation items
  const navigationItems = [
    { id: 'nav-1', label: 'Proyectos', url: '/proyectos', openInNewTab: false, order: 1 },
    { id: 'nav-2', label: 'Noticias', url: '/noticias', openInNewTab: false, order: 2 },
    { id: 'nav-3', label: 'Acerca', url: '/acerca', openInNewTab: false, order: 3 },
    { id: 'nav-4', label: 'Contacto', url: '/contacto', openInNewTab: false, order: 4 },
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
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      

    </nav>
  )
}

export default DynamicNavigation 