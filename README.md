# Aleksandar Nikolic - Personal Landing Page

A modern, mobile-first personal landing page built with React and Vite.

## 🚀 Features

- ⚡ **Fast** - Built with Vite for lightning-fast development and builds
- 📱 **Mobile-first** - Responsive design that looks great on all devices
- 🎨 **Modern UI** - Dark theme with animated particle background
- 📦 **PWA Ready** - Works offline and can be installed as an app
- 🚀 **Auto Deploy** - Automatically deploys to GitHub Pages on push

## 🛠️ Tech Stack

- React 18
- Vite 5
- Vite PWA Plugin
- GitHub Actions for CI/CD

## 📦 Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
├── public/              # Static assets (favicons, icons)
├── src/
│   ├── components/      # React components
│   │   ├── Background.jsx
│   │   ├── Hero.jsx
│   │   └── SocialLinks.jsx
│   ├── App.jsx          # Main app component
│   ├── App.css          # App styles
│   ├── index.css        # Global styles
│   └── main.jsx         # Entry point
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json
```

## 🌐 Deployment

This site automatically deploys to GitHub Pages when you push to the `main` branch.

### Manual Deployment

```bash
npm run build
npm run deploy
```

## 📄 License

MIT
