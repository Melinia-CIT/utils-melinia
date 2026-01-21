import { useState, useEffect } from 'hono/jsx'
import { css, Style } from 'hono/css'

interface QRForm {
  content: string
  cellSize: number
  margin: number
  foregroundColor: string
  backgroundColor: string
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  logo: {
    enabled: boolean
    path?: string
    sizePercentage: number
    gapPercentage: number
  }
  dataDotShape: 'square' | 'circle' | 'diamond' | 'rounded'
  cornerMarkerShape: 'square' | 'rounded' | 'circle'
}

export default function QRCodeGenerator() {
  const [form, setForm] = useState<QRForm>({
    content: 'https://hono.dev',
    cellSize: 10,
    margin: 4,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    errorCorrectionLevel: 'M',
    logo: {
      enabled: false,
      path: '',
      sizePercentage: 0.2,
      gapPercentage: 0.25
    },
    dataDotShape: 'square',
    cornerMarkerShape: 'square'
  })
  
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const updateForm = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateLogo = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      logo: { ...prev.logo, [field]: value }
    }))
  }

  const generateQRCode = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setQrCodeUrl(url)
      } else {
        console.error('Failed to generate QR code')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    generateQRCode()
  }, [])

  const formStyle = css`
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
  `
  
  const inputStyle = css`
    width: 100%;
    padding: 8px;
    margin: 5px 0 15px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
  `
  
  const buttonStyle = css`
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 10px;
    
    &:hover {
      background-color: #0056b3;
    }
    
    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  `
  
  const previewStyle = css`
    text-align: center;
    margin: 20px 0;
    
    img {
      max-width: 300px;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      background-color: white;
    }
  `
  
  const sectionStyle = css`
    margin-bottom: 25px;
    
    h3 {
      margin-bottom: 10px;
      color: #333;
      border-bottom: 2px solid #007bff;
      padding-bottom: 5px;
    }
  `

  return (
    <>
      <Style />
      <div class={formStyle}>
        <h1>QR Code Generator</h1>
        
        <div class={sectionStyle}>
          <h3>Basic Settings</h3>
          <label>
            Content:
            <input
              type="text"
              class={inputStyle}
              value={form.content}
              onInput={(e) => updateForm('content', (e.target as HTMLInputElement).value)}
              placeholder="Enter text or URL"
            />
          </label>
          
          <label>
            Cell Size:
            <input
              type="number"
              class={inputStyle}
              value={form.cellSize}
              min="1"
              max="50"
              onInput={(e) => updateForm('cellSize', parseInt((e.target as HTMLInputElement).value))}
            />
          </label>
          
          <label>
            Margin:
            <input
              type="number"
              class={inputStyle}
              value={form.margin}
              min="0"
              max="20"
              onInput={(e) => updateForm('margin', parseInt((e.target as HTMLInputElement).value))}
            />
          </label>
        </div>

        <div class={sectionStyle}>
          <h3>Colors</h3>
          <label>
            Foreground Color:
            <input
              type="color"
              class={inputStyle}
              value={form.foregroundColor}
              onInput={(e) => updateForm('foregroundColor', (e.target as HTMLInputElement).value)}
            />
          </label>
          
          <label>
            Background Color:
            <input
              type="color"
              class={inputStyle}
              value={form.backgroundColor}
              onInput={(e) => updateForm('backgroundColor', (e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        <div class={sectionStyle}>
          <h3>Shapes</h3>
          <label>
            Data Dot Shape:
            <select 
              class={inputStyle}
              value={form.dataDotShape}
              onChange={(e) => updateForm('dataDotShape', (e.target as HTMLSelectElement).value)}
            >
              <option value="square">Square</option>
              <option value="circle">Circle</option>
              <option value="diamond">Diamond</option>
              <option value="rounded">Rounded</option>
            </select>
          </label>
          
          <label>
            Corner Marker Shape:
            <select 
              class={inputStyle}
              value={form.cornerMarkerShape}
              onChange={(e) => updateForm('cornerMarkerShape', (e.target as HTMLSelectElement).value)}
            >
              <option value="square">Square</option>
              <option value="rounded">Rounded</option>
              <option value="circle">Circle</option>
            </select>
          </label>
        </div>

        <div class={sectionStyle}>
          <h3>Error Correction</h3>
          <label>
            Error Correction Level:
            <select 
              class={inputStyle}
              value={form.errorCorrectionLevel}
              onChange={(e) => updateForm('errorCorrectionLevel', (e.target as HTMLSelectElement).value)}
            >
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </label>
        </div>

        <div class={sectionStyle}>
          <h3>Logo Settings</h3>
          <label>
            <input
              type="checkbox"
              checked={form.logo.enabled}
              onChange={(e) => updateLogo('enabled', (e.target as HTMLInputElement).checked)}
            />
            Enable Logo
          </label>
          
          {form.logo.enabled && (
            <>
              <label>
                Logo Path:
                <input
                  type="text"
                  class={inputStyle}
                  value={form.logo.path}
                  onInput={(e) => updateLogo('path', (e.target as HTMLInputElement).value)}
                  placeholder="Path to logo image"
                />
              </label>
              
              <label>
                Logo Size Percentage:
                <input
                  type="number"
                  class={inputStyle}
                  value={form.logo.sizePercentage}
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  onInput={(e) => updateLogo('sizePercentage', parseFloat((e.target as HTMLInputElement).value))}
                />
              </label>
              
              <label>
                Logo Gap Percentage:
                <input
                  type="number"
                  class={inputStyle}
                  value={form.logo.gapPercentage}
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  onInput={(e) => updateLogo('gapPercentage', parseFloat((e.target as HTMLInputElement).value))}
                />
              </label>
            </>
          )}
        </div>

        <button 
          class={buttonStyle}
          onClick={generateQRCode}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate QR Code'}
        </button>

        {qrCodeUrl && (
          <div class={previewStyle}>
            <h3>Preview</h3>
            <img src={qrCodeUrl} alt="Generated QR Code" />
            <br />
            <a href={qrCodeUrl} download="qr-code.png" class={buttonStyle}>
              Download QR Code
            </a>
          </div>
        )}
      </div>
    </>
  )
}