# AudioSync

<p align="center">
  <img src="assets/phone-icon.png" alt="Phone App" width="100"/>
  &nbsp;&nbsp;&nbsp;➡️&nbsp;&nbsp;&nbsp;
  <img src="assets/pc-icon.png" alt="PC Receiver" width="100"/>
</p>

<p align="center">
  <strong>Stream audio from your Android phone to your Windows PC in real-time.</strong>
</p>

AudioSync is an open-source project that lets you use your phone as a wireless audio source for your PC. Perfect for:
- 🎧 Listening to phone audio through PC speakers/headphones
- 🎮 Gaming with phone audio output
- 📺 Watching content with low-latency audio sync

---

## Features

- **Multiple Connection Methods:**
  - 📶 **LAN (Wi-Fi)** - Stream over your local network
  - 🔌 **USB Tether** - Ultra-low latency via USB debugging
  - 🔵 **Bluetooth A2DP** - Wireless with no app needed on phone (experimental)

- **PC Receiver:**
  - Modern Electron-based UI
  - System tray support (minimize to tray)
  - Customizable audio buffer for latency tuning
  - Global keyboard shortcuts for volume control
  - Auto-updates with delta downloads

- **Android Sender:**
  - Stream system audio (Android 10+)
  - Simple, intuitive interface
  - Background streaming support

---

## Download

### PC Receiver (Windows)
Download the latest installer from [Releases](https://github.com/Kurei1/AudioSync/releases).

### Android App
Download the APK from [Releases](https://github.com/Kurei1/AudioSync/releases) or build from source.

---

## Project Structure

```
AudioSync/
├── PC/                     # Windows desktop receiver
│   ├── react/              # Electron + React UI
│   └── pc_receiver/        # Python audio backend
│
├── PHONE/                  # Android sender app
│   ├── app/                # Android source code
│   └── ...                 # Gradle build files
│
└── README.md               # This file
```

---

## Building from Source

### PC Receiver
```bash
cd PC/react
npm install
npm run electron:build    # Creates installer
```

### Android App
```bash
cd PHONE
./gradlew assembleDebug   # Creates APK
```

---

## Quick Start

1. Install the PC receiver and Android app
2. Connect both devices to the same Wi-Fi network
3. Start the PC receiver and note the IP address
4. Enter the IP in the Android app and tap "Start"
5. Audio from your phone now plays on your PC!

---

## Connection Methods

### 📶 Wi-Fi (LAN)
Stream audio over your local network. Both devices must be on the same Wi-Fi.
- **Latency:** ~20-60ms
- **Requirements:** Both devices on same network

### 🔌 USB Tether
Ultra-low latency via USB debugging (ADB).
- **Latency:** ~0-20ms
- **Requirements:** USB cable, USB debugging enabled on phone

### 🔵 Bluetooth A2DP (Experimental)
Makes your PC act as a Bluetooth speaker. Your phone sends audio directly via Bluetooth.
- **Latency:** ~0-20ms
- **Requirements:** Bluetooth on both devices, `winsdk` and `pyaudio` Python packages
- **No Android app needed** - just pair and play!

#### How Bluetooth Mode Works:
1. Click "Start Service" on the PC app's Bluetooth tab
2. Your PC becomes discoverable as a Bluetooth audio device
3. Pair your phone with the PC from your phone's Bluetooth settings
4. Play audio on your phone - it streams to your PC!

#### ⚠️ Bluetooth Notes:
- Windows does not natively support A2DP sink mode, so this is experimental
- If Bluetooth behaves incorrectly after stopping, restart your PC
- Use your phone's volume buttons to control audio level

---

## Support the Developer

AudioSync is free and open source. If you find it useful, consider supporting:

- ☕ **PayPal:** animecore2020@gmail.com
- 💰 **Binance Pay:** ID 763038084
- 💰 **ByBit:** ID 416909609
- 📱 **Instagram:** [@kurei.111](https://instagram.com/kurei.111)
- 📧 **Email:** audio.sync.2025@gmail.com

---

## License

MIT License - Feel free to use, modify, and distribute.

---

Made with ❤️ by [Kurei](https://github.com/Kurei1)
