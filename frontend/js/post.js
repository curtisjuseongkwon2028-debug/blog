// 글 상세 페이지: 본문, 수정/삭제(관리자), 댓글

const postId = getParam('id');

async function loadPost() {
  const box = document.getElementById('post');
  if (!postId) {
    showMessage(box, '글 번호가 없습니다.');
    return;
  }
  try {
    const post = await api('/posts/' + encodeURIComponent(postId));
    document.title = post.title + ' - My Blog';

    const article = el('article', {},
      el('h1', { text: post.title }),
      el('div', { class: 'meta', text: formatDate(post.created_at) + ' · ' + post.author + (post.category ? ' · ' + post.category : '') }),
      el('div', { class: 'post-content', text: post.content })
    );

    if (isLoggedIn()) {
      article.append(el('div', { class: 'actions' },
        el('a', { class: 'button', href: 'write.html?id=' + post.id, text: '수정' }),
        el('button', { class: 'danger', text: '삭제', onclick: deletePost })
      ));
    }

    box.replaceChildren(article);
    document.getElementById('comments-section').hidden = false;
    loadComments();
  } catch (err) {
    showMessage(box, err.message);
  }
}

async function deletePost() {
  if (!confirm('이 글을 삭제할까요? 댓글도 함께 삭제됩니다.')) return;
  try {
    await api('/posts/' + encodeURIComponent(postId), { method: 'DELETE' });
    location.href = 'index.html';
  } catch (err) {
    alert(err.message);
  }
}

async function loadComments() {
  const box = document.getElementById('comments');
  try {
    const comments = await api('/posts/' + encodeURIComponent(postId) + '/comments');
    document.getElementById('comment-count').textContent = '(' + comments.length + ')';

    if (comments.length === 0) {
      box.replaceChildren(el('p', { class: 'meta', text: '첫 댓글을 남겨보세요.' }));
      return;
    }

    box.replaceChildren(...comments.map((c) =>
      el('div', { class: 'comment' },
        el('div', { class: 'comment-head' },
          el('span', {},
            el('strong', { text: c.nickname }), ' ',
            el('span', { class: 'meta', text: formatDate(c.created_at) })
          ),
          isLoggedIn()
            ? el('button', { class: 'danger small', text: '삭제', onclick: () => deleteComment(c.id) })
            : null
        ),
        el('p', { text: c.content })
      )
    ));
  } catch (err) {
    showMessage(box, err.message);
  }
}

async function deleteComment(id) {
  if (!confirm('이 댓글을 삭제할까요?')) return;
  try {
    await api('/comments/' + id, { method: 'DELETE' });
    loadComments();
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('comment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.getElementById('comment-error');
  const button = form.querySelector('button');
  errorBox.replaceChildren();
  button.disabled = true;
  try {
    await api('/posts/' + encodeURIComponent(postId) + '/comments', {
      method: 'POST',
      body: {
        nickname: document.getElementById('nickname').value,
        content: document.getElementById('comment-content').value,
      },
    });
    document.getElementById('comment-content').value = '';
    loadComments();
  } catch (err) {
    showMessage(errorBox, err.message);
  } finally {
    button.disabled = false;
  }
});

loadPost();
