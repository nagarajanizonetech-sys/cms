import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ReceptionProvider } from './context/ReceptionContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReceptionProvider>
      <App />
    </ReceptionProvider>
  </StrictMode>,
);
