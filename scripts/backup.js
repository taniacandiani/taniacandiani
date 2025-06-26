#!/usr/bin/env node

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Backup script for Railway PostgreSQL
async function backupDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    console.log('🔄 Starting database backup...')
    
    // Get all navigation data
    const navigationResult = await pool.query('SELECT * FROM navigation')
    
    // Get all Payload CMS data (if tables exist)
    let payloadData = {}
    try {
      const usersResult = await pool.query('SELECT * FROM users')
      const pagesResult = await pool.query('SELECT * FROM pages')
      const postsResult = await pool.query('SELECT * FROM posts')
      const mediaResult = await pool.query('SELECT * FROM media')
      
      payloadData = {
        users: usersResult.rows,
        pages: pagesResult.rows,
        posts: postsResult.rows,
        media: mediaResult.rows
      }
    } catch (error) {
      console.log('ℹ️  Payload tables not found (this is normal for first backup)')
    }

    const backup = {
      timestamp: new Date().toISOString(),
      navigation: navigationResult.rows,
      payload: payloadData
    }

    // Save backup file
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`
    const filepath = path.join(backupDir, filename)
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2))
    
    console.log(`✅ Backup completed: ${filename}`)
    console.log(`📄 Navigation records: ${navigationResult.rows.length}`)
    console.log(`📄 Payload records: ${Object.values(payloadData).flat().length}`)
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run backup
if (require.main === module) {
  backupDatabase()
}

module.exports = { backupDatabase } 