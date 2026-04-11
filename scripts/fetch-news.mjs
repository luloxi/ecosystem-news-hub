import fs from 'node:fs/promises';
import path from 'node:path';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 20000 });
const outputPath = path.resolve('data/news.json');
const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;

const topics = [
  {
    key: 'midnight-network',
    label: 'Midnight Network',
    description: 'Privacy-preserving blockchain and official ecosystem coverage.',
    feeds: [
      'https://news.google.com/rss/search?q=%22Midnight+Network%22+OR+site:midnight.network+when:7d&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=site:forum.midnight.network+Midnight+when:7d&hl=en-US&gl=US&ceid=US:en'
    ]
  },
  {
    key: 'cardano',
    label: 'Cardano',
    description: 'Cardano ecosystem, governance, and protocol news.',
    feeds: [
      'https://news.google.com/rss/search?q=Cardano+when:7d&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=site:cardano.org+Cardano+when:7d&hl=en-US&gl=US&ceid=US:en'
    ]
  },
  {
    key: 'midnight-city',
    label: 'Midnight City',
    description: 'Simulation/demo environment and related ecosystem chatter.',
    feeds: [
      'https://news.google.com/rss/search?q=%22Midnight+City%22+Cardano+OR+site:midnight.city+when:14d&hl=en-US&gl=US&ceid=US:en'
    ]
  },
  {
    key: 'iog',
    label: 'Input Output Global',
    description: 'Official IOG announcements and related coverage.',
    feeds: [
      'https://news.google.com/rss/search?q=%22Input+Output+Global%22+OR+IOG+Cardano+when:7d&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=site:iohk.io+%22Input+Output%22+when:7d&hl=en-US&gl=US&ceid=US:en'
    ]
  },
  {
    key: 'intersect',
    label: 'Intersect',
    description: 'Governance, budget, and organizational updates from Intersect.',
    feeds: [
      'https://news.google.com/rss/search?q=Intersect+Cardano+when:7d&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=site:intersectmbo.org+Intersect+when:14d&hl=en-US&gl=US&ceid=US:en'
    ]
  },
  {
    key: 'charles-hoskinson',
    label: 'Charles Hoskinson',
    description: 'Charles Hoskinson activity, interviews, and ecosystem commentary.',
    feeds: [
      'https://news.google.com/rss/search?q=%22Charles+Hoskinson%22+when:7d&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=site:youtube.com+%22Charles+Hoskinson%22+when:7d&hl=en-US&gl=US&ceid=US:en'
    ]
  }
];

function normalizeItem(item, topicKey) {
  const iso = item.isoDate || item.pubDate || new Date().toISOString();
  const publishedAt = new Date(iso).toISOString();
  const ageHours = Math.round((now - new Date(publishedAt)) / (60 * 60 * 1000));
  return {
    topicKey,
    title: item.title?.trim() || 'Untitled',
    link: item.link,
    source: item.source?.title || item.creator || 'Unknown source',
    publishedAt,
    ageHours,
    isFresh: now - new Date(publishedAt) <= dayMs,
    summary: item.contentSnippet?.trim() || item.content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || ''
  };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}::${item.link}`;
    if (!item.link || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchTopic(topic) {
  const collected = [];
  const errors = [];

  for (const feed of topic.feeds) {
    try {
      const parsed = await parser.parseURL(feed);
      collected.push(...(parsed.items || []).map((item) => normalizeItem(item, topic.key)));
    } catch (error) {
      errors.push({ feed, error: String(error.message || error) });
    }
  }

  const items = dedupe(collected)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 8);

  const freshCount = items.filter((item) => item.isFresh).length;

  return {
    ...topic,
    freshCount,
    updatedAt: now.toISOString(),
    items,
    errors
  };
}

const topicData = await Promise.all(topics.map(fetchTopic));

const payload = {
  generatedAt: now.toISOString(),
  freshnessWindowHours: 24,
  topics: topicData
};

await fs.writeFile(outputPath, JSON.stringify(payload, null, 2) + '\n');
console.log(`Wrote ${outputPath}`);
