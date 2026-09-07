import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GamificationProvider } from './context/GamificationContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GamificationProvider>
      <App />
    </GamificationProvider>
  </StrictMode>,
);
