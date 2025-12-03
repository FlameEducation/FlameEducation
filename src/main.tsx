import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 开发环境下禁用严格模式，避免重复渲染
const AppWrapper = process.env.NODE_ENV === 'development' ? (
  <BrowserRouter>
    <App />
  </BrowserRouter>
) : (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')!).render(AppWrapper)
