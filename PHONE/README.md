# AudioSync - Android Sender

Android application that captures and streams system audio to your PC.

## Features

- 📱 Stream system audio (Android 10+)
- 📶 Wi-Fi streaming to PC receiver
- 🔌 USB tethering for ultra-low latency
- 🔔 Persistent notification during streaming
- 🎚️ Simple, intuitive interface

## Requirements

- Android 10 (API 29) or higher
- For USB mode: USB debugging enabled

## Building

### Debug APK
```bash
./gradlew assembleDebug
```
APK will be at `app/build/outputs/apk/debug/app-debug.apk`

### Release APK
```bash
./gradlew assembleRelease
```

## Project Structure

```
PHONE/
├── app/
│   ├── src/main/
│   │   ├── java/           # Kotlin/Java source
│   │   ├── res/            # Resources (layouts, drawables)
│   │   └── AndroidManifest.xml
│   └── build.gradle
│
├── gradle/                 # Gradle wrapper
├── build.gradle            # Project build config
└── settings.gradle         # Project settings
```

## Usage

1. Install the APK on your Android device
2. Open AudioSync and enter your PC's IP address
3. Set the port (default: 50005)
4. Tap "Start Streaming"
5. Grant audio capture permission when prompted
6. Audio from your phone is now streaming to your PC!

## Permissions

- **Audio Capture:** Required to stream system audio
- **Foreground Service:** Keeps streaming while app is in background
- **Network:** To send audio data to PC

## Troubleshooting

- **No permission dialog?** Make sure you're on Android 10+
- **Stream stops?** Check battery optimization settings
- **Can't connect?** Ensure PC and phone are on same network
