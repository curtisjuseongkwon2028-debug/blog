// 메인 페이지: 카테고리, 글 목록, 페이지 번호

const page = Math.max(1, parseInt(getParam('page'), 10) || 1);
const category = getParam('category') || '';

function listUrl(p, cat) {
  const params = new URLSearchParams();
  if (p > 1) params.set('page', p);
  if (cat) params.set('category', cat);
  const qs = params.toString();
  return 'index.html' + (qs ? '?' + qs : '');
}

async function loadCategories() {
  const box = document.getElementById('categories');
  try {
    const categories = await api('/categories');
    const chips = [el('a', { href: listUrl(1, ''), class: 'chip' + (category ? '' : ' active'), text: '전체' })];
    for (const c of categories) {
      chips.push(el('a', {
        href: listUrl(1, c.category),
        class: 'chip' + (c.category === category ? ' active' : ''),
        text: c.category + ' (' + c.count + ')',
      }));
    }
    box.replaceChildren(...chips);
  } catch {
    box.replaceChildren();
  }
}

async function loadPosts() {
  const list = document.getElementById('posts');
  const pager = document.getElementById('pagination');
  try {
    const qs = new URLSearchParams({ page });
    if (category) qs.set('category', category);
    const data = await api('/posts?' + qs.toString());

    if (data.posts.length === 0) {
      showMessage(list, '아직 글이 없습니다.', 'info');
      pager.replaceChildren();
      return;
    }

    list.replaceChildren(...data.posts.map((post) =>
      el('a', { class: 'card', href: 'post.html?id=' + post.id },
        el('h2', { text: post.title }),
        el('div', { class: 'meta', text: formatDate(post.created_at) + (post.category ? ' · ' + post.category : '') }),
        el('p', { class: 'preview', text: post.preview + (post.preview.length >= 150 ? '…' : '') })
      )
    ));

    const items = [];
    if (data.page > 1) items.push(el('a', { href: listUrl(data.page - 1, category), text: '<' }));
    for (let p = 1; p <= data.totalPages; p++) {
      items.push(p === data.page
        ? el('span', { class: 'current', text: p })
        : el('a', { href: listUrl(p, category), text: p }));
    }
    if (data.page < data.totalPages) items.push(el('a', { href: listUrl(data.page + 1, category), text: '>' }));
    pager.replaceChildren(...items);
  } catch (err) {
    showMessage(list, err.message);
  }
}

loadCategories();
loadPosts();
