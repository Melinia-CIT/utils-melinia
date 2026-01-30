import { mkdir, rm } from "fs/promises";
import { existsSync } from "fs";

const DIST_DIR = "./dist";

// Clean dist directory
if (existsSync(DIST_DIR)) {
  await rm(DIST_DIR, { recursive: true });
}
await mkdir(DIST_DIR, { recursive: true });

// Build client bundle
console.log("Building client bundle...");
const clientResult = await Bun.build({
  entrypoints: ["./src/client.tsx"],
  outdir: `${DIST_DIR}/static`,
  minify: true,
  sourcemap: "external",
  naming: "[name].[ext]",
});

if (!clientResult.success) {
  console.error("Client build failed:", clientResult.logs);
  process.exit(1);
}

console.log("Client bundle built successfully!");

// Generate index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>QR Code Generator</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/static/client.js"></script>
  </body>
</html>`;

await Bun.write(`${DIST_DIR}/index.html`, indexHtml);
console.log("index.html generated!");

console.log("Build complete! Output directory:", DIST_DIR);
