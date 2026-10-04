import '@fontsource-variable/montserrat';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders } from './components/AppProviders';
import './i18n';
import { routes } from './routes';

// A data router is required for `useBlocker` (unsaved changes warning in the form).
const router = createBrowserRouter(routes);

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
