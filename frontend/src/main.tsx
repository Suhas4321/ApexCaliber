import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans-condensed/500.css'
import '@fontsource/ibm-plex-sans-condensed/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import './index.css'

import { lazy, StrictMode, Suspense, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Dashboard from './pages/Dashboard'
import WorldPage from './pages/WorldPage'
import PatternFinder from './pages/PatternFinder'
import NotFound from './pages/NotFound'
import LearningPathPage from './pages/LearningPathPage'
import LessonPage from './pages/LessonPage'
import { Spinner } from './components/ui'
import { AuthProvider, hostedAuthEnabled } from './lib/auth'
import SignInPage from './pages/SignInPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

// Lazy-load heavier interactive pages
const QuestionPage = lazy(() => import('./pages/QuestionPage'))
const Playground = lazy(() => import('./pages/Playground'))
const ResumeGrill = lazy(() => import('./pages/ResumeGrill'))
const SystemDesignPage = lazy(() => import('./pages/SystemDesignPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))

const withSpinner = (el: ReactNode) => (
  <Suspense fallback={<div className="p-8"><Spinner label="Loading workspace" /></div>}>{el}</Suspense>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'citadel/:citadelId', element: <Dashboard /> },
      { path: 'world/:id', element: <WorldPage /> },
      { path: 'learn/:citadelId', element: <LearningPathPage /> },
      { path: 'lesson/:lessonId', element: <LessonPage /> },
      { path: 'q/:slug', element: withSpinner(<QuestionPage />) },
      { path: 'playground', element: hostedAuthEnabled ? <div className="shell py-16 text-chalk">The coding playground will return when its isolated runner is ready.</div> : withSpinner(<Playground />) },
      { path: 'finder', element: <PatternFinder /> },
      { path: 'resume-grill', element: withSpinner(<ResumeGrill />) },
      { path: 'system-design', element: withSpinner(<SystemDesignPage />) },
      { path: 'stats', element: withSpinner(<StatsPage />) },
      { path: 'sign-in', element: <SignInPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider><RouterProvider router={router} /></AuthProvider>
  </StrictMode>,
)
