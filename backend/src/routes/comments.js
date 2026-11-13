const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { parseId } = require('./posts');

const router = express.Router();

// GET /api/posts/:id/comments → 댓글 목록
router.get('/posts/:id/comments', async (req, res, next) => {
  try {
    const postId = parseId(req.params.id);
    if (!postId) return res.status(400).json({ error: '잘못된 글 번호입니다.' });

    const [rows] = await pool.query(
      'SELECT id, nickname, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC, id ASC',
      [postId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/comments → 댓글 작성 (누구나)
router.post('/posts/:id/comments', async (req, res, next) => {
  try {
    const postId = parseId(req.params.id);
    if (!postId) return res.status(400).json({ error: '잘못된 글 번호입니다.' });

    const { nickname, content } = req.body || {};
    if (typeof nickname !== 'string' || !nickname.trim()) {
      return res.status(400).json({ error: '닉네임을 입력하세요.' });
    }
    if (nickname.trim().length > 50) {
      return res.status(400).json({ error: '닉네임은 50자 이하로 입력하세요.' });
    }
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: '댓글 내용을 입력하세요.' });
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ error: '댓글은 1000자 이하로 입력하세요.' });
    }

    const [posts] = await pool.query('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!posts[0]) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });

    const [result] = await pool.query(
      'INSERT INTO comments (post_id, nickname, content) VALUES (?, ?, ?)',
      [postId, nickname.trim(), content.trim()]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:id → 댓글 삭제 (관리자)
router.delete('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: '잘못된 댓글 번호입니다.' });

    const [result] = await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
