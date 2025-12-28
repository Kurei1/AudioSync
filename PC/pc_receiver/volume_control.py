import logging
import math
try:
    from comtypes import CLSCTX_ALL
    from pycaw.pycaw import AudioUtilities, ISimpleAudioVolume
except ImportError:
    # Fail silently or log if dependencies are missing, as per "Fail silently" if session not found,
    # but here it's dependencies. User should ensure they are installed.
    pass

class AudioSyncVolumeControl:
    """
    Controls the application volume for AudioSync using Windows Core Audio API (pycaw).
    Target process: AudioSync.exe
    """
    def __init__(self, target_process="AudioSync.exe"):
        self.target_process = target_process.lower()

    def change_volume(self, delta):
        """
        Adjusts the volume by delta (float, e.g. +0.05 or -0.05).
        Clamps between 0.0 and 1.0.
        """
        try:
            sessions = AudioUtilities.GetAllSessions()
            for session in sessions:
                # Check if session matches process name
                if session.Process and session.Process.name() and session.Process.name().lower() == self.target_process:
                    volume = session._ctl.QueryInterface(ISimpleAudioVolume)
                    current_vol = volume.GetMasterVolume()
                    
                    # Calculate new volume
                    new_vol = current_vol + delta
                    
                    # Safe clamping
                    if new_vol > 1.0:
                        new_vol = 1.0
                    elif new_vol < 0.0:
                        new_vol = 0.0
                    
                    # Apply volume
                    volume.SetMasterVolume(new_vol, None)
                    return new_vol
        except Exception as e:
            # "Fail silently" regarding crashes/UI freezes
            pass
        return None

    def get_volume(self):
        """Returns current volume (0.0 - 1.0)"""
        try:
            sessions = AudioUtilities.GetAllSessions()
            for session in sessions:
                if session.Process and session.Process.name() and session.Process.name().lower() == self.target_process:
                    volume = session._ctl.QueryInterface(ISimpleAudioVolume)
                    return volume.GetMasterVolume()
        except:
            pass
        return 0.0

    def toggle_mute(self):
        """Toggles mute state. Returns new mute state (True/False) or None on failure."""
        try:
            sessions = AudioUtilities.GetAllSessions()
            for session in sessions:
                if session.Process and session.Process.name() and session.Process.name().lower() == self.target_process:
                    volume = session._ctl.QueryInterface(ISimpleAudioVolume)
                    current_mute = volume.GetMute()
                    new_mute = not current_mute
                    volume.SetMute(new_mute, None)
                    return new_mute
        except:
            pass
        return None
