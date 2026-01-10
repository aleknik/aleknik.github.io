import { useState, useEffect } from 'react'
import Hero from './components/Hero'
import SocialLinks from './components/SocialLinks'
import Background from './components/Background'
import './App.css'

function App() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={`app ${mounted ? 'mounted' : ''}`}>
      <Background />
      <main className="main-content">
        <Hero />
        <SocialLinks />
      </main>
    </div>
  )
}

export default App
