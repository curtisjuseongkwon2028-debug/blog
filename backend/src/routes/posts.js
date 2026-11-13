const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const PAGE_SIZE = 10;

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// 글 입력값 검사
function validatePost(body) {
  const { title, content, category } = body || {};
  if (typeof title !== 'string' || !title.trim()) return { error: '제목을 입력하세요.' };
  if (title.trim().length > 200) return { error: '제목은 200자 이하로 입력하세요.' };
  if (typeof content !== 'string' || !content.trim()) return { error: '본문을 입력하세요.' };
  if (content.length > 60000) return { error: '본문이 너무 깁니다.' };
  if (category != null && typeof category !== 'string') return { error: '카테고리가 올바르지 않습니다.' };
  const cat = (category || '').trim();
  if (cat.length > 50) return { error: '카테고리는 50자 이하로 입력하세요.' };
  return { title: title.trim(), content, category: cat || null };
}

// GET /api/posts?page=1&category=일상 → 글 목록
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const where = category ? 'WHERE category = ?' : '';
    const params = category ? [category] : [];

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM posts ${where}`, params);
    const [posts] = await pool.query(
      `SELECT id, title, LEFT(content, 150) AS preview, category, created_at
         FROM posts ${where}
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?`,
      [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE]
    );

    res.json({
      posts,
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      total,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id → 글 상세
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: '잘못된 글 번호입니다.' });

    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.content, p.category, p.created_at, p.updated_at, u.username AS author
         FROM posts p JOIN users u ON u.id = p.user_id
        WHERE p.id = ?`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts → 글 작성 (관리자)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = validatePost(req.body);
    if (data.error) return res.status(400).json({ error: data.error });

    const [result] = await pool.query(
      'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)',
      [req.user.id, data.title, data.content, data.category]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// PUT /api/posts/:id → 글 수정 (관리자)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: '잘못된 글 번호입니다.' });
    const data = validatePost(req.body);
    if (data.error) return res.status(400).json({ error: data.error });

    const [result] = await pool.query(
      'UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?',
      [data.title, data.content, data.category, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json({ id });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id → 글 삭제 (관리자, 댓글도 함께 삭제됨)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: '잘못된 글 번호입니다.' });

    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = { router, parseId };
