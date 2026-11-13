// MySQL 연결 (3. Data Tier 와 통신)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'blog',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});

// DB가 완전히 준비될 때까지 기다리기 (테이블이 생길 때까지 재시도)
async function waitForDb(retries = 30, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1 FROM posts LIMIT 1');
      return;
    } catch (err) {
      console.log(`DB 대기 중... (${i}/${retries}) ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('DB에 연결할 수 없습니다.');
}

module.exports = { pool, waitForDb };
