import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AlarmPopup from './pages/AlarmPopup.jsx'
import './index.css'
import './alarm.css'

function Router() {
  const path = window.location.pathname;
  
  if (path.startsWith('/alarm')) {
    return <AlarmPopup />;
  }
  
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)