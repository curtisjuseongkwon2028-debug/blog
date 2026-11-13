// 2. Application Tier: Express API 서버
const express = require('express');
const { pool, waitForDb } = require('./db');
const { seed } = require('./seed');
const { router: postsRouter } = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const authRouter = require('./routes/auth');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET 환경변수를 설정하세요.');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// GET /api/health → 서버 상태 확인
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

// GET /api/categories → 카테고리 목록 (메뉴용)
app.get('/api/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT category, COUNT(*) AS count FROM posts WHERE category IS NOT NULL GROUP BY category ORDER BY category'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api', commentsRouter);

app.use('/api', (req, res) => res.status(404).json({ error: '존재하지 않는 API입니다.' }));

// 에러 처리
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: '요청 형식이 올바르지 않습니다.' });
  }
  console.error(err);
  res.status(500).json({ error: '서버 오류가 발생했습니다.' });
});

async function start() {
  await waitForDb();
  await seed();
  app.listen(3000, () => console.log('API 서버 실행: http://localhost:3000'));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
