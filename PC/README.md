# AudioSync - PC Receiver

Windows desktop application that receives and plays audio streamed from your Android phone.

## Features

- 🎛️ Modern UI built with Electron + React
- 📶 Multiple connection methods (LAN, USB, Bluetooth)
- 🔊 Configurable audio buffer for latency tuning
- ⌨️ Global keyboard shortcuts for volume control
- 📥 Auto-updates with delta downloads (small update sizes)
- 🖥️ System tray support

## Requirements

- Windows 10/11
- Python 3.8+ (for audio backend)
- Node.js 18+ (for building)

## Quick Start

### Running in Development
```bash
cd react
npm install
npm run electron:dev
```

### Building for Production
```bash
cd react
npm run electron:build
```

The installer will be created in `react/dist-electron/`.

## Project Structure

```
PC/
├── react/                  # Electron + React frontend
│   ├── electron/           # Main process (main.js, preload.js)
│   ├── src/                # React components
│   ├── assets/             # Icons and images
│   └── package.json        # Build configuration
│
└── pc_receiver/            # Python audio backend
    ├── headless_receiver.py    # Main audio receiver
    ├── volume_control.py       # Volume management
    └── platform-tools/         # ADB tools for USB mode
```

## Configuration

Audio settings can be adjusted in the UI:
- **Buffer Size:** Lower = less latency, higher = smoother audio
- **Output Device:** Select your preferred audio device
- **Shortcuts:** Customize volume up/down/mute hotkeys

## Troubleshooting

- **No audio?** Check that Python is installed and the receiver is running
- **High latency?** Try reducing buffer size or use USB mode
- **USB not working?** Enable USB debugging on your phone first
