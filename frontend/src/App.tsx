import { useEffect, useState } from 'react'
import './App.css'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; name: string }
  | { status: 'empty' }
  | { status: 'error' }

function App() {
  const [profile, setProfile] = useState<ProfileState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    async function loadSchool() {
      try {
        const response = await fetch('/api/school/profile/', { signal: controller.signal })
        if (!response.ok) throw new Error('Could not load the school profile')
        const data = await response.json()
        if (data?.school === null) {
          setProfile({ status: 'empty' })
        } else if (typeof data?.school?.name === 'string' && data.school.name.trim()) {
          setProfile({ status: 'ready', name: data.school.name })
        } else {
          throw new Error('Unexpected school profile response')
        }
      } catch {
        if (!controller.signal.aborted) setProfile({ status: 'error' })
      }
    }

    void loadSchool()
    return () => controller.abort()
  }, [])

  return (
    <main className="connection-page">
      <h1>{profile.status === 'ready' ? profile.name : 'School Management System'}</h1>
      <p role="status" className={profile.status === 'error' ? 'connection-error' : undefined}>
        {profile.status === 'loading' && 'Loading your school…'}
        {profile.status === 'ready' && 'Welcome to your school management system.'}
        {profile.status === 'empty' && 'Your school profile has not been set up yet. Ask your administrator to add it.'}
        {profile.status === 'error' && 'Unable to load your school. Please try refreshing the page.'}
      </p>
    </main>
  )
}

export default App
