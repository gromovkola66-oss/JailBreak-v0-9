# JailBreak - Electron Desktop App

Desktop wrapper for the JailBreak game using Electron.

## Prerequisites

- Node.js 18+
- npm

## Quick Start (Development)

1. Build the game:
   ```bash
   cd ../JailBreak-1.2
   npm install
   npm run build
   ```

2. Copy the built game:
   ```bash
   mkdir -p app
   cp ../JailBreak-1.2/dist/index.html app/index.html
   ```

3. Install Electron dependencies:
   ```bash
   npm install
   ```

4. Generate the app icon:
   ```bash
   npm run generate-icon
   ```

5. Run the app:
   ```bash
   npm start
   ```

## Build Executable (Windows)

Run the full build script:
```bash
./build.sh
```

Or manually:
```bash
npm run build
```

Output will be in the `dist/` folder.

## Controls

- **F11** - Toggle fullscreen
- **Escape** - Exit fullscreen
- **Alt+F4** - Quit

## Project Structure

```
JailBreak-electron/
  main.js          - Electron main process
  preload.js       - Preload script (IPC placeholder)
  package.json     - App config and build settings
  generate-icon.js - Script to generate app icon
  build.sh         - Full build automation script
  app/
    index.html     - Built game (single HTML file)
  assets/
    icon.png       - App icon (256x256)
```
