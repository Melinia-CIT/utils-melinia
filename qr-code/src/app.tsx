import { useState, useEffect, startViewTransition, useViewTransition } from 'hono/jsx'
import { css, keyframes, Style } from 'hono/css'
import { viewTransition } from 'hono/jsx/dom/css'
import QRCodeGenerator from './client'

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const slideIn = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`

export default function App() {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isUpdating, startViewTransition] = useViewTransition()
  
  const [transitionClass] = useState(() => 
    viewTransition(css`
      ::view-transition-old(root) {
        animation: ${fadeIn} 0.3s ease-out;
      }
      ::view-transition-new(root) {
        animation: ${fadeIn} 0.3s ease-in;
      }
    `)
  )

  const toggleAdvanced = () => {
    startViewTransition(() => {
      setShowAdvanced(prev => !prev)
    })
  }

  const appStyle = css`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    
    ${transitionClass}
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      
      ${isUpdating && css`
        &:before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #007bff, #28a745, #17a2b8, #ffc107, #dc3545, #007bff);
          background-size: 200% 100%;
          animation: loading 2s linear infinite;
          z-index: 1000;
        }
        
        @keyframes loading {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
      `}
    }
    
    .header {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
      padding: 30px;
      text-align: center;
      position: relative;
      
      h1 {
        margin: 0;
        font-size: 2.5em;
        font-weight: 300;
        animation: ${slideIn} 0.5s ease-out;
      }
      
      .subtitle {
        margin-top: 10px;
        opacity: 0.9;
        font-size: 1.1em;
      }
    }
    
    .nav {
      display: flex;
      justify-content: center;
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
      
      button {
        padding: 10px 20px;
        border: none;
        border-radius: 25px;
        background: white;
        color: #007bff;
        border: 2px solid #007bff;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background: #007bff;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
        }
        
        &.active {
          background: #007bff;
          color: white;
        }
      }
    }
    
    .content {
      padding: 0;
      position: relative;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      padding: 30px;
      
      .feature-card {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
        
        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        h3 {
          color: #007bff;
          margin-bottom: 10px;
        }
        
        p {
          color: #666;
          line-height: 1.6;
        }
      }
    }
    
    .demo-section {
      padding: 30px;
      background: #f8f9fa;
      
      h2 {
        color: #333;
        margin-bottom: 20px;
        text-align: center;
      }
      
      .demo-qr {
        text-align: center;
        padding: 20px;
        background: white;
        border-radius: 10px;
        margin: 20px 0;
        
        img {
          max-width: 200px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
          
          &:hover {
            transform: scale(1.05);
          }
        }
      }
    }
  `

  const DemoQRCode = () => {
    const [count, setCount] = useState(0)
    
    const handleClick = () => {
      startViewTransition(() => {
        setCount(prev => prev + 1)
      })
    }
    
    return (
      <div class="demo-qr">
        <h3>Interactive Demo</h3>
        <p>Click the button to see view transitions in action!</p>
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Clicked+${count}+times`}
          alt="Demo QR Code" 
        />
        <br />
        <button 
          onClick={handleClick}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            background: '#007bff',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Click me! ({count} clicks)
        </button>
      </div>
    )
  }

  return (
    <>
      <Style />
      <div class={appStyle}>
        <div class="container">
          <header class="header">
            <h1>QR Code Generator</h1>
            <p class="subtitle">Powered by Hono JSX DOM</p>
          </header>
          
          <nav class="nav">
            <button 
              class={!showAdvanced ? 'active' : ''}
              onClick={() => startViewTransition(() => setShowAdvanced(false))}
            >
              Generator
            </button>
            <button 
              class={showAdvanced ? 'active' : ''}
              onClick={() => startViewTransition(() => setShowAdvanced(true))}
            >
              Demo & Features
            </button>
          </nav>
          
          <main class="content">
            {!showAdvanced ? (
              <QRCodeGenerator />
            ) : (
              <>
                <div class="demo-section">
                  <h2>Interactive Features Demo</h2>
                  <DemoQRCode />
                </div>
                
                <div class="features">
                  <div class="feature-card" onClick={() => startViewTransition(() => setShowAdvanced(false))}>
                    <h3>🎨 Custom Design</h3>
                    <p>Choose colors, shapes, and styles for your QR codes</p>
                  </div>
                  <div class="feature-card" onClick={() => startViewTransition(() => setShowAdvanced(false))}>
                    <h3>🖼️ Logo Support</h3>
                    <p>Add your logo to QR codes with customizable size and positioning</p>
                  </div>
                  <div class="feature-card" onClick={() => startViewTransition(() => setShowAdvanced(false))}>
                    <h3>⚡ Real-time Preview</h3>
                    <p>See changes instantly as you customize your QR code</p>
                  </div>
                  <div class="feature-card" onClick={() => startViewTransition(() => setShowAdvanced(false))}>
                    <h3>📱 Responsive Design</h3>
                    <p>Works seamlessly on desktop and mobile devices</p>
                  </div>
                  <div class="feature-card">
                    <h3>🔄 View Transitions</h3>
                    <p>Smooth animations powered by the View Transitions API</p>
                  </div>
                  <div class="feature-card">
                    <h3>⚛️ React Hooks</h3>
                    <p>Built with familiar React-compatible hooks like useState and useEffect</p>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  )
}