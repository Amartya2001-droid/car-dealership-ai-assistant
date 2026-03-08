const { updateKnowledgeBaseFromSnapshot } = require('./knowledgeBase');

const parsePromotions = (html) => {
  const promos = [];
  const promoRegex = /(promotion|special|apr|offer)[^<]{0,120}/gi;
  let match;
  while ((match = promoRegex.exec(html)) && promos.length < 5) {
    promos.push(match[0].replace(/\s+/g, ' ').trim());
  }
  return promos;
};

const parseHours = (html) => {
  const hoursMatch = html.match(/(sales hours|service hours)[^<]{0,120}/gi);
  if (!hoursMatch) return null;

  return {
    websiteExtract: hoursMatch.map((line) => line.replace(/\s+/g, ' ').trim()).join(' | ')
  };
};

const syncKnowledgeFromWebsite = async (url) => {
  if (!url) throw new Error('A dealership website URL is required.');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const promotions = parsePromotions(html);
  const hours = parseHours(html);

  const snapshot = {
    promotions: promotions.length ? promotions : undefined,
    hours: hours || undefined,
    sourceUrl: url,
    sourceSyncedAt: new Date().toISOString()
  };

  return updateKnowledgeBaseFromSnapshot(snapshot);
};

module.exports = { syncKnowledgeFromWebsite };
