import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { NotFoundPage } from './components/NotFoundPage';
import { RedirectIfAuthenticated, RequireAuth } from './components/RequireAuth';
import { RouteErrorPage } from './components/RouteErrorPage';
import { ApplicationDetailPage } from './features/applications/ApplicationDetailPage';
import {
  EditApplicationPage,
  NewApplicationPage,
} from './features/applications/ApplicationFormPage';
import { ApplicationsPage } from './features/applications/ApplicationsPage';
import { AuthPage } from './features/auth/AuthPage';
import { SkillsPage } from './features/skills/SkillsPage';
import { StatsPage } from './features/stats/StatsPage';

export const routes: RouteObject[] = [
  {
    element: <RedirectIfAuthenticated />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: <AuthPage mode="login" /> },
      { path: '/register', element: <AuthPage mode="register" /> },
    ],
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/applications" replace /> },
          { path: '/applications', element: <ApplicationsPage /> },
          { path: '/applications/new', element: <NewApplicationPage /> },
          { path: '/applications/:id', element: <ApplicationDetailPage /> },
          { path: '/applications/:id/edit', element: <EditApplicationPage /> },
          { path: '/stats', element: <StatsPage /> },
          { path: '/skills', element: <SkillsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
