export interface QRShape {
  type: 'circle' | 'square' | 'roundedSquare';
  radius?: number; // For rounded squares
}

export interface CornerMarkerShape {
  type: 'square' | 'roundedSquare';
  radius?: number;
}

export interface LogoConfig {
  enabled: boolean;
  path?: string;
  sizePercentage?: number; // % of canvas size
  gapPercentage?: number; // % of canvas size for safe zone
}

export interface QRConfig {
  content: string;
  outputPath: string;
  
  // Colors
  backgroundColor: string;
  foregroundColor: string;
  
  // Size
  cellSize: number;
  margin: number;
  
  // Shapes
  dataDotShape: QRShape;
  cornerMarkerShape: CornerMarkerShape;
  
  // Logo configuration
  logo: LogoConfig;
  
  // Advanced
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  dotSpacing: number; // 0 to 1, controls gap between dots
}

export const defaultConfig: QRConfig = {
  content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  outputPath: "qr_output.png",
  
  backgroundColor: '#000000',
  foregroundColor: '#ffffff',
  
  cellSize: 25,
  margin: 2,
  
  dataDotShape: {
    type: 'circle',
  },
  
  cornerMarkerShape: {
    type: 'roundedSquare',
    radius: 25 * 1.8, // cellSize * 1.8
  },
  
  logo: {
    enabled: true,
    path: './logo.png',
    sizePercentage: 0.25, // 25% of canvas
    gapPercentage: 0.35, // 35% of canvas for safe zone
  },
  
  errorCorrectionLevel: 'H',
  dotSpacing: 0.85,
};

export function createConfig(overrides: Partial<QRConfig>): QRConfig {
  const config: QRConfig = { ...defaultConfig, ...overrides };
  
  // Deep merge nested objects
  if (overrides.logo) {
    config.logo = { ...defaultConfig.logo, ...overrides.logo };
  }
  if (overrides.dataDotShape) {
    config.dataDotShape = { ...defaultConfig.dataDotShape, ...overrides.dataDotShape };
  }
  if (overrides.cornerMarkerShape) {
    config.cornerMarkerShape = { ...defaultConfig.cornerMarkerShape, ...overrides.cornerMarkerShape };
  }
  
  // Auto-calculate radius for corner marker if not provided
  if (config.cornerMarkerShape.type === 'roundedSquare' && !config.cornerMarkerShape.radius) {
    config.cornerMarkerShape.radius = config.cellSize * 1.8;
  }
  
  return config;
}
