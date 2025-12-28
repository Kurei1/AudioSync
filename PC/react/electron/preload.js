const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        // whitelist channels
        let validChannels = ['to-python', 'update-shortcuts'];
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data);
        }
    },
    on: (channel, func) => {
        let validChannels = ['from-python', 'update-available', 'update-progress', 'update-downloaded'];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    windowControl: (action) => ipcRenderer.send('window-control', action),
    adbCommand: (args) => ipcRenderer.invoke('adb-command', args),
    // Bluetooth Service
    bluetoothStart: () => ipcRenderer.invoke('bluetooth-start'),
    bluetoothStop: () => ipcRenderer.invoke('bluetooth-stop'),
    // Auto-Updater
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
});
