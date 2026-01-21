import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

app.get('/', (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hono QR Code</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/static/client.js"></script>
      </body>
    </html>
  `)
});

app.get('/static/client.js', async (c) => {
  const result = await Bun.build({
    entrypoints: ['./src/client.tsx'],
    minify: false,
  });

  if (!result.success) {
    console.error('Build failed:', result.logs)
    return c.text('Build failed', 500)
  }

  const output = result.outputs[0]
  const text = await output.text()

  return c.body(text, 200, {
    'Content-Type': 'application/javascript',
  });
});

export default app
