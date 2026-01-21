import { render } from 'hono/jsx/dom'
import App from './app.js'

// Client-side entry point for the Hono JSX DOM application
const root = document.getElementById('root')
if (root) {
    render(<App />, root)
} else {
    console.error('Root element not found')
}