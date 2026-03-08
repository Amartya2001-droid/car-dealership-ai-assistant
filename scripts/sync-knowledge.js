const { syncKnowledgeFromWebsite } = require('../src/syncWebsite');

const url = process.argv[2];

syncKnowledgeFromWebsite(url)
  .then((result) => {
    console.log('Knowledge base synced successfully.');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error('Knowledge sync failed:', error.message);
    process.exit(1);
  });
