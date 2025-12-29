const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');

let mainWindow;
let pythonProcess;
let bluetoothProcess = null;
let tray = null;
let isQuitting = false;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1172,
        height: 780,
        minWidth: 879,
        minHeight: 743,
        frame: false,
        icon: path.join(__dirname, '../assets/images/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        autoHideMenuBar: true,
    });

    // Minimize to tray on close instead of quitting
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // Determine URL: dev server or static file
    // When running 'npm run electron:dev', we wait for vite port 5173
    const devUrl = 'http://localhost:5173';

    mainWindow.loadURL(devUrl).catch(e => {
        console.error("Failed to load url, falling back to index.html (if built)", e);
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    });

    // Send PC hostname and IP to renderer once window is ready
    mainWindow.webContents.on('did-finish-load', () => {
        const pcName = process.env.COMPUTERNAME || os.hostname();

        // Get local IPv4 address
        let localIp = '127.0.0.1';
        const networkInterfaces = os.networkInterfaces();
        for (const interfaceName of Object.keys(networkInterfaces)) {
            for (const iface of networkInterfaces[interfaceName]) {
                // Skip internal and non-IPv4 addresses
                if (!iface.internal && iface.family === 'IPv4') {
                    localIp = iface.address;
                    break;
                }
            }
            if (localIp !== '127.0.0.1') break;
        }

        // Send PC hostname
        mainWindow.webContents.send('from-python', {
            type: 'pc_hostname',
            data: pcName
        });

        // Send system info (IP + hostname)
        mainWindow.webContents.send('from-python', {
            type: 'info',
            data: { ip: localIp, hostname: pcName }
        });
    });

    // Spawn Python Process
    let pythonCmd;
    let pythonArgs = [];

    if (app.isPackaged) {
        // In production, run the bundled EXE directly
        pythonCmd = path.join(process.resourcesPath, 'pc_receiver', 'AudioSync Audio Service.exe');
        console.log(`Launching Bundled Python EXE: ${pythonCmd}`);
    } else {
        // In development, run the script via system python
        const scriptPath = path.resolve(__dirname, '../../pc_receiver/headless_receiver.py');
        pythonCmd = 'python';
        pythonArgs = ['-u', scriptPath];
        console.log(`Launching Python script: ${scriptPath}`);
    }

    // Spawn process
    pythonProcess = spawn(pythonCmd, pythonArgs);

    pythonProcess.on('error', (err) => {
        console.error('Failed to start python process:', err);
    });

    pythonProcess.stdout.on('data', (data) => {
        const str = data.toString();
        // Split functionality for multiple JSON objects in one chunk
        const lines = str.split('\n');
        lines.forEach(line => {
            if (!line.trim()) return;
            try {
                const msg = JSON.parse(line);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('from-python', msg);
                }
            } catch (e) {
                // Log but ignore non-JSON (maybe debug prints leaked)
                console.log('Python Non-JSON Output:', line);
            }
        });
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Log: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });

    // Create system tray (only once)
    if (!tray) {
        const { nativeImage } = require('electron');

        // Get icon path - use .ico for Windows tray
        let iconPath;
        if (app.isPackaged) {
            // Production: use asar path
            iconPath = path.join(app.getAppPath(), 'assets', 'images', 'favicon.ico');
        } else {
            // Development
            iconPath = path.join(__dirname, '../assets/images/favicon.ico');
        }

        console.log('Tray icon path:', iconPath);

        // Use the ico directly for Windows tray
        tray = new Tray(iconPath);

        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Show AudioSync',
                click: () => {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => {
                    isQuitting = true;
                    app.quit();
                }
            }
        ]);

        tray.setToolTip('AudioSync Receiver');
        tray.setContextMenu(contextMenu);

        // Double-click tray icon to show window
        tray.on('double-click', () => {
            mainWindow.show();
            mainWindow.focus();
        });
    }
}

// Single instance lock - prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    // Another instance is already running, quit this one
    app.quit();
} else {
    // This is the first instance
    app.on('second-instance', () => {
        // Someone tried to run a second instance, focus our window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();

        // Check for updates after window is ready (only in production)
        if (app.isPackaged) {
            autoUpdater.checkForUpdates();
        }

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

// ===================== AUTO-UPDATER EVENTS =====================

autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-available', {
            version: info.version,
            releaseNotes: info.releaseNotes
        });
    }
});

autoUpdater.on('update-not-available', () => {
    console.log('[Updater] No updates available.');
});

autoUpdater.on('download-progress', (progress) => {
    console.log(`[Updater] Download: ${Math.round(progress.percent)}%`);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-progress', {
            percent: Math.round(progress.percent),
            transferred: progress.transferred,
            total: progress.total
        });
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-downloaded', {
            version: info.version
        });
    }
});

autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err);
});

// IPC handlers for update actions
ipcMain.handle('check-for-updates', async () => {
    try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, version: result?.updateInfo?.version };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('download-update', async () => {
    try {
        // Ensure we have an update to download
        // If we just blindly call downloadUpdate(), it throws "Please check update first" if no update is pending
        // So we force a check if we aren't already downloading
        if (!autoUpdater.currentVersion) {
            await autoUpdater.checkForUpdates();
        }

        const cancellationToken = await autoUpdater.downloadUpdate();
        return { success: true };
    } catch (err) {
        console.error("Download update failed, trying to double-check update first:", err);
        // Retry logic: If it failed, maybe because we didn't check properly?
        try {
            await autoUpdater.checkForUpdates();
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (retryErr) {
            return { success: false, error: retryErr.message };
        }
    }
});

ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

app.on('window-all-closed', () => {
    // Don't quit on window close - we minimize to tray
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
    globalShortcut.unregisterAll();
});

// IPC Handlers
ipcMain.on('to-python', (event, args) => {
    if (pythonProcess && pythonProcess.stdin) {
        const cmd = JSON.stringify(args) + '\n';
        pythonProcess.stdin.write(cmd);
    }
});

ipcMain.on('window-control', (event, action) => {
    if (!mainWindow) return;
    switch (action) {
        case 'minimize':
            mainWindow.minimize();
            break;
        case 'maximize':
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
            break;
        case 'close':
            mainWindow.close();
            break;
        default:
            break;
    }
});

// ===================== KEYBOARD SHORTCUTS =====================

ipcMain.on('update-shortcuts', (event, shortcuts) => {
    // shortcuts: { volUp: '...', volDown: '...', mute: '...' }
    globalShortcut.unregisterAll();

    try {
        if (shortcuts.volUp) {
            globalShortcut.register(shortcuts.volUp, () => {
                if (pythonProcess && pythonProcess.stdin) {
                    pythonProcess.stdin.write(JSON.stringify({ command: 'volume_up' }) + '\n');
                }
            });
        }
        if (shortcuts.volDown) {
            globalShortcut.register(shortcuts.volDown, () => {
                if (pythonProcess && pythonProcess.stdin) {
                    pythonProcess.stdin.write(JSON.stringify({ command: 'volume_down' }) + '\n');
                }
            });
        }
        if (shortcuts.mute) {
            globalShortcut.register(shortcuts.mute, () => {
                if (pythonProcess && pythonProcess.stdin) {
                    pythonProcess.stdin.write(JSON.stringify({ command: 'mute_toggle' }) + '\n');
                }
            });
        }
        console.log('[Shortcuts] Updated:', shortcuts);
    } catch (e) {
        console.error('[Shortcuts] Registration failed:', e);
    }
});


// ADB Wrapper
const { execFile } = require('child_process');
// Resolve ADB path dynamically based on environment
let adbPath;
if (app.isPackaged) {
    adbPath = path.join(process.resourcesPath, 'pc_receiver', 'platform-tools', 'adb.exe');
} else {
    adbPath = path.resolve(__dirname, '../../pc_receiver/platform-tools/adb.exe');
}

ipcMain.handle('adb-command', async (event, args) => {
    // args: ['devices', '-l'] or ['-s', 'serial', 'reverse', 'tcp:50005', 'tcp:50005']
    return new Promise((resolve, reject) => {
        console.log(`Executing ADB: ${adbPath} ${args.join(' ')}`);
        execFile(adbPath, args, (error, stdout, stderr) => {
            if (error) {
                // ENOENT means adb.exe not found
                if (error.code === 'ENOENT') {
                    resolve({ success: false, error: 'ADB tool missing. Please restart app after adding platform-tools.' });
                } else {
                    resolve({ success: false, error: stderr || error.message });
                }
                return;
            }
            resolve({ success: true, output: stdout });
        });
    });
});

// ===================== KEYBOARD SHORTCUTS =====================

ipcMain.on('update-shortcuts', (event, shortcuts) => {
    // shortcuts: { volUp: '...', volDown: '...', mute: '...' }
    globalShortcut.unregisterAll();

    try {
        if (shortcuts.volUp) {
            globalShortcut.register(shortcuts.volUp, () => {
                if (pythonProcess && pythonProcess.stdin) {
                    pythonProcess.stdin.write(JSON.stringify({ command: 'volume_up' }) + '\n');
                }
            });
        }
        if (shortcuts.volDown) {
            globalShortcut.register(shortcuts.volDown, () => {
                if (pythonProcess && pythonProcess.stdin) {
                    pythonProcess.stdin.write(JSON.stringify({ command: 'volume_down' }) + '\n');
                }
            });
        }
        if (shortcuts.mute) {
            globalShortcut.register(shortcuts.mute, () => {
                if (pythonProcess && pythonProcess.stdin) {
                    pythonProcess.stdin.write(JSON.stringify({ command: 'mute_toggle' }) + '\n');
                }
            });
        }
        console.log('[Shortcuts] Updated:', shortcuts);
    } catch (e) {
        console.error('[Shortcuts] Registration failed:', e);
    }
});


// ===================== BLUETOOTH SERVICE =====================
// Uses bluetooth_receiver.exe for A2DP sink functionality

let bluetoothExePath;
let bluetoothUseExe = false;

if (app.isPackaged) {
    bluetoothExePath = path.join(process.resourcesPath, 'pc_receiver', 'AudioSync Bluetooth Mode.exe');
    bluetoothUseExe = true;
} else {
    // In dev mode, use Python script directly
    bluetoothExePath = path.resolve(__dirname, '../../pc_receiver/bluetooth_receiver.py');
    bluetoothUseExe = false;
}

ipcMain.handle('bluetooth-start', async () => {
    // If already running, do nothing
    if (bluetoothProcess && !bluetoothProcess.killed) {
        console.log('[Bluetooth] Service already running.');
        return { success: true, message: 'Already running' };
    }

    console.log(`[Bluetooth] Launching: ${bluetoothExePath}`);

    try {
        if (bluetoothUseExe) {
            bluetoothProcess = spawn(bluetoothExePath, [], {
                windowsHide: true
            });
        } else {
            bluetoothProcess = spawn('python', ['-u', bluetoothExePath], {
                windowsHide: true
            });
        }

        // Send PC Bluetooth display name to renderer immediately
        const pcName = process.env.COMPUTERNAME || os.hostname();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('from-python', {
                type: 'pc_hostname',
                data: pcName
            });
        }

        bluetoothProcess.on('error', (err) => {
            console.error('[Bluetooth] Failed to start:', err);
        });

        let pendingDeviceName = null; // Store name until connection confirmed

        bluetoothProcess.stdout.on('data', (data) => {
            const str = data.toString();
            console.log('[Bluetooth] stdout:', str);

            // Parse JSON messages from Python
            const lines = str.split('\n');
            lines.forEach(line => {
                if (!line.trim()) return;
                try {
                    const msg = JSON.parse(line);

                    // Capture device name from "waiting" status (store but DON'T send yet)
                    if (msg.status === 'waiting' && msg.message) {
                        const match = msg.message.match(/Waiting for device: (.+)/);
                        if (match && match[1]) {
                            pendingDeviceName = match[1];
                            console.log('[Bluetooth] Detected device:', pendingDeviceName);
                        }
                    }

                    // When receiver_mode is reached, phone is ACTUALLY connected - send name now
                    if (msg.status === 'receiver_mode' && mainWindow && !mainWindow.isDestroyed()) {
                        if (pendingDeviceName) {
                            mainWindow.webContents.send('from-python', {
                                type: 'bluetooth_device_name',
                                data: pendingDeviceName
                            });
                        }
                    }
                } catch (e) {
                    // Non-JSON output, ignore
                }
            });
        });

        bluetoothProcess.stderr.on('data', (data) => {
            console.error('[Bluetooth] stderr:', data.toString());
        });

        bluetoothProcess.on('close', (code) => {
            console.log(`[Bluetooth] Process exited with code ${code}`);
            bluetoothProcess = null;
        });

        return { success: true, message: 'Service started' };
    } catch (err) {
        console.error('[Bluetooth] Spawn error:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('bluetooth-stop', async () => {
    console.log('[Bluetooth] Stop requested.');

    // Force kill the Bluetooth process
    if (bluetoothProcess && !bluetoothProcess.killed) {
        try {
            bluetoothProcess.kill('SIGKILL');
        } catch (e) {
            console.error('[Bluetooth] Kill error:', e);
        }
        bluetoothProcess = null;
    }

    // Run ipconfig /flushdns (best-effort, do NOT wait or block)
    exec('ipconfig /flushdns', (error, stdout, stderr) => {
        if (error) {
            console.error('[Bluetooth] flushdns error:', error);
        } else {
            console.log('[Bluetooth] flushdns:', stdout);
        }
    });

    // Immediately return - do NOT wait for cleanup
    return { success: true, message: 'Service stopped' };
});
