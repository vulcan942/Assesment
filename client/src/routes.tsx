import type { RouteObject } from 'react-router'
import { RootLayout } from '@/components/RootLayout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { CategoryPage } from '@/pages/CategoryPage'
import { HomePage } from '@/pages/HomePage'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/categories/:category', element: <CategoryPage /> },
      // The product page does not exist yet; this stops links to it showing the router's default error screen.
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
