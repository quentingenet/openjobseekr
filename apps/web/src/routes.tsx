import { Navigate, type RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { NotFoundPage } from './components/NotFoundPage';
import { RedirectIfAuthenticated, RequireAuth } from './components/RequireAuth';
import { RouteErrorPage } from './components/RouteErrorPage';

// Each page is downloaded when its route is first visited, which keeps the first download
// small (the form and its date picker are the heaviest part of the app).
const authPage = (mode: 'login' | 'register') => () =>
  import('./features/auth/AuthPage').then(({ AuthPage }) => ({
    Component: () => <AuthPage mode={mode} />,
  }));
const applicationsPage = () =>
  import('./features/applications/ApplicationsPage').then(({ ApplicationsPage }) => ({
    Component: ApplicationsPage,
  }));
const newApplicationPage = () =>
  import('./features/applications/ApplicationFormPage').then(({ NewApplicationPage }) => ({
    Component: NewApplicationPage,
  }));
const editApplicationPage = () =>
  import('./features/applications/ApplicationFormPage').then(({ EditApplicationPage }) => ({
    Component: EditApplicationPage,
  }));
const applicationDetailPage = () =>
  import('./features/applications/ApplicationDetailPage').then(({ ApplicationDetailPage }) => ({
    Component: ApplicationDetailPage,
  }));
const statsPage = () =>
  import('./features/stats/StatsPage').then(({ StatsPage }) => ({ Component: StatsPage }));
const skillsPage = () =>
  import('./features/skills/SkillsPage').then(({ SkillsPage }) => ({ Component: SkillsPage }));

export const routes: RouteObject[] = [
  {
    element: <RedirectIfAuthenticated />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', lazy: authPage('login') },
      { path: '/register', lazy: authPage('register') },
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
          { path: '/applications', lazy: applicationsPage },
          { path: '/applications/new', lazy: newApplicationPage },
          { path: '/applications/:id', lazy: applicationDetailPage },
          { path: '/applications/:id/edit', lazy: editApplicationPage },
          { path: '/stats', lazy: statsPage },
          { path: '/skills', lazy: skillsPage },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
