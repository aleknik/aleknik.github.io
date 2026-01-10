import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="avatar-container">
          <div className="avatar">
            <img src="/android-chrome-192x192.png" alt="Aleksandar Nikolic" className="avatar-logo" />
          </div>
        </div>
        
        <h1 className="hero-title">
          <span className="greeting">Hello, I'm</span>
          <span className="name">Aleksandar Nikolic</span>
        </h1>
        
        <p className="hero-tagline">
          Software Engineer based in <span className="location">Belgrade, Serbia</span>
        </p>
      </div>
    </section>
  )
}

export default Hero
