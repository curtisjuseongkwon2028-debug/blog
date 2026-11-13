// 처음 실행할 때 관리자 계정과 샘플 글 만들기
// (비밀번호를 bcrypt로 암호화해야 해서 init.sql 대신 여기서 처리해요)
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

async function seed() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  let adminId = users[0] && users[0].id;

  if (!adminId) {
    if (!password) {
      throw new Error('ADMIN_PASSWORD 환경변수를 설정하세요.');
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hash]
    );
    adminId = result.insertId;
    console.log(`관리자 계정 생성: ${username}`);
  }

  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM posts');
  if (count === 0) {
    const samples = [
      ['블로그를 시작합니다', '안녕하세요! 3-Tier Architecture로 만든 첫 블로그입니다.\n\n화면(Nginx) → 로직(Express) → 데이터(MySQL) 세 계층으로 나뉘어 있어요.', '일상'],
      ['3-Tier Architecture란?', '웹 서비스를 Presentation, Application, Data 세 계층으로 나누는 구조입니다.\n\n각 계층은 바로 옆 계층과만 통신하기 때문에 역할이 분명하고, 보안과 확장에 유리해요.', '공부'],
      ['Docker Compose로 실행하기', 'docker compose up -d --build 명령어 하나로 세 개의 컨테이너가 모두 실행됩니다.', '공부'],
    ];
    for (const [title, content, category] of samples) {
      await pool.query(
        'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)',
        [adminId, title, content, category]
      );
    }
    console.log('샘플 글 3개 생성');
  }
}

module.exports = { seed };
