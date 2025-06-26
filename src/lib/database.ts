import { Pool } from 'pg'

// In-memory storage for development
let inMemoryData = [
  {
    id: '1',
    title: 'Footer Menu',
    area: 'footer',
    links: [
      {
        id: 'link-1',
        label: 'Proyectos',
        url: '/proyectos',
        openInNewTab: false,
        order: 1,
      },
      {
        id: 'link-2',
        label: 'Noticias',
        url: '/noticias',
        openInNewTab: false,
        order: 2,
      },
      {
        id: 'link-3',
        label: 'Acerca',
        url: '/acerca',
        openInNewTab: false,
        order: 3,
      },
      {
        id: 'link-4',
        label: 'Contacto',
        url: '/contacto',
        openInNewTab: false,
        order: 4,
      },
    ],
    isActive: true,
  },
]

// PostgreSQL connection (for production)
let pool: Pool | null = null

const getPool = () => {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  }
  return pool
}

// Database initialization
export const initDatabase = async () => {
  const dbPool = getPool()
  if (!dbPool) return

  try {
    // Create tables if they don't exist
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS navigation (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        area VARCHAR(50) NOT NULL,
        links JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Check if data exists, if not, seed with default data
    const result = await dbPool.query('SELECT COUNT(*) FROM navigation')
    const count = parseInt(result.rows[0].count)

    if (count === 0) {
      // Seed with default navigation data
      await dbPool.query(`
        INSERT INTO navigation (id, title, area, links, is_active) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        inMemoryData[0].id,
        inMemoryData[0].title,
        inMemoryData[0].area,
        JSON.stringify(inMemoryData[0].links),
        inMemoryData[0].isActive
      ])
      console.log('✅ Database seeded with default navigation data')
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error)
  }
}

// Data access functions
export const getNavigationData = async () => {
  const dbPool = getPool()
  
  if (dbPool) {
    // Use PostgreSQL in production
    try {
      const result = await dbPool.query('SELECT * FROM navigation ORDER BY created_at')
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        area: row.area,
        links: row.links,
        isActive: row.is_active
      }))
    } catch (error) {
      console.error('❌ Database query error:', error)
      return inMemoryData // Fallback to in-memory
    }
  } else {
    // Use in-memory storage in development
    return inMemoryData
  }
}

export const updateNavigationData = async (navId: string, updates: any) => {
  const dbPool = getPool()
  
  if (dbPool) {
    // Update in PostgreSQL
    try {
      await dbPool.query(`
        UPDATE navigation 
        SET links = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `, [JSON.stringify(updates.links), navId])
      return await getNavigationData()
    } catch (error) {
      console.error('❌ Database update error:', error)
      return null
    }
  } else {
    // Update in-memory storage
    const navIndex = inMemoryData.findIndex(nav => nav.id === navId)
    if (navIndex !== -1) {
      inMemoryData[navIndex] = { ...inMemoryData[navIndex], ...updates }
    }
    return inMemoryData
  }
}

export const addNavigationLink = async (navId: string, newLink: any) => {
  const dbPool = getPool()
  
  if (dbPool) {
    // Add to PostgreSQL
    try {
      const currentData = await getNavigationData()
      const nav = currentData.find(n => n.id === navId)
      if (nav) {
        const updatedLinks = [...nav.links, newLink]
        await dbPool.query(`
          UPDATE navigation 
          SET links = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `, [JSON.stringify(updatedLinks), navId])
      }
      return await getNavigationData()
    } catch (error) {
      console.error('❌ Database add link error:', error)
      return null
    }
  } else {
    // Add to in-memory storage
    const nav = inMemoryData.find(n => n.id === navId)
    if (nav) {
      nav.links.push(newLink)
    }
    return inMemoryData
  }
}

export const deleteNavigationLink = async (navId: string, linkId: string) => {
  const dbPool = getPool()
  
  if (dbPool) {
    // Delete from PostgreSQL
    try {
      const currentData = await getNavigationData()
      const nav = currentData.find(n => n.id === navId)
      if (nav) {
        const updatedLinks = nav.links.filter((link: any) => link.id !== linkId)
        // Reorder remaining links
        updatedLinks.forEach((link: any, index: number) => {
          link.order = index + 1
        })
        await dbPool.query(`
          UPDATE navigation 
          SET links = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `, [JSON.stringify(updatedLinks), navId])
      }
      return await getNavigationData()
    } catch (error) {
      console.error('❌ Database delete link error:', error)
      return null
    }
  } else {
    // Delete from in-memory storage
    const nav = inMemoryData.find(n => n.id === navId)
    if (nav) {
      nav.links = nav.links.filter((link: any) => link.id !== linkId)
      nav.links.forEach((link: any, index: number) => {
        link.order = index + 1
      })
    }
    return inMemoryData
  }
}

export const updateNavigationLink = async (navId: string, linkId: string, updates: any) => {
  const dbPool = getPool()
  
  if (dbPool) {
    // Update in PostgreSQL
    try {
      const currentData = await getNavigationData()
      const nav = currentData.find(n => n.id === navId)
      if (nav) {
        const linkIndex = nav.links.findIndex((link: any) => link.id === linkId)
        if (linkIndex !== -1) {
          nav.links[linkIndex] = { ...nav.links[linkIndex], ...updates }
          await dbPool.query(`
            UPDATE navigation 
            SET links = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2
          `, [JSON.stringify(nav.links), navId])
        }
      }
      return await getNavigationData()
    } catch (error) {
      console.error('❌ Database update link error:', error)
      return null
    }
  } else {
    // Update in-memory storage
    const nav = inMemoryData.find(n => n.id === navId)
    if (nav) {
      const linkIndex = nav.links.findIndex((link: any) => link.id === linkId)
      if (linkIndex !== -1) {
        nav.links[linkIndex] = { ...nav.links[linkIndex], ...updates }
      }
    }
    return inMemoryData
  }
} 