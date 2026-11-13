// 로그인 페이지

// 로그인 후 돌아갈 페이지 (우리 사이트의 .html 페이지만 허용)
function nextPage() {
  const next = getParam('next') || '';
  return /^[a-z]+\.html(\?[\w=&%-]*)?$/.test(next) ? next : 'index.html';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('login-error');
  const button = e.target.querySelector('button');
  errorBox.replaceChildren();
  button.disabled = true;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
      },
    });
    saveLogin(data.token, data.username);
    location.href = nextPage();
  } catch (err) {
    showMessage(errorBox, err.message);
    button.disabled = false;
  }
});
