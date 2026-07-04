import { redirect } from 'next/navigation'

// Login page moved to /login to avoid layout auth loop.
// This stub redirects any old bookmarks.
export default function OldLoginRedirect() {
  redirect('/login')
}
