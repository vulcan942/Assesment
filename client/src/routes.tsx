import type { RouteObject } from 'react-router'
import { RootLayout } from '@/components/RootLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { HomePage } from '@/pages/HomePage'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      // The product page does not exist yet; this stops links to it showing the router's default error screen.
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
