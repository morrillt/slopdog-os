---
name: electron-nextjs-catppuccin
overview: Create an Electron desktop application with Next.js frontend that uses the Catppuccin Tailwind theme with a Hello World message and themed buttons
todos:
  - id: setup-project
    content: Initialize Electron + Next.js project structure and update package.json with required dependencies
    status: completed
  - id: electron-main
    content: Create main.js Electron process file with BrowserWindow configuration
    status: completed
  - id: tailwind-config
    content: Set up Tailwind CSS with Catppuccin plugin in tailwind.config.js and postcss.config.js
    status: completed
  - id: next-config
    content: Configure Next.js for Electron compatibility
    status: completed
  - id: ui-implementation
    content: Create Hello World page with themed buttons in pages/index.js
    status: completed
  - id: styling
    content: Set up global styles and import Catppuccin CSS theme
    status: completed
---

# Electron + Next.js + Catppuccin Tailwind Theme App

## Project Structure
We'll create a minimal Electron app with Next.js frontend that incorporates the Catppuccin Tailwind theme:

```
electron-catppuccin-app/
├── package.json           # Updated with Electron, Next.js and Catppuccin dependencies
├── main.js                # Electron main process file
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind configuration with Catppuccin plugin
├── postcss.config.js      # PostCSS configuration
├── pages/                 # Next.js pages directory
│   ├── _app.js            # Custom App component with Tailwind imports
│   └── index.js           # Main page with Hello World and themed buttons
└── styles/                # CSS files
    └── globals.css        # Global styles and Tailwind directives
```

## Implementation Steps

### 1. Dependencies Installation
- Install Electron for desktop app functionality
- Install Next.js for React-based frontend
- Install Tailwind CSS and PostCSS for styling
- Install Catppuccin Tailwind plugin for theme

### 2. Electron Main Process
- Create main.js to handle Electron app lifecycle
- Configure BrowserWindow with appropriate settings
- Set up IPC communication channels if needed

### 3. Next.js Configuration
- Configure Next.js to work with Electron
- Set up Tailwind CSS integration
- Create a responsive layout with Catppuccin theme

### 4. Catppuccin Theme Integration
- Configure Tailwind with Catppuccin plugin
- Import Catppuccin CSS flavor (mocha for dark theme)
- Create themed buttons using Catppuccin color palette

### 5. UI Implementation
- Create a Hello World display
- Implement several themed buttons showcasing Catppuccin colors
- Add basic interactivity to buttons
- Ensure responsive design

## Key Features
- Desktop application using Electron
- React-based UI with Next.js
- Soothing Catppuccin pastel theme
- Responsive design with Tailwind CSS
- Themed UI components (buttons)
- Minimal and clean implementation

## Development Workflow
1. Run `npm install` to install dependencies
2. Run `npm run dev` to start the development server
3. Run `npm run build` to create production build
4. Run `npm start` to launch Electron app

## Catppuccin Theme Integration Details
- Using @catppuccin/tailwindcss plugin
- Defaulting to "mocha" flavor (dark theme)
- Using ctp- prefix for all colors as per plugin docs
- Implementing gradient buttons as shown in plugin examples