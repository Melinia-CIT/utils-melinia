import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import QRCode from 'qrcode';
import { createCanvas, loadImage, type Image } from '@napi-rs/canvas';
import { tmpdir } from 'os';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';

// --- 1. Setup: Inlining Config and Shapes for a single-file runnable example ---

// Types
interface DotShape {
  type: 'square' | 'circle' | 'rounded';
  cornerRadius?: number;
}

interface LogoConfig {
  enabled: boolean;
  gapPercentage?: number;
  sizePercentage?: number;
}

interface FullQRConfig {
  content: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  cellSize: number;
  width?: number;
  height?: number;
  backgroundColor: string;
  foregroundColor: string;
  dataDotShape: DotShape;
  cornerMarkerShape: DotShape;
  cornerInnerRadius?: number;
  dotSpacing: number;
  logo: LogoConfig;
}

const defaults: FullQRConfig = {
  content: "https://example.com",
  errorCorrectionLevel: 'H',
  margin: 4,
  cellSize: 10,
  width: 0,
  height: 0,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
  dataDotShape: { type: 'square' },
  cornerMarkerShape: { type: 'square' },
  cornerInnerRadius: 0.4,
  dotSpacing: 0,
  logo: {
    enabled: false,
    gapPercentage: 0.5,
    sizePercentage: 0.2
  }
};

function createConfig(userConfig: Partial<FullQRConfig>): FullQRConfig {
  return { ...defaults, ...userConfig, logo: { ...defaults.logo, ...userConfig.logo } };
}

// Shape Implementations
function drawDotImpl(
  ctx: any, 
  pixelX: number, 
  pixelY: number, 
  size: number, 
  shape: DotShape, 
  spacing: number
) {
  const drawSize = size - spacing;
  const offset = (size - drawSize) / 2;
  
  // Note: pixelX/pixelY from your loop are CENTERS.
  // If shape is square, we need to calculate top-left based on center.
  
  ctx.fillStyle = ctx.fillStyle; // Use current fill style (set in loop)

  if (shape.type === 'circle') {
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, drawSize / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape.type === 'rounded') {
    const r = drawSize * 0.4;
    const x = pixelX - size / 2 + offset;
    const y = pixelY - size / 2 + offset;
    ctx.beginPath();
    ctx.roundRect(x, y, drawSize, drawSize, r);
    ctx.fill();
  } else {
    // Square
    const x = pixelX - size / 2 + offset;
    const y = pixelY - size / 2 + offset;
    ctx.fillRect(x, y, drawSize, drawSize);
  }
}

function drawCornerMarkerImpl(
  ctx: any, 
  x: number, 
  y: number, 
  size: number, 
  modules: number, 
  shape: DotShape, 
  fg: string, 
  bg: string,
  innerRadius?: number
) {
  // 1. Outer Box
  ctx.fillStyle = fg;
  ctx.fillRect(x, y, size * modules, size * modules);

  // 2. Inner Box (Background color to create gap)
  ctx.fillStyle = bg;
  ctx.fillRect(x + size, y + size, size * (modules - 2), size * (modules - 2));

  // 3. Inner Dot (Foreground color)
  ctx.fillStyle = fg;
  const innerSize = size * (modules - 4);
  
  if (shape.type === 'circle') {
    ctx.beginPath();
    ctx.arc(x + size * 3.5, y + size * 3.5, innerSize / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape.type === 'rounded') {
    const r = innerRadius !== undefined ? innerSize * innerRadius : innerSize * 0.4;
    ctx.beginPath();
    ctx.roundRect(x + size * 2, y + size * 2, innerSize, innerSize, r);
    ctx.fill();
  } else {
    // Square
    ctx.fillRect(x + size * 2, y + size * 2, innerSize, innerSize);
  }
}

// --- 2. Core Logic (Server Side) ---

async function generateQRCodeBuffer(config: FullQRConfig, logoBuffer?: ArrayBuffer): Promise<Buffer> {
  try {
    // 1. Generate QR Matrix
    const qr = QRCode.create(config.content, { errorCorrectionLevel: config.errorCorrectionLevel });
    const moduleCount = qr.modules.size;
    const cellSize = config.cellSize;
    const margin = config.margin;

    // Calculate canvas size based on cellSize and modules, then optionally scale
    const baseCanvasSize = (moduleCount + margin * 2) * cellSize;
    const canvasSize = config.width || config.height ? Math.max(config.width || 0, config.height || 0, baseCanvasSize) : baseCanvasSize;

    // If width/height specified, we may need to adjust cellSize to fit
    const finalCellSize = config.width || config.height ? canvasSize / (moduleCount + margin * 2) : cellSize;

    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    // 2. Draw Background
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 3. Define Corner Areas
    const cornerSize = 7;
    const corners = [
      { r: 0, c: 0 },
      { r: 0, c: moduleCount - cornerSize },
      { r: moduleCount - cornerSize, c: 0 }
    ];

    const isInsideCorner = (r: number, c: number): boolean => {
      return corners.some(corner => 
        r >= corner.r && r < corner.r + cornerSize &&
        c >= corner.c && c < corner.c + cornerSize
      );
    };

    // 4. Define Center Gap
    const isInsideCenterGap = config.logo.enabled ? ((pixelX: number, pixelY: number): boolean => {
      const gapPercentage = config.logo.gapPercentage ?? defaults.logo.gapPercentage!;
      const gapSize = canvasSize * gapPercentage;
      const center = canvasSize / 2;
      const halfGap = gapSize / 2;
      
      return pixelX > center - halfGap && 
             pixelX < center + halfGap &&
             pixelY > center - halfGap && 
             pixelY < center + halfGap;
    }) : (() => false);

    // 5. Draw Data Bits
    ctx.fillStyle = config.foregroundColor;

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (isInsideCorner(r, c)) continue;

        // Centers
        const pixelX = (c + margin) * finalCellSize + finalCellSize / 2;
        const pixelY = (r + margin) * finalCellSize + finalCellSize / 2;

        if (config.logo.enabled && isInsideCenterGap(pixelX, pixelY)) continue;

        if (qr.modules.data[r * moduleCount + c]) {
          drawDotImpl(ctx, pixelX, pixelY, finalCellSize, config.dataDotShape, config.dotSpacing);
        }
      }
    }

    // 6. Draw Corner Markers
    const getPos = (row: number, col: number) => ({
      x: (col + margin) * finalCellSize,
      y: (row + margin) * finalCellSize
    });

    corners.forEach(corner => {
      const { x, y } = getPos(corner.r, corner.c);
      drawCornerMarkerImpl(
        ctx,
        x,
        y,
        finalCellSize,
        cornerSize,
        config.cornerMarkerShape,
        config.foregroundColor,
        config.backgroundColor,
        config.cornerInnerRadius
      );
    });

    // 7. Draw Logo
    if (config.logo.enabled && logoBuffer) {
      try {
        const logo: Image = await loadImage(logoBuffer);
        const logoSize = canvasSize * (config.logo.sizePercentage ?? defaults.logo.sizePercentage!);
        const logoX = (canvasSize - logoSize) / 2;
        const logoY = (canvasSize - logoSize) / 2;
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      } catch (err) {
        console.error("Logo load error:", err);
      }
    }

    // 8. Return Buffer
    return canvas.toBuffer('image/png');

  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}

// --- 3. Hono App Setup ---

const app = new Hono();

// Serve static files from temp directory for uploaded logos
app.use('/logos/*', serveStatic({
  root: tmpdir(),
}));

// Serve HTML Frontend
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code Generator</title>
      <style>
        body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: bold; }
        input, select { width: 100%; padding: 0.5rem; box-sizing: border-box; }
        .row { display: flex; gap: 1rem; }
        .col { flex: 1; }
        button { padding: 0.75rem 1.5rem; background: #000; color: #fff; border: none; cursor: pointer; font-size: 1rem; }
        .result { margin-top: 2rem; text-align: center; }
        img { border: 1px solid #ccc; max-width: 100%; }
        .slider-group { display: flex; align-items: center; gap: 1rem; }
        .slider-group input[type="range"] { flex: 1; }
        .slider-group span { min-width: 40px; }
      </style>
    </head>
    <body>
      <h1>QR Code Generator</h1>
      <form id="qrForm" enctype="multipart/form-data">
        <div class="form-group">
          <label>Content</label>
          <input type="text" name="content" value="https://hono.dev" required>
        </div>
        
        <div class="form-group">
          <label>Data Dot Shape</label>
          <select name="dataDotShape">
            <option value="square">Square</option>
            <option value="circle">Circle</option>
            <option value="rounded">Rounded</option>
          </select>
        </div>

        <div class="form-group">
          <label>Corner Marker Shape</label>
          <select name="cornerMarkerShape">
            <option value="square">Square</option>
            <option value="circle">Circle</option>
            <option value="rounded">Rounded</option>
          </select>
        </div>

        <div class="form-group">
          <label>Corner Inner Roundness (0-0.5)</label>
          <div class="slider-group">
            <input type="range" name="cornerInnerRadius" min="0" max="0.5" step="0.05" value="0.4">
            <span id="cornerRadiusValue">0.4</span>
          </div>
        </div>

        <div class="form-group">
          <label>Size (pixels)</label>
          <div class="row">
            <div class="col">
              <input type="number" name="width" placeholder="Width" min="100" max="2000">
            </div>
            <div class="col">
              <input type="number" name="height" placeholder="Height" min="100" max="2000">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Background Color</label>
          <input type="color" name="backgroundColor" value="#ffffff">
        </div>

        <div class="form-group">
          <label>Foreground Color</label>
          <input type="color" name="foregroundColor" value="#000000">
        </div>

        <div class="form-group">
          <label>Logo (optional)</label>
          <input type="file" name="logoFile" accept="image/*">
          <div style="margin-top: 0.5rem;">
            <label style="font-weight: normal;">
              <input type="checkbox" name="logoEnabled"> Enable Logo
            </label>
          </div>
          <div class="row" style="margin-top: 0.5rem;">
            <div class="col">
              <input type="number" name="logoSize" placeholder="Logo Size %" min="0.05" max="0.3" step="0.01" value="0.2" title="Logo size as percentage of QR (0.05-0.3)">
            </div>
            <div class="col">
              <input type="number" name="logoGap" placeholder="Gap %" min="0.05" max="0.3" step="0.01" value="0.2" title="Gap around logo as percentage of QR">
            </div>
          </div>
        </div>

        <button type="submit">Generate</button>
      </form>

      <div class="result" id="result">
        <p>Image will appear here...</p>
      </div>

      <script>
        // Update slider value display
        document.querySelector('input[name="cornerInnerRadius"]').addEventListener('input', (e) => {
          document.getElementById('cornerRadiusValue').textContent = e.target.value;
        });

        document.getElementById('qrForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          
          const config = {
            content: formData.get('content'),
            dataDotShape: { type: formData.get('dataDotShape') },
            cornerMarkerShape: { type: formData.get('cornerMarkerShape') },
            cornerInnerRadius: parseFloat(formData.get('cornerInnerRadius')),
            width: formData.get('width') ? parseInt(formData.get('width')) : 0,
            height: formData.get('height') ? parseInt(formData.get('height')) : 0,
            backgroundColor: formData.get('backgroundColor'),
            foregroundColor: formData.get('foregroundColor'),
            logo: {
              enabled: formData.get('logoEnabled') === 'on',
              sizePercentage: parseFloat(formData.get('logoSize')) || 0.2,
              gapPercentage: parseFloat(formData.get('logoGap')) || 0.2
            }
          };

          const res = await fetch('/api/generate', {
            method: 'POST',
            body: JSON.stringify(config)
          });

          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            document.getElementById('result').innerHTML = \`<img src="\${url}" alt="QR Code" />\`;
          } else {
            alert('Error generating QR code');
          }
        });

        // Handle logo file upload separately
        let logoUploaded = false;
        document.querySelector('input[name="logoFile"]').addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          
          const formData = new FormData();
          formData.append('logo', file);
          
          const res = await fetch('/api/upload-logo', {
            method: 'POST',
            body: formData
          });
          
          if (res.ok) {
            const data = await res.json();
            logoUploaded = true;
            document.querySelector('input[name="logoEnabled"]').checked = true;
          }
        });
      </script>
    </body>
    </html>
  `);
});

// API Endpoint: Upload logo file
let lastLogoPath: string | null = null;

app.post('/api/upload-logo', async (c) => {
  try {
    const body = await c.req.parseBody();
    const logoFile = body['logo'] as unknown as File;

    if (!logoFile || !(logoFile instanceof File)) {
      return c.json({ error: 'No logo file provided' }, 400);
    }

    // Clean up previous logo
    if (lastLogoPath) {
      try { await unlink(lastLogoPath); } catch (e) {}
    }

    // Save to temp file
    const ext = logoFile.name?.split('.').pop() || 'png';
    const filename = `logo-${Date.now()}.${ext}`;
    const filepath = join(tmpdir(), filename);
    const arrayBuffer = await logoFile.arrayBuffer();
    await writeFile(filepath, Buffer.from(arrayBuffer));
    lastLogoPath = filepath;

    return c.json({ path: `/logos/${filename}`, success: true });
  } catch (error) {
    console.error('Logo upload error:', error);
    return c.json({ error: 'Failed to upload logo' }, 500);
  }
});

// API Endpoint: Generates image on server and returns buffer
app.post('/api/generate', async (c) => {
  try {
    const body = await c.req.json();
    
    // Map request body to config structure
    const config = createConfig({
      content: body.content || 'https://example.com',
      dataDotShape: body.dataDotShape || { type: 'square' },
      cornerMarkerShape: body.cornerMarkerShape || { type: 'square' },
      cornerInnerRadius: body.cornerInnerRadius ?? defaults.cornerInnerRadius,
      width: body.width || 0,
      height: body.height || 0,
      backgroundColor: body.backgroundColor || '#ffffff',
      foregroundColor: body.foregroundColor || '#000000',
      logo: body.logo || { enabled: false }
    });

    // Get logo buffer if logo is enabled and we have a path
    let logoBuffer: ArrayBuffer | undefined;
    if (config.logo.enabled && lastLogoPath) {
      try {
        logoBuffer = await readFile(lastLogoPath);
      } catch (err) {
        console.error('Error reading logo file:', err);
      }
    }

    // Generate Buffer
    const buffer = await generateQRCodeBuffer(config, logoBuffer);

    // Return Image Response
    return new Response(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    return c.json({ error: 'Failed to generate QR' }, 500);
  }
});

// Start Server
const port = 8080;
console.log(`Server running at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

