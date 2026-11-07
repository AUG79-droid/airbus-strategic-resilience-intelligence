import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { EvidenceProvider } from './features/evidence/EvidenceProvider';
import { LabProvider } from './features/lab/LabProvider';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LabProvider>
      <EvidenceProvider>
        <App />
      </EvidenceProvider>
    </LabProvider>
  </StrictMode>,
);
