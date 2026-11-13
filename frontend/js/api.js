// 모든 페이지에서 쓰는 공통 함수 (API 호출, 로그인 상태, 화면 도우미)

const TOKEN_KEY = 'blog_token';
const USER_KEY = 'blog_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function isLoggedIn() {
  return !!getToken();
}

function saveLogin(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// 2. Application Tier 호출 (nginx가 /api 를 backend로 전달해요)
async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch('/api' + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      logout();
      renderNav();
    }
    const err = new Error(data.error || '요청에 실패했습니다. (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  return data;
}

// 요소 만들기 도우미: 글자는 항상 textContent로 넣어서 XSS를 막아요
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

function formatDate(value) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function showMessage(container, message, type = 'error') {
  container.replaceChildren(el('p', { class: 'message ' + type, text: message }));
}

// 상단 메뉴바
function renderNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const links = [
    el('a', { href: 'index.html', text: 'Home' }),
    el('a', { href: 'about.html', text: 'About' }),
  ];
  if (isLoggedIn()) {
    links.push(el('a', { href: 'write.html', text: '글쓰기' }));
    links.push(el('a', {
      href: '#',
      text: '로그아웃 (' + (localStorage.getItem(USER_KEY) || '') + ')',
      onclick: (e) => {
        e.preventDefault();
        logout();
        location.href = 'index.html';
      },
    }));
  } else {
    links.push(el('a', { href: 'login.html', text: 'Login' }));
  }
  nav.replaceChildren(...links);
}

renderNav();
