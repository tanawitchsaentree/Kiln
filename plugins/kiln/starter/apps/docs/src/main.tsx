import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'kiln-ds-tokens/css';
import 'kiln-ds-react/styles.css';
import './docs.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
