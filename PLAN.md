# 블로그 웹사이트 계획서 (3-Tier Architecture)

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | My Blog |
| 목적 | 3계층 구조(3-Tier Architecture)를 이해하고 실제로 동작하는 블로그를 만든다 |
| 주요 기능 | 글 목록, 글 읽기, 글 쓰기/수정/삭제, 댓글, 관리자 로그인 |
| 실행 환경 | Docker Compose (컨테이너 3개 = 계층 3개) |
| 진행 상태 | 코드 작성 완료, 실행 테스트 전 (Docker 실행 환경 준비 필요) |

---

## 2. 3-Tier Architecture란?

웹 서비스를 **역할에 따라 3개 계층으로 나누는 구조**예요. 각 계층은 바로 옆 계층과만 통신해요.

```
 ┌──────────────────────┐
 │  사용자 (브라우저)      │
 └──────────┬───────────┘
            │ HTTP (80)
 ┌──────────▼───────────┐
 │ 1. Presentation Tier │  Nginx + HTML/CSS/JavaScript
 │    (화면 계층)         │  - 화면 보여주기
 └──────────┬───────────┘  - /api 요청은 2계층으로 전달
            │ HTTP (3000) /api/*
 ┌──────────▼───────────┐
 │ 2. Application Tier  │  Node.js + Express
 │    (로직 계층)         │  - 요청 검증, 로그인 확인
 └──────────┬───────────┘  - DB에서 데이터 읽고 쓰기
            │ SQL (3306)
 ┌──────────▼───────────┐
 │ 3. Data Tier         │  MySQL 8
 │    (데이터 계층)       │  - 글, 댓글, 사용자 저장
 └──────────────────────┘
```

**나누는 이유**
- **역할 분리**: 화면을 바꿔도 DB는 건드리지 않아도 돼요.
- **보안**: DB는 외부에 직접 노출되지 않고 2계층만 접근할 수 있어요.
- **확장성**: 사용자가 많아지면 필요한 계층만 늘리면 돼요.

---

## 3. 기술 스택

| 계층 | 기술 | 선택 이유 |
|------|------|-----------|
| Presentation | HTML, CSS, JavaScript (fetch), Nginx | 수업에서 배운 HTML/CSS를 그대로 활용 |
| Application | Node.js 20, Express, mysql2, bcryptjs, jsonwebtoken | JavaScript 하나로 프론트·백엔드 모두 작성 (bcryptjs는 순수 JS라 Docker 빌드가 간단) |
| Data | MySQL 8 | 가장 널리 쓰이는 관계형 DB |
| 인프라 | Docker, Docker Compose | 명령어 하나로 3계층 전체 실행 |

---

## 4. 기능 명세

### 4.1 일반 사용자
- 메인 페이지에서 글 목록 보기 (최신순, 페이지당 10개)
- 글 상세 보기
- 댓글 작성 (닉네임 + 내용)
- 카테고리별 글 보기

### 4.2 관리자
- 로그인 / 로그아웃
- 글 작성, 수정, 삭제
- 댓글 삭제

---

## 5. 화면 구성 (Presentation Tier)

| 페이지 | 파일 | 내용 |
|--------|------|------|
| 메인 | `index.html` | 헤더, 메뉴바, 글 목록 카드, 페이지 번호 |
| 글 상세 | `post.html?id=1` | 제목, 작성일, 본문, 댓글 목록, 댓글 입력창 |
| 글쓰기/수정 | `write.html` | 제목, 카테고리, 본문 입력 폼 (관리자만) |
| 로그인 | `login.html` | 아이디, 비밀번호 입력 |
| 소개 | `about.html` | 블로그와 3계층 구조 소개 |

```
┌─────────────────────────────────────┐
│  My Blog          Home  About Login │  ← 메뉴바
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ 글 제목                         │  │
│  │ 2026-11-06 · 카테고리            │  │  ← 글 카드
│  │ 본문 미리보기...                 │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ ...                            │  │
│  └───────────────────────────────┘  │
│            < 1 2 3 >                │
├─────────────────────────────────────┤
│  © 2026 My Blog                     │
└─────────────────────────────────────┘
```

---

## 6. API 설계 (Application Tier)

| 메서드 | 경로 | 설명 | 로그인 필요 |
|--------|------|------|:---:|
| GET | `/api/posts?page=1` | 글 목록 | |
| GET | `/api/posts/:id` | 글 상세 | |
| POST | `/api/posts` | 글 작성 | ✅ |
| PUT | `/api/posts/:id` | 글 수정 | ✅ |
| DELETE | `/api/posts/:id` | 글 삭제 | ✅ |
| GET | `/api/posts/:id/comments` | 댓글 목록 | |
| POST | `/api/posts/:id/comments` | 댓글 작성 | |
| DELETE | `/api/comments/:id` | 댓글 삭제 | ✅ |
| POST | `/api/auth/login` | 로그인 → JWT 토큰 발급 | |
| GET | `/api/categories` | 카테고리 목록과 글 개수 (메뉴용) | |
| GET | `/api/health` | 서버 상태 확인 | |

응답 예시 (`GET /api/posts/1`):
```json
{
  "id": 1,
  "title": "첫 번째 글",
  "content": "안녕하세요!",
  "category": "일상",
  "created_at": "2026-11-06T12:00:00Z"
}
```

---

## 7. 데이터베이스 설계 (Data Tier)

```
users 1 ──── N posts 1 ──── N comments
```

```sql
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,          -- bcrypt로 암호화
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  title      VARCHAR(200) NOT NULL,
  content    TEXT NOT NULL,
  category   VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  nickname   VARCHAR(50) NOT NULL,
  content    VARCHAR(1000) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
```

> 관리자 계정과 샘플 글 3개는 `init.sql`이 아니라 백엔드(`seed.js`)가 처음 실행될 때 만들어요. 비밀번호를 bcrypt로 암호화해서 저장해야 하기 때문이에요.

---

## 8. 폴더 구조

```
blog/
├── docker-compose.yml        # 3계층을 한 번에 실행
├── .env                      # DB 비밀번호 등 (Git에 올리지 않음)
├── .env.example              # .env 예시
├── README.md                 # 실행 방법
├── frontend/                 # 1. Presentation Tier
│   ├── Dockerfile
│   ├── nginx.conf            # /api → backend:3000 으로 전달
│   ├── index.html
│   ├── post.html
│   ├── write.html
│   ├── login.html
│   ├── about.html
│   ├── css/style.css
│   └── js/
│       ├── api.js            # fetch 공통 함수, 메뉴바
│       ├── main.js           # 글 목록
│       ├── post.js           # 글 상세, 댓글
│       ├── write.js          # 글쓰기/수정
│       └── login.js          # 로그인
├── backend/                  # 2. Application Tier
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── db.js             # MySQL 연결
│       ├── seed.js           # 관리자 계정, 샘플 글 생성
│       ├── routes/
│       │   ├── posts.js
│       │   ├── comments.js
│       │   └── auth.js
│       └── middleware/auth.js  # JWT 확인
└── database/                 # 3. Data Tier
    └── init.sql              # 테이블 생성
```

---

## 9. Docker 구성

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["8080:80"]          # 외부에 공개되는 유일한 포트
    depends_on: [backend]

  backend:
    build: ./backend
    environment:
      DB_HOST: db
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      db: { condition: service_healthy }

  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: blog
    volumes:
      - db-data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]

volumes:
  db-data:
```

포인트: `backend`와 `db`에는 `ports`가 없어서 **외부에서 직접 접근할 수 없어요.** 브라우저는 frontend(8080)에만 접속할 수 있어요.

---

## 10. 보안 고려사항
- 비밀번호는 bcrypt로 해시해서 저장해요 (평문 저장 금지).
- SQL은 `?` 플레이스홀더를 사용해 SQL Injection을 막아요.
- 댓글을 화면에 출력할 때는 `textContent`를 써서 XSS를 막아요.
- DB 비밀번호와 JWT 키는 `.env`에 두고 Git에 올리지 않아요.

---

## 11. 개발 일정 (예시: 4주)

| 주차 | 작업 | 결과물 |
|------|------|--------|
| 0 | 환경 준비: WSL 설치(`wsl --install`), Docker Desktop 실행 확인 | `docker ps` 정상 동작 |
| 1 | Data Tier: `init.sql` 작성, MySQL 컨테이너 실행 | 테이블 생성 확인 |
| 2 | Application Tier: Express API 구현, Postman으로 테스트 | API 10개 동작 |
| 3 | Presentation Tier: HTML/CSS 화면, fetch로 API 연결 | 4개 페이지 완성 |
| 4 | 로그인/권한, Docker Compose 통합, 테스트 및 발표 준비 | `docker compose up` 한 번으로 실행 |

---

## 12. 실행 방법 (완성 후)

```bash
cd blog
cp .env.example .env      # 비밀번호 설정
docker compose up -d --build
# 브라우저에서 http://localhost:8080 접속
```

---

## 13. 확장 아이디어
- 이미지 업로드 (글에 사진 첨부)
- 검색 기능 (제목·본문)
- 조회수, 좋아요
- 클라우드 배포 (AWS: EC2 + RDS)
