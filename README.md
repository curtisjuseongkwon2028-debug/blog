# My Blog (3-Tier Architecture)

| 계층 | 폴더 | 기술 | 컨테이너 |
|------|------|------|----------|
| 1. Presentation | `frontend/` | Nginx + HTML/CSS/JS | `frontend` (포트 8080 공개) |
| 2. Application | `backend/` | Node.js + Express | `backend` (내부 3000) |
| 3. Data | `database/` | MySQL 8 | `db` (내부 3306) |

자세한 설계는 [PLAN.md](PLAN.md)를 참고하세요.

## 실행 방법

1. 사전 준비: WSL 설치(`wsl --install`, 관리자 PowerShell) → 재부팅 → Docker Desktop 실행 → `docker ps`로 확인
2. `.env` 파일 준비 (없으면 `.env.example`을 복사해서 값 변경)
3. 실행
   ```bash
   cd blog
   docker compose up -d --build
   ```
4. 브라우저에서 http://localhost:8080 접속
5. 관리자 로그인: `.env`의 `ADMIN_USERNAME` / `ADMIN_PASSWORD`

## 자주 쓰는 명령어

```bash
docker compose ps                 # 컨테이너 상태
docker compose logs -f backend    # 백엔드 로그 보기
docker compose down               # 종료 (데이터 유지)
docker compose down -v            # 종료 + DB 데이터 삭제 (처음부터 다시)
```

## 참고
- 관리자 계정과 샘플 글 3개는 백엔드가 처음 실행될 때 자동으로 만들어요. (비밀번호를 bcrypt로 암호화해야 해서 `init.sql` 대신 `backend/src/seed.js`에서 처리)
- 관리자 계정이 만들어진 뒤에 `.env`의 `ADMIN_PASSWORD`를 바꿔도 기존 비밀번호는 바뀌지 않아요. 바꾸려면 `docker compose down -v`로 DB를 초기화하세요.
- 계획서의 `bcrypt` 대신 `bcryptjs`를 사용했어요. 같은 방식인데 순수 JavaScript라서 Docker 빌드가 더 간단해요.
