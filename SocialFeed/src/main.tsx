import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// Import CSS in this specific order (Bootstrap first, then custom)
import './assets/css/bootstrap.min.css'
import './assets/css/common.css'
import './assets/css/main.css'
import './assets/css/responsive.css'
import './assets/css/createpostbox-mobile.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)