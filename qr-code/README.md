# QR Code Generator with Hono JSX DOM

This project demonstrates Hono's client-side rendering capabilities using JSX DOM, providing an interactive QR code generator with modern UI features.

## Features

### Client-Side Rendering with Hono JSX DOM
- **React-compatible hooks**: Uses `useState`, `useEffect`, and other React hooks
- **Small bundle size**: Only 2.8KB with Brotli compression for the core functionality
- **TypeScript support**: Full type safety with TypeScript

### Interactive UI Components
- **Real-time QR code generation**: Instant preview as you modify settings
- **Customizable designs**: Colors, shapes, margins, and error correction levels
- **Logo support**: Add and position logos within QR codes
- **Form validation**: Input validation and error handling

### View Transitions API
- **Smooth animations**: Modern view transitions for seamless UI updates
- **Loading states**: Visual feedback during async operations
- **Keyframe animations**: Custom transitions with CSS keyframes

### Responsive Design
- **Mobile-friendly**: Works on all device sizes
- **Modern styling**: Gradient backgrounds, hover effects, and micro-interactions
- **Accessibility**: Semantic HTML and keyboard navigation support

## Getting Started

### Installation
```bash
bun install
```

### Build client-side bundles
```bash
bun run build:all
```

### Start development server
```bash
bun run dev
```

Visit `http://localhost:8080` to see the interactive QR code generator.

## Hono JSX DOM Features Used

### React-compatible Hooks
```tsx
import { useState, useEffect, useViewTransition } from 'hono/jsx'

const [count, setCount] = useState(0)
const [isUpdating, startViewTransition] = useViewTransition()
```

### View Transitions
```tsx
import { startViewTransition } from 'hono/jsx'
import { viewTransition } from 'hono/jsx/dom/css'
import { keyframes } from 'hono/css'

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const transitionClass = viewTransition(css`
  ::view-transition-old(root) {
    animation: ${fadeIn} 0.3s ease-out;
  }
`)

startViewTransition(() => {
  setCount(prev => prev + 1)
})
```

## API Endpoints

### Generate QR Code (POST)
```bash
POST /api/qr
Content-Type: application/json

{
  "content": "https://example.com",
  "cellSize": 10,
  "margin": 4,
  "foregroundColor": "#000000",
  "backgroundColor": "#FFFFFF",
  "errorCorrectionLevel": "M",
  "dataDotShape": "square",
  "cornerMarkerShape": "square",
  "logo": {
    "enabled": false,
    "path": "./logo.png",
    "sizePercentage": 0.2,
    "gapPercentage": 0.25
  }
}
```

### Generate QR Code (GET)
```bash
GET /api/qr?content=https://example.com
```

## Configuration Options

## API Endpoints

### GET /api/qr
Generate QR code with query parameters.

```bash
curl "http://localhost:3000/api/qr?content=https://example.com" -o qr.png
```

### POST /api/qr
Generate QR code with JSON body.

```bash
curl -X POST http://localhost:3000/api/qr \
  -H "Content-Type: application/json" \
  -d '{"content": "https://example.com", "foregroundColor": "#000000", "backgroundColor": "#ffffff"}' \
  -o qr.png
```

## Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `content` | string | (required) | QR code content |
| `backgroundColor` | string | `#000000` | Background color |
| `foregroundColor` | string | `#ffffff` | Foreground color |
| `cellSize` | number | `25` | Size of each module |
| `margin` | number | `2` | Margin around QR |
| `dataDotShape` | object | `{type: "circle"}` | Shape of data dots (`circle`, `square`, `roundedSquare`) |
| `cornerMarkerShape` | object | `{type: "roundedSquare"}` | Shape of corner markers |
| `logo.enabled` | boolean | `true` | Enable logo overlay |
| `logo.path` | string | `./logo.png` | Path to logo file |
| `logo.sizePercentage` | number | `0.25` | Logo size as % of canvas |
| `logo.gapPercentage` | number | `0.35` | Clear zone as % of canvas |
| `errorCorrectionLevel` | string | `H` | Error correction (`L`, `M`, `Q`, `H`) |
| `dotSpacing` | number | `0.85` | Gap between dots (0-1) |
