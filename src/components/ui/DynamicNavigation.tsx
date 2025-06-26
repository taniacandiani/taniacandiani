'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface NavigationLink {
  id: string
  label: string
  url: string
  openInNewTab: boolean
  order: number
}

interface NavigationData {
  id: string
  title: string
  area: string
  links: NavigationLink[]
  isActive: boolean
}

interface DynamicNavigationProps {
  className?: string
  itemClassName?: string
  orientation?: 'horizontal' | 'vertical'
  area?: 'footer' | 'header' | 'sidebar'
  fallback?: boolean
}

const DynamicNavigation: React.FC<DynamicNavigationProps> = ({ 
  className = '', 
  itemClassName = '',
  orientation = 'horizontal',
  area = 'footer',
  fallback = true
}) => {
  const [navigationData, setNavigationData] = useState<NavigationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Fallback navigation items
  const fallbackItems = [
    { id: 'fallback-1', label: 'Proyectos', url: '/proyectos', openInNewTab: false, order: 1 },
    { id: 'fallback-2', label: 'Noticias', url: '/noticias', openInNewTab: false, order: 2 },
    { id: 'fallback-3', label: 'Acerca', url: '/acerca', openInNewTab: false, order: 3 },
    { id: 'fallback-4', label: 'Contacto', url: '/contacto', openInNewTab: false, order: 4 },
  ]

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const response = await fetch('/api/navigation')
        if (!response.ok) throw new Error('Failed to fetch navigation')
        
        const result = await response.json()
        setNavigationData(result.data || [])
        setError(false)
      } catch (err) {
        console.error('Error fetching navigation:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchNavigation()
  }, [])

  const containerClass = orientation === 'horizontal' ? 'flex space-x-8' : 'flex flex-col gap-8'

  // Show loading state
  if (loading) {
    return (
      <nav className={className}>
        <div className={containerClass}>
          <div className="animate-pulse">Loading menu...</div>
        </div>
      </nav>
    )
  }

  // Filter navigation data by area and get active items
  const activeNavigation = navigationData.find(nav => 
    nav.area === area && nav.isActive
  )

  // Use fallback if no data found and fallback is enabled
  const linksToRender = activeNavigation?.links || (fallback ? fallbackItems : [])

  // Sort links by order
  const sortedLinks = [...linksToRender].sort((a, b) => a.order - b.order)

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