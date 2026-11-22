import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import SubmissionForm from './components/ui/SubmissionForm.tsx';
import './index.css';

const isPreview = window.location.pathname === '/preview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPreview ? <SubmissionForm /> : <App />}
  </StrictMode>
);