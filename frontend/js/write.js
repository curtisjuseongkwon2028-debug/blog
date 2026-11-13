// 글쓰기 / 수정 페이지 (관리자 전용)

const editId = getParam('id');

if (!isLoggedIn()) {
  location.href = 'login.html?next=' + encodeURIComponent(location.pathname.slice(1) + location.search);
}

const form = document.getElementById('write-form');
const errorBox = document.getElementById('write-error');
const submitButton = document.getElementById('submit-button');

async function loadForEdit() {
  document.getElementById('page-title').textContent = '글 수정';
  submitButton.textContent = '수정 완료';
  try {
    const post = await api('/posts/' + encodeURIComponent(editId));
    document.getElementById('title').value = post.title;
    document.getElementById('category').value = post.category || '';
    document.getElementById('content').value = post.content;
  } catch (err) {
    showMessage(errorBox, err.message);
    submitButton.disabled = true;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.replaceChildren();
  submitButton.disabled = true;

  const body = {
    title: document.getElementById('title').value,
    category: document.getElementById('category').value,
    content: document.getElementById('content').value,
  };

  try {
    const result = editId
      ? await api('/posts/' + encodeURIComponent(editId), { method: 'PUT', body })
      : await api('/posts', { method: 'POST', body });
    location.href = 'post.html?id=' + result.id;
  } catch (err) {
    showMessage(errorBox, err.message);
    if (err.status === 401) {
      location.href = 'login.html?next=' + encodeURIComponent(location.pathname.slice(1) + location.search);
    }
    submitButton.disabled = false;
  }
});

if (editId) loadForEdit();
