import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 导入UnoCSS
import '@unocss/reset/tailwind.css'
import 'uno.css'

import './index.css'
import './styles/globals.css'
import './styles/responsive.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
