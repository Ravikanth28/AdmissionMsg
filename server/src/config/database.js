const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    const dbUrl = process.env.TIDB_URL;
    if (dbUrl) {
      // Parse connection URL: mysql://user:pass@host:port/database
      const url = new URL(dbUrl);
      pool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port) || 4000,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace('/', ''),
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    } else {
      pool = mysql.createPool({
        host: process.env.TIDB_HOST,
        port: parseInt(process.env.TIDB_PORT) || 4000,
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
  }
  return pool;
}

async function initDatabase() {
  const db = getPool();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      message_text TEXT,
      status ENUM('draft', 'reviewing', 'sending', 'completed', 'paused', 'failed') DEFAULT 'draft',
      batch_size INT DEFAULT 10,
      batch_delay_seconds INT DEFAULT 60,
      total_contacts INT DEFAULT 0,
      sent_count INT DEFAULT 0,
      failed_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS campaign_media (
      id VARCHAR(36) PRIMARY KEY,
      campaign_id VARCHAR(36) NOT NULL,
      media_type ENUM('image', 'video', 'document', 'pdf') NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      cloudinary_url TEXT NOT NULL,
      cloudinary_public_id VARCHAR(255) NOT NULL,
      file_size BIGINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_campaign_id (campaign_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id VARCHAR(36) PRIMARY KEY,
      campaign_id VARCHAR(36) NOT NULL,
      name VARCHAR(255),
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(255),
      status ENUM('pending', 'sent', 'failed', 'skipped') DEFAULT 'pending',
      error_message TEXT,
      sent_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_campaign_id (campaign_id),
      INDEX idx_status (status)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(36) PRIMARY KEY,
      campaign_id VARCHAR(36) NOT NULL,
      total_contacts INT DEFAULT 0,
      sent_count INT DEFAULT 0,
      failed_count INT DEFAULT 0,
      skipped_count INT DEFAULT 0,
      start_time TIMESTAMP NULL,
      end_time TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_campaign_id (campaign_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS message_templates (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      message_text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS template_media (
      id VARCHAR(36) PRIMARY KEY,
      template_id VARCHAR(36) NOT NULL,
      media_type ENUM('image', 'video', 'document', 'pdf') NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      cloudinary_url TEXT NOT NULL,
      cloudinary_public_id VARCHAR(255) NOT NULL,
      file_size BIGINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_template_id (template_id)
    )
  `);

  console.log('All tables created/verified');
}

module.exports = { getPool, initDatabase };
