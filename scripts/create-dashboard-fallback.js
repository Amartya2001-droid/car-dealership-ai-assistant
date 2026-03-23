const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'frontend', 'build');
const targetRoute = '/dashboard';

fs.mkdirSync(buildDir, { recursive: true });

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=${targetRoute}" />
    <title>Operations Dashboard</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%);
        color: #1c1917;
      }
      .card {
        max-width: 32rem;
        margin: 2rem;
        padding: 2rem;
        border: 1px solid #d6d3d1;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 20px 45px rgba(28, 25, 23, 0.08);
        text-align: center;
      }
      a {
        color: #b45309;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Opening Operations Dashboard</h1>
      <p>The frontend bundle is temporarily falling back to the built-in dashboard route.</p>
      <p><a href="${targetRoute}">Continue to ${targetRoute}</a></p>
    </main>
    <script>
      window.location.replace(${JSON.stringify(targetRoute)});
    </script>
  </body>
</html>
`;

fs.writeFileSync(path.join(buildDir, 'index.html'), html);

console.log(`Wrote fallback dashboard bundle to ${path.join(buildDir, 'index.html')}`);
