import { Link, Outlet } from 'react-router'

// One string so the header brand and page content share the same column and padding.
const container = 'mx-auto w-full max-w-(--container-max) px-4 min-[600px]:px-8'

function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className={`${container} flex`}>
        <Link
          to="/"
          className="flex min-h-11 items-center text-base leading-6 font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Catalogue
        </Link>
      </div>
    </header>
  )
}

export function RootLayout() {
  return (
    <>
      <SiteHeader />
      <main className={`${container} py-8 min-[960px]:py-16`}>
        <Outlet />
      </main>
    </>
  )
}
