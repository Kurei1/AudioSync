import asyncio
import json
import sys
import os
import signal
import time
import pyaudio

from winsdk.windows.devices.enumeration import DeviceInformation
from winsdk.windows.media.audio import AudioPlaybackConnection

# ===================== CONFIG =====================
CHUNK_SIZE = 1024
SAMPLE_RATE = 44100
CHANNELS = 2
FORMAT = pyaudio.paInt16

# ===================== UTIL =====================
def log(status, message=None):
    data = {"status": status}
    if message:
        data["message"] = message
    print(json.dumps(data), flush=True)

def run_cleanup_commands():
    """
    Best-effort cleanup.
    This does NOT guarantee full Bluetooth restoration.
    """
    try:
        os.system("ipconfig /flushdns > nul")
        return True
    except Exception:
        return False

# ===================== MAIN RECEIVER =====================
async def bluetooth_receiver():
    log("starting", "Bluetooth Receiver (Experimental)")

    connection = None
    p = None
    stream = None

    try:
        # --- 1. Enumerate Bluetooth Audio Devices ---
        selector = AudioPlaybackConnection.get_device_selector()
        devices = await DeviceInformation.find_all_async(selector, [])

        if not devices:
            log("error", "No paired Bluetooth audio device found.")
            return

        target = devices[0]
        log("waiting", f"Waiting for device: {target.name}")

        # --- 2. Create Playback Connection ---
        connection = AudioPlaybackConnection.try_create_from_id(target.id)
        if not connection:
            log("error", "Failed to create AudioPlaybackConnection.")
            return

        # IMPORTANT: Give Windows time to settle Bluetooth state
        await asyncio.sleep(1.5)

        # --- 3. Start Receiver Mode (ONE TIME ONLY) ---
        await connection.start_async()
        log("receiver_mode", "PC is now acting as a Bluetooth speaker")

        # --- 4. Anchor Windows Audio Session ---
        p = pyaudio.PyAudio()
        stream = p.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=SAMPLE_RATE,
            output=True,
            frames_per_buffer=CHUNK_SIZE
        )

        silence = b"\x00" * (CHUNK_SIZE * CHANNELS * 2)
        log("running", "Audio keep-alive active")

        # --- 5. Keep Alive Loop ---
        while True:
            stream.write(silence, exception_on_underflow=False)
            await asyncio.sleep(0)  # yield to event loop

    except asyncio.CancelledError:
        pass
    except Exception as e:
        log("error", f"Runtime failure: {str(e)}")

    finally:
        # --- ORDERED SHUTDOWN (CRITICAL) ---
        log("stopping", "Stopping Bluetooth receiver")

        try:
            await asyncio.sleep(1.0)  # allow audio graph to drain
        except:
            pass

        if stream:
            try:
                stream.stop_stream()
                stream.close()
            except:
                pass

        if p:
            try:
                p.terminate()
            except:
                pass

        if connection:
            try:
                connection.close()
            except:
                pass

        # --- USER-AWARE CLEANUP ---
        log("cleanup", "Attempting system cleanup (ipconfig /flushdns)")
        success = run_cleanup_commands()

        if success:
            log(
                "notice",
                "Bluetooth receiver stopped. "
                "If Bluetooth behaves incorrectly, please reboot the PC."
            )
        else:
            log(
                "notice",
                "Cleanup failed. Please reboot the PC to restore Bluetooth."
            )

        log("stopped")

# ===================== ENTRY =====================
def main():
    try:
        asyncio.run(bluetooth_receiver())
    except KeyboardInterrupt:
        pass
    finally:
        # HARD EXIT — ensures Python process is fully killed
        os._exit(0)

if __name__ == "__main__":
    main()
