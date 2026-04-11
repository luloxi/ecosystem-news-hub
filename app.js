const summaryEl = document.getElementById('summary');
const topicsEl = document.getElementById('topics');
const generatedAtEl = document.getElementById('generatedAt');
const refreshButton = document.getElementById('refreshButton');
const topicTemplate = document.getElementById('topicTemplate');
const itemTemplate = document.getElementById('itemTemplate');

async function loadNews() {
  const response = await fetch('./data/news.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load news.json (${response.status})`);
  return response.json();
}

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function normalizeText(text = '') {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[“”‘’"']/g, '')
    .replace(/[–—-]/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldShowSummary(item) {
  const title = normalizeText(item.title);
  const summary = normalizeText(item.summary);
  if (!summary) return false;
  if (summary === title) return false;
  if (summary.startsWith(title)) return false;
  return true;
}

function renderSummary(data) {
  const totalItems = data.topics.reduce((sum, topic) => sum + topic.items.length, 0);
  const freshItems = data.topics.reduce((sum, topic) => sum + topic.freshCount, 0);

  summaryEl.innerHTML = `
    <div class="summary-card">
      <strong>${data.topics.length}</strong>
      <span>tracked topics</span>
    </div>
    <div class="summary-card">
      <strong>${totalItems}</strong>
      <span>articles collected</span>
    </div>
    <div class="summary-card summary-card--accent">
      <strong>${freshItems}</strong>
      <span>published in the last 24h</span>
    </div>
  `;

  generatedAtEl.textContent = `Last refresh: ${new Date(data.generatedAt).toLocaleString()}`;
}

function renderTopics(data) {
  topicsEl.innerHTML = '';

  for (const topic of data.topics) {
    const node = topicTemplate.content.cloneNode(true);
    const article = node.querySelector('.topic-card');
    node.querySelector('.topic-card__eyebrow').textContent = topic.key;
    node.querySelector('h2').textContent = topic.label;
    node.querySelector('.topic-card__description').textContent = topic.description;
    node.querySelector('.badge').textContent = `${topic.freshCount} fresh`;

    const itemsEl = node.querySelector('.topic-card__items');
    const errorsEl = node.querySelector('.topic-card__errors');
    const errorsList = errorsEl.querySelector('ul');

    if (!topic.errors?.length) {
      errorsEl.remove();
    } else {
      for (const err of topic.errors) {
        const li = document.createElement('li');
        li.textContent = `${err.feed} — ${err.error}`;
        errorsList.appendChild(li);
      }
    }

    if (!topic.items.length) {
      const empty = document.createElement('p');
      empty.className = 'topic-card__empty';
      empty.textContent = 'No items pulled this round.';
      itemsEl.appendChild(empty);
    } else {
      for (const item of topic.items) {
        const itemNode = itemTemplate.content.cloneNode(true);
        const link = itemNode.querySelector('.news-item');
        link.href = item.link;
        itemNode.querySelector('h3').textContent = item.title;
        const summaryEl = itemNode.querySelector('.news-item__summary');
        if (shouldShowSummary(item)) {
          summaryEl.textContent = item.summary;
        } else {
          summaryEl.remove();
        }
        itemNode.querySelector('.news-item__source').textContent = item.source;
        itemNode.querySelector('.news-item__age').textContent = timeAgo(item.publishedAt);
        itemNode.querySelector('.news-item__fresh').textContent = item.isFresh ? 'fresh' : 'older';
        itemsEl.appendChild(itemNode);
      }
    }

    topicsEl.appendChild(article);
  }
}

async function render() {
  try {
    const data = await loadNews();
    renderSummary(data);
    renderTopics(data);
  } catch (error) {
    summaryEl.innerHTML = `<div class="summary-card summary-card--error">${error.message}</div>`;
    topicsEl.innerHTML = '';
  }
}

refreshButton.addEventListener('click', render);
render();
