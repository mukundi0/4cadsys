import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('Connecting to Django…')
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function checkConnection() {
      try {
        const response = await fetch('/api/health/', { signal: controller.signal })
        if (!response.ok) throw new Error('The health request failed')
        const data = await response.json()
        if (data.status !== 'ok' || typeof data.message !== 'string') {
          throw new Error('Unexpected health response')
        }
        setMessage(data.message)
      } catch {
        if (controller.signal.aborted) return
        setError(true)
        setMessage('Could not connect. Make sure Django is running on port 8000, then refresh this page.')
      }
    }

    void checkConnection()
    return () => controller.abort()
  }, [])

  return (
    <main className="connection-page">
      <h1>School Management System</h1>
      <h2>Backend connection</h2>
      <p role="status" className={error ? 'connection-error' : undefined}>{message}</p>
    </main>
  )
}

export default App
