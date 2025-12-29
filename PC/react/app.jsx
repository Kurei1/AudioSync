import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    AlertCircle,
    Bell,
    BellOff,
    Settings,
    Wifi,
    Bluetooth,
    Smartphone,
    Coffee,
    Sun,
    Moon,
    ChevronRight,
    Info,
    Cpu,
    Volume2,
    ShieldCheck,
    ExternalLink,
    X,
    Sliders,
    Wallet,
    Cable,
    Usb,
    CreditCard,
    QrCode,
    Instagram,
    Mail,
    HeartHandshake,
    Speaker,
    VolumeX,
    Keyboard,
    RotateCcw,
    Minus,
    Square,
    RefreshCw,
    Shuffle,
    Lock,
    Eye,
    EyeOff,
    Globe,
    Languages,
    FileText
} from 'lucide-react';

import connSound from './assets/sounds/conn.mp3';
import discSound from './assets/sounds/disc.mp3';
import notifSound from './assets/sounds/Notif.mp3';
import failedSound from './assets/sounds/Failed.mp3';
import errorSound from './assets/sounds/error.mp3';
import binanceQR from './assets/images/binqr.jpg';
import bybitQR from './assets/images/byqr.jpg';

/**
 * AudioSync Receiver UI
 * A modern, responsive interface for a desktop audio receiver.
 * Built with React and Tailwind CSS.
 */

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-900 text-white h-screen overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
                    <pre className="font-mono text-xs bg-black/50 p-4 rounded whitespace-pre-wrap">
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white text-red-900 rounded font-bold">
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Reusable Modal Component
const Modal = ({ isOpen, onClose, title, children, action, rightAction, maxWidth = 'max-w-md', isDarkMode = true, hideClose = false }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full ${maxWidth} rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}>
                <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50/50'}`}>
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {rightAction}
                        {!hideClose && (
                            <button onClick={onClose} className="p-2 hover:bg-zinc-500/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
                {children}
                {action && (
                    <div className={`p-6 border-t flex justify-end ${isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-100 bg-zinc-50/30'}`}>
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
};

const App = () => {
    // Theme and UI State
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Language state (en = English, ar = Arabic)
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('app_language') || 'en';
    });

    // Terms of use acceptance
    const [termsAccepted, setTermsAccepted] = useState(() => {
        return localStorage.getItem('terms_accepted') === 'true';
    });
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    // Translations
    const translations = {
        en: {
            // Title bar
            appName: "AudioSync",
            receiver: "Receiver",
            // Methods
            lanNetwork: "LAN Network",
            usbTether: "USB Tether",
            bluetooth: "Bluetooth",
            // Settings
            listenPort: "Listen Port",
            random: "RANDOM",
            outputDevice: "Output Device",
            defaultOutput: "Default System Output",
            volumeControls: "Volume Controls",
            volumeUp: "Volume Up",
            volumeDown: "Volume Down",
            muteUnmute: "Mute / Unmute",
            // Status
            readyToConnect: "Disconnected",
            receiverActive: "Connected",
            connecting: "Connecting...",
            connectionFailed: "Connection Failed",
            receivingAudio: "Receiving audio stream...",
            waitingPackets: "Waiting for audio packets...",
            connectPhone: "Connect your phone to the IP below",
            startListening: "Start Service",
            stopListening: "Stop Listening",
            serviceStarted: "Service started",
            serviceStopped: "Service stopped",
            // Info panels
            wifiReceiver: "Wi-Fi Audio Receiver",
            usbBridge: "USB Audio Bridge",
            usbTunnelActive: "USB Tunnel Active",
            usbSetupFailed: "USB Setup Failed",
            disconnectedStopStream: "Disconnected, make sure to stop streaming from your phone",
            deviceDisconnected: "Device Disconnected",
            connectDeviceFirst: "Connect your device first",
            bluetoothExp: "Bluetooth A2DP (Experimental)",
            // Stats
            deviceIP: "Device IP",
            phoneName: "Phone Name",
            bluetoothName: "Bluetooth Name",
            connectedTo: "Connected to",
            estLatency: "Est. Latency",
            stats: "Stats",
            // Footer
            supportDev: "Support the Developer",
            // Modal titles
            notifications: "Notifications",
            noNotifications: "No new notifications",
            clearNotifications: "Clear Notifications",
            termsTitle: "Terms of Use",
            termsAccept: "I Accept",
            // Instructions
            wifiStep1: "Connect both devices to the same Wi-Fi.",
            wifiStep2: "Enter the Server IP & Port in the app.",
            wifiStep3: "Start Streaming from the phone.",
            wifiStep4: "Click Start Listening.",
            wifiStep5: "Use the volume shortcuts to adjust the volume.",
            usbStep1: "Enable USB Debugging (check phone app for info).",
            usbStep2: "Connect via USB and allow the connection prompt.",
            usbStep3: "Start Streaming from the phone.",
            usbStep4: "Select your device and click Start Listening.",
            usbStep5: "Use the volume shortcuts to adjust the volume.",
            // Bluetooth instructions
            bluetoothStep1: "Enable Bluetooth on both devices.",
            bluetoothStep2: "Click Start Service.",
            bluetoothStep3: "Pair your phone with this PC (from your phone).",
            bluetoothStep4: "",
            buffer: "Buffer",
            fasterAudio: "Faster Audio",
            smootherAudio: "Smoother Audio",
            androidDevice: "Android Device",
            noDevices: "No devices found",
            adbMissing: "ADB Tools Missing",
            // Volume note
            volumeNote: "Shortcuts are global and override other apps (e.g. Ctrl+V stops working for Paste). Invalid combinations (like 3 keys without modifiers) may not record.",
            // Notification modal
            muteNotifications: "Mute Notifications",
            unmuteNotifications: "Unmute Notifications",
            // Bluetooth warning
            bluetoothNote: "Windows does not natively support this method, which may cause temporary Bluetooth instability.",
            bluetoothStep3_Alt: "No Sound? Disconnect and connect again.",
            bluetoothStep4_Alt: "Use phone buttons to control volume.",
            // Stats status
            active: "Active",
            idle: "Idle",
            rec: "Rec:",
            lost: "Lost:",
            bluetoothExp: "Bluetooth A2DP (Experimental)",
            // Support
            supportTitle: "Support AudioSync",
            chooseMethod: "Choose Method",
            customSupport: "Custom Support",
            supportMsg1: '"AudioSync is a solo project built by one developer. Even a $1 contribution makes a massive difference to me."',
            supportMsg2: "Help maintain the project and support future feature development.",
            buyCoffee: "Buy me a coffee",
            supportContact: "Support your way (Contact)",
            back: "← Back",
            paypalDesc: "Send directly via email",
            cryptoDesc: "Crypto payment with QR",
            paypalInfo: "Due to regional restrictions, I can't have a PayPal.me link. However, you can send money directly to my PayPal email:",
            paypalStep: "Open PayPal → Send → Enter this email → Send payment",
            cryptoScan: "Scan the QR code with your Binance or ByBit app to send payment",
            reachOut: "Reach out to me directly if you'd like to support the project in a different way:",
            emailMe: "Email Me",
            // Update
            downloading: "Downloading",
            restartToInstall: "Restart to Install",
            downloadUpdate: "Download Update",
            updated: "Updated",
            couldNotReceiveData: "Could not receive any data.",
        },
        ar: {
            // Title bar
            appName: "أوديو سينك",
            receiver: "المستقبل",
            // Methods
            lanNetwork: "شبكة محلية",
            usbTether: "ربط الـ USB",
            bluetooth: "بلوتوث",
            // Settings
            listenPort: "منفذ الاستماع",
            random: "عشوائي",
            outputDevice: "جهاز إخراج الصوت",
            defaultOutput: "مكبر الصوت الافتراضي",
            volumeControls: "التحكم في الصوت",
            volumeUp: "رفع الصوت",
            volumeDown: "خفض الصوت",
            muteUnmute: "كتم / إلغاء الكتم",
            // Status
            readyToConnect: "غير متصل",
            receiverActive: "متصل",
            connecting: "جاري الاتصال...",
            connectionFailed: "فشل الاتصال",
            receivingAudio: "جاري استقبال البث...",
            waitingPackets: "في انتظار حزم الصوت...",
            connectPhone: "قم بتوصيل هاتفك بعنوان IP أدناه",
            startListening: "بدء الخدمة",
            stopListening: "إيقاف الخدمة",
            serviceStarted: "الخدمة نشطة",
            serviceStopped: "الخدمة موقفة",
            // Info panels
            wifiReceiver: "مستقبل صوت Wi-Fi",
            usbBridge: "جسر صوت USB",
            usbTunnelActive: "نفق USB نشط",
            usbSetupFailed: "فشل إعداد USB",
            disconnectedStopStream: "غير متصل، تأكد من إيقاف البث من هاتفك",
            deviceDisconnected: "انقطع اتصال الجهاز",
            connectDeviceFirst: "قم بتوصيل جهازك أولاً",
            bluetoothExp: "بلوتوث A2DP (تجريبي)",
            // Stats
            deviceIP: "عنوان IP",
            phoneName: "اسم الهاتف",
            bluetoothName: "اسم البلوتوث",
            connectedTo: "متصل بـ",
            estLatency: "التأخير المقدر",
            stats: "الإحصائيات",
            // Footer
            supportDev: "ادعم المطور",
            // Modal titles
            notifications: "الإشعارات",
            noNotifications: "لا توجد إشعارات جديدة",
            clearNotifications: "مسح الإشعارات",
            termsTitle: "شروط الاستخدام",
            termsAccept: "أوافق",
            // Instructions - keep technical terms in English
            wifiStep1: "قم بتوصيل كلا الجهازين بنفس شبكة Wi-Fi.",
            wifiStep2: "أدخل عنوان Server IP و Port في التطبيق.",
            wifiStep3: "ابدأ البث من الهاتف.",
            wifiStep4: "انقر على بدء الخدمة.",
            wifiStep5: "استخدم اختصارات الصوت لضبط مستوى الصوت.",
            usbStep1: "قم بتمكين USB Debugging (تحقق من تطبيق الهاتف).",
            usbStep2: "قم بالتوصيل عبر USB واسمح بطلب الاتصال.",
            usbStep3: "ابدأ البث من الهاتف.",
            usbStep4: "حدد جهازك وانقر على بدء الخدمة.",
            usbStep5: "استخدم اختصارات الصوت لضبط مستوى الصوت.",
            // Bluetooth instructions
            bluetoothStep1: "قم بتشغيل Bluetooth على كلا الجهازين.",
            bluetoothStep2: "انقر على بدء الخدمة.",
            bluetoothStep3: "قم بإقران الهاتف مع هذا الكمبيوتر (من الهاتف).",
            bluetoothStep4: "",
            bluetoothStep3_Alt: "لا يوجد صوت؟ افصل وأعد الاتصال.",
            bluetoothStep4_Alt: "للتحكم في مستوى الصوت إستعمل أزرار الهاتف",
            bluetoothNote: "Windows لا يدعم هذه الطريقة بشكل أصلي، مما قد يسبب عدم استقرار مؤقت في البلوتوث.",
            // Buffer - keep in English
            buffer: "Buffer",
            fasterAudio: "Faster Audio",
            smootherAudio: "Smoother Audio",
            androidDevice: "جهاز Android",
            noDevices: "لم يتم العثور على أجهزة",
            adbMissing: "أدوات ADB مفقودة",
            // Volume note
            volumeNote: "الاختصارات عامة وتتجاوز التطبيقات الأخرى (مثل Ctrl+V يتوقف عن اللصق). التركيبات غير الصالحة (مثل 3 مفاتيح بدون معدّلات) قد لا تُسجّل.",
            // Notification modal
            muteNotifications: "كتم الإشعارات",
            unmuteNotifications: "إلغاء كتم الإشعارات",
            // Stats Status
            active: "نشط",
            idle: "خامل",
            rec: "استلام:",
            lost: "مفقود:",
            // Support
            supportTitle: "دعم أوديو سينك",
            chooseMethod: "اختر الطريقة",
            customSupport: "دعم مخصص",
            supportMsg1: '"أوديو سينك هو مشروع فردي قام ببنائه مطور واحد. حتى مساهمة بـ 1 دولار تحدث فرقًا كبيرًا بالنسبة لي."',
            supportMsg2: "ساعد في الحفاظ على المشروع ودعم تطوير الميزات المستقبلية.",
            buyCoffee: "اشترِ لي قهوة",
            supportContact: "طرق أخرى للدعم (تواصل معي)",
            back: "→ رجوع",
            paypalDesc: "إرسال مباشرة عبر البريد الإلكتروني",
            cryptoDesc: "دفع العملات المشفرة باستخدام QR",
            paypalInfo: "نظرًا للقيود الإقليمية، لا يمكنني الحصول على رابط PayPal.me. ومع ذلك، يمكنك إرسال الأموال مباشرة إلى بريد PayPal الخاص بي:",
            paypalStep: "افتح PayPal ← إرسال ← أدخل هذا البريد الإلكتروني ← إرسال الدفعة",
            cryptoScan: "امسح رمز QR باستخدام تطبيق Binance أو ByBit لإرسال الدفعة",
            reachOut: "تواصل معي مباشرة إذا كنت ترغب في دعم المشروع بطريقة مختلفة:",
            emailMe: "راسلني",
            // Update
            downloading: "جاري التحميل",
            restartToInstall: "أعد التشغيل للتثبيت",
            downloadUpdate: "تنزيل التحديث",
            updated: "محّدث",
            couldNotReceiveData: "تعذر استقبال البيانات.",
        }
    };

    // Get translation helper
    const t = (key) => translations[language]?.[key] || translations.en[key] || key;

    // Toggle language
    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ar' : 'en';
        setLanguage(newLang);
        localStorage.setItem('app_language', newLang);
    };

    // Accept terms
    const acceptTerms = () => {
        setTermsAccepted(true);
        localStorage.setItem('terms_accepted', 'true');
        setIsTermsOpen(false);
    };

    // Show terms on first launch
    useEffect(() => {
        if (!termsAccepted) {
            setIsTermsOpen(true);
        }
    }, []);
    // ... (rest of state)

    const [activeMethod, setActiveMethod] = useState('lan');
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [updateDownloading, setUpdateDownloading] = useState(false);
    const [updateProgress, setUpdateProgress] = useState(0);
    const [readyUpdateId, setReadyUpdateId] = useState(null); // Stores ID of the update that is ready to install
    const downloadingIdRef = useRef(null); // Ref to track downloading ID inside callbacks

    const [isSoundMuted, setIsSoundMuted] = useState(() => {
        return localStorage.getItem('sound_muted') === 'true';
    });

    const toggleSoundMute = () => {
        setIsSoundMuted(prev => {
            const newValue = !prev;
            localStorage.setItem('sound_muted', String(newValue));
            return newValue;
        });
    };

    // --- SHORTCUTS STATE ---
    const [shortcuts, setShortcuts] = useState(() => {
        const saved = localStorage.getItem('app_shortcuts');
        return saved ? JSON.parse(saved) : {
            volUp: 'Ctrl+V+Up',
            volDown: 'Ctrl+V+Down',
            mute: 'Ctrl+Shift+M'
        };
    });

    const [isRecording, setIsRecording] = useState(null); // 'volUp', 'volDown', 'mute' or null

    useEffect(() => {
        localStorage.setItem('app_shortcuts', JSON.stringify(shortcuts));
        // Send to Electron
        if (window.electronAPI) {
            window.electronAPI.send('update-shortcuts', shortcuts);
        }
    }, [shortcuts]);

    const handleRecordShortcut = useCallback((e) => {
        if (!isRecording) return;

        e.preventDefault();
        e.stopPropagation();

        // Prepare Electron Accelerator String
        const keys = [];
        if (e.ctrlKey) keys.push('Ctrl');
        if (e.metaKey) keys.push('Super');
        if (e.altKey) keys.push('Alt');
        if (e.shiftKey) keys.push('Shift');

        // Main key
        let key = e.key;

        // Map simplified keys
        if (key === ' ') key = 'Space';
        else if (key === 'ArrowUp') key = 'Up';
        else if (key === 'ArrowDown') key = 'Down';
        else if (key === 'ArrowLeft') key = 'Left';
        else if (key === 'ArrowRight') key = 'Right';
        else if (key.length === 1) key = key.toUpperCase();

        // Avoid just modifiers
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

        keys.push(key);
        const accelerator = keys.join('+');

        setShortcuts(prev => ({ ...prev, [isRecording]: accelerator }));
        setIsRecording(null);
    }, [isRecording]);

    // Attach/Detach keydown listener for recording
    useEffect(() => {
        if (isRecording) {
            window.addEventListener('keydown', handleRecordShortcut);
            return () => window.removeEventListener('keydown', handleRecordShortcut);
        }
    }, [isRecording, handleRecordShortcut]);

    const resetShortcuts = () => {
        setShortcuts({
            volUp: 'Ctrl+V+Up',
            volDown: 'Ctrl+V+Down',
            mute: 'Ctrl+Shift+M'
        });
    };

    const handleOpenNotifications = () => {
        setIsNotificationOpen(true);
        setHasUnread(false);
    };

    const handleClearNotifications = () => {
        // Save IDs to local storage before clearing
        const currentIds = notifications.map(n => n.id);
        const previouslyDeleted = JSON.parse(localStorage.getItem('deleted_notifications') || '[]');
        const updatedDeleted = [...new Set([...previouslyDeleted, ...currentIds])];
        localStorage.setItem('deleted_notifications', JSON.stringify(updatedDeleted));

        setNotifications([]);
    };

    // Connection State
    const [isConnected, setIsConnected] = useState(false);
    const [serverState, setServerState] = useState('stopped'); // stopped, running

    // Logic State
    const [port, setPort] = useState(() => localStorage.getItem('saved_port') || '50005');
    const [bufferValue, setBufferValue] = useState(100);
    const [supportView, setSupportView] = useState('info');
    const [emailCopied, setEmailCopied] = useState(false);

    // Devices
    const [devices, setDevices] = useState([]);

    const [selectedDevice, setSelectedDevice] = useState(-1); // -1 for default

    // USB State
    const [usbDevices, setUsbDevices] = useState([]);
    const [selectedUsbDevice, setSelectedUsbDevice] = useState('');
    const [adbStatus, setAdbStatus] = useState('unknown'); // unknown, ready, missing

    // Bluetooth State (State-Driven: idle | starting | connected | stopping | error)
    const [bluetoothDevices, setBluetoothDevices] = useState([]);
    const [bluetoothState, setBluetoothState] = useState('idle');
    const [selectedBluetoothDevice, setSelectedBluetoothDevice] = useState('');
    const [bluetoothDeviceName, setBluetoothDeviceName] = useState(''); // Phone name from Python
    const [pcHostname, setPcHostname] = useState(''); // PC Bluetooth name


    // System Info & Stats
    const [systemInfo, setSystemInfo] = useState({ ip: 'Loading...', hostname: '...' });
    const [stats, setStats] = useState({ received: 0, lost: 0, queue: 0 });
    const [latencyMs, setLatencyMs] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Cooldown Timer
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    // connectionStatus deprecated in favor of connectionState
    const [toastMessage, setToastMessage] = useState(null); // { text, type: 'success' | 'error' }
    const [isToastVisible, setIsToastVisible] = useState(false);
    const lastPacketCountRef = useRef(0);
    const activityTimeoutRef = useRef(null);
    const wasConnectedRef = useRef(false);
    const connectingTimeoutRef = useRef(null);
    const connectionStateRef = useRef('idle');

    // Connection flow state: 'idle' | 'connecting' | 'connected'
    const [connectionState, setConnectionState] = useState('idle');

    // Keep ref in sync with state for use in timeouts
    useEffect(() => {
        connectionStateRef.current = connectionState;
    }, [connectionState]);

    const toastTimeoutRef = useRef(null);

    // Placeholder URL - User should replace this with their actual JSON URL
    // CORRECTED: Use raw.githubusercontent.com for direct JSON access
    const NOTIFICATIONS_URL = "https://raw.githubusercontent.com/Kurei1/app-notification/main/notifications.json";









    const [appVersion, setAppVersion] = useState('0.0.0');
    const [downloadingId, setDownloadingId] = useState(null);

    // Initial fetch: Version & Notifications
    useEffect(() => {
        const init = async () => {
            if (window.electronAPI) {
                const ver = await window.electronAPI.getAppVersion();
                setAppVersion(ver);
            }
            // Fetch notifications after getting version
            fetchRemoteNotifications(true);
        };
        init();
    }, []);

    // Helper to compare versions (v1 > v2 ?)
    const isNewerVersion = (v1, v2) => {
        if (!v1 || !v2) return false;
        const s1 = v1.replace(/v/i, '').split('.').map(Number);
        const s2 = v2.replace(/v/i, '').split('.').map(Number);
        for (let i = 0; i < Math.max(s1.length, s2.length); i++) {
            const n1 = s1[i] || 0;
            const n2 = s2[i] || 0;
            if (n1 > n2) return true;
            if (n1 < n2) return false;
        }
        return false;
    };

    const getVersionFromNote = (n) => {
        if (n.version) return n.version;
        // Try ID: update_v1.1.2
        if (n.id && n.id.startsWith('update_v')) {
            return n.id.replace('update_v', '');
        }
        return '0.0.0';
    };

    const fetchRemoteNotifications = async (isBackground = false) => {
        if (!isBackground) setIsRefreshing(true);
        try {
            // Add timestamp to bypass GitHub Raw cache
            const cacheBuster = `?t=${new Date().getTime()}`;
            const response = await fetch(NOTIFICATIONS_URL + cacheBuster);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();

            if (Array.isArray(data)) {
                // Get deleted IDs
                const deletedIds = JSON.parse(localStorage.getItem('deleted_notifications') || '[]');
                const deletedSet = new Set(deletedIds);

                // Get already delivered IDs (to prevent re-alerting)
                const deliveredIds = JSON.parse(localStorage.getItem('delivered_notifications') || '[]');
                const deliveredSet = new Set(deliveredIds);

                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));

                    const validNewNotes = data.filter(n => {
                        if (existingIds.has(n.id)) return false;
                        if (deletedSet.has(n.id)) return false;

                        // Version Check for updates
                        // We do NOT filter out old versions anymore, so we can show "Updated" status
                        /*
                        if (n.type === 'update') {
                            const v = getVersionFromNote(n);
                            if (!isNewerVersion(v, appVersion) && appVersion !== '0.0.0') {
                                return false;
                            }
                        }
                        */
                        return true;
                    }).reverse(); // Newest first

                    if (validNewNotes.length > 0) {
                        // Check if truly new (never delivered)
                        const trulyNewNotes = validNewNotes.filter(n => !deliveredSet.has(n.id));

                        if (trulyNewNotes.length > 0) {
                            setHasUnread(true);
                            if (!isBackground) { // Only toast if user triggered or on critical
                                showToast("New Notifications", "notification");
                                playSound('notification');
                            }

                            // Auto-save delivery status
                            const updatedDelivered = [...new Set([...deliveredIds, ...trulyNewNotes.map(n => n.id)])];
                            localStorage.setItem('delivered_notifications', JSON.stringify(updatedDelivered));
                        }
                        return [...validNewNotes, ...prev];
                    }
                    return prev;
                });
            }
        } catch (e) {
            console.log("Failed to fetch remote notifications:", e);
            if (!isBackground) showToast("Failed to refresh", "error");
        } finally {
            if (!isBackground) {
                setTimeout(() => setIsRefreshing(false), 500);
            }
        }
    };

    useEffect(() => {
        // Auto-refresh every 1 hour (background)
        const interval = setInterval(() => {
            fetchRemoteNotifications(true);
        }, 3600000);
        return () => clearInterval(interval);
    }, [appVersion]); // Re-create if appVersion changes (unlikely)

    // Listen for update events from electron-updater
    useEffect(() => {
        if (!window.electronAPI?.on) return;

        window.electronAPI.on('update-progress', (data) => {
            setUpdateProgress(data.percent);
        });

        window.electronAPI.on('update-downloaded', () => {
            setUpdateDownloading(false);
            setDownloadingId(null);
            // Mark the ID that WAS downloading as ready
            if (downloadingIdRef.current) {
                setReadyUpdateId(downloadingIdRef.current);
                downloadingIdRef.current = null;
            }
            showToast("Update Ready - Restart to Install", "notification");
        });
    }, []);

    // Handle update action from notification
    const handleUpdateAction = async (noteId) => {
        if (readyUpdateId === noteId) {
            // Update already downloaded, install it
            if (window.electronAPI?.installUpdate) {
                window.electronAPI.installUpdate();
            }
        } else if (!updateDownloading) {
            // Start downloading
            setUpdateDownloading(true);
            setDownloadingId(noteId);
            downloadingIdRef.current = noteId; // Sync ref
            setUpdateProgress(0);
            showToast("Downloading Update...", "notification");
            if (window.electronAPI?.downloadUpdate) {
                const result = await window.electronAPI.downloadUpdate();
                if (!result.success) {
                    setUpdateDownloading(false);
                    setDownloadingId(null);
                    downloadingIdRef.current = null;
                    showToast("Update Failed: " + (result.error || "Unknown"), "error");
                }
            }
        }
    };

    // Helper to play sounds
    const playSound = (type) => {
        if (isSoundMuted) return; // Respect mute setting
        try {
            let soundFile;
            if (type === 'success') soundFile = connSound;
            else if (type === 'error') soundFile = discSound;
            else if (type === 'warning') soundFile = errorSound;
            else if (type === 'notification') soundFile = notifSound;
            else if (type === 'failed') soundFile = failedSound;

            if (soundFile) {
                const audio = new Audio(soundFile);
                audio.volume = 0.5;
                audio.play().catch(e => console.error("Audio play error:", e));
            }
        } catch (e) {
            console.error("Audio init error:", e);
        }
    };

    // Watch for packet activity
    // Watch for packet activity
    // Legacy useEffect removed


    // Unified Packet Monitor
    useEffect(() => {
        if (!isConnected) {
            // Stats mock reset when stopped
            lastPacketCountRef.current = 0;
            return;
        }

        // Check if packets are increasing
        if (stats.received > lastPacketCountRef.current) {
            // Packets are flowing
            lastPacketCountRef.current = stats.received;

            // SUCCESS: Connecting -> Connected
            // If we are currently in 'connecting' state and receive data, we have SUCCESS.
            if (connectionStateRef.current === 'connecting') {
                if (connectingTimeoutRef.current) {
                    clearTimeout(connectingTimeoutRef.current);
                    connectingTimeoutRef.current = null;
                }
                setConnectionState('connected');
                connectionStateRef.current = 'connected'; // Sync Ref immediately

                showToast("Device Connected", "success");
                playSound('success');
            }

            // AUTO-DISCONNECT MONITOR:
            // Reset the "Silence Detection" timer every time we get a packet.
            // If this timer fires (2 seconds of silence), we assume stream is lost.
            if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);

            activityTimeoutRef.current = setTimeout(() => {
                // Only trigger if we think we are still connected
                if (connectionStateRef.current === 'connected') {
                    console.log("Stream lost (2s silence). Disconnecting...");
                    handleStopConnection('auto'); // 'auto' means stream lost
                }
            }, 2000);
        }
    }, [stats.received, isConnected, connectionState]);


    const showToast = (text, type, duration = 2000, subType = null) => {
        // Clear existing timeout if any (debouncing)
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = null;
        }

        setToastMessage({ text, type, subType });
        setIsToastVisible(true);

        // Set New Timeout
        toastTimeoutRef.current = setTimeout(() => {
            setIsToastVisible(false); // Trigger fade out

            // Remove from DOM after transition matches (300ms)
            // We don't track this timeout because it's just cleanup
            setTimeout(() => {
                // Only clear if we are still invisible (race condition check)
                setToastMessage(prev => prev && prev.text === text ? null : prev);
            }, 300);

            toastTimeoutRef.current = null;
        }, duration);
    };

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    /**
     * Electron IPC Setup
     */
    useEffect(() => {
        if (window.electronAPI) {
            // Register listeners
            window.electronAPI.on('from-python', (msg) => {
                handlePythonMessage(msg);
            });

            // Initial fetch
            window.electronAPI.send('to-python', { command: 'get_info' });
            window.electronAPI.send('to-python', { command: 'get_devices' });

            // Poll for devices/info occasionally? No, just once for now.
        } else {
            console.warn("Electron API not found. Running in browser mode?");
            // Mock data for browser dev
            setSystemInfo({ ip: "127.0.0.1 (Mock)", hostname: "Dev-PC" });
            setDevices(["0: Default Audio Device", "1: Headphones (Mock)"]);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('saved_port', port);
    }, [port]);

    const handlePythonMessage = (msg) => {
        // msg: { type, data }
        switch (msg.type) {
            case 'info':
                setSystemInfo(msg.data);
                break;
            case 'devices':
                setDevices(msg.data || []);
                break;
            case 'state':
                setServerState(msg.data); // 'running' or 'stopped'
                setIsConnected(msg.data === 'running');
                break;
            case 'stats':
                setStats(msg.data);
                // Approximate latency: queue size * ~10ms (chunk duration at 48k/1024 is ~21ms actually? 1024/48000 = 0.021s = 21ms)
                // Adjust calculation based on chunk size. Assuming 1024 samples @ 48kHz ~ 21.3ms
                setLatencyMs(Math.round(msg.data.queue * 21.3));
                break;
            case 'bluetooth_device_name':
                // Store phone name ONCE (static, no polling)
                if (msg.data) {
                    setBluetoothDeviceName(msg.data);
                }
                break;
            case 'pc_hostname':
                // Store PC Bluetooth name ONCE
                if (msg.data) {
                    setPcHostname(msg.data);
                }
                break;
            case 'bluetooth_list':
                // logic removed
                setBluetoothDevices([]);
                break;
            case 'bluetooth_status':
                // Logic removed
                console.log("[Bluetooth Status] Ignored (Feature Removed)", msg.data);
                break;
            case 'error':
                console.error("Python Error:", msg.data);
                break;
            case 'volume_level':
                const volPercent = Math.round(msg.data * 100);
                showToast(`Volume: ${volPercent}%`, 'volume', 2000, 'level');
                break;
            case 'mute_state':
                const isMuted = msg.data;
                showToast(isMuted ? "Audio Muted" : "Audio Unmuted", 'volume', 2000, isMuted ? 'muted' : 'unmuted');
                break;
            default:
                break;
        }
    };

    const handleStopConnection = (reason = 'manual') => {
        // Prevent spam (Bluetooth Only)
        if (activeMethod === 'bluetooth' && cooldownSeconds > 0) return;

        // Stop the Python backend
        if (window.electronAPI) {
            if (activeMethod === 'bluetooth') {
                // Call Bluetooth stop IPC (force kills process + runs ipconfig /flushdns)
                if (window.electronAPI.bluetoothStop) {
                    window.electronAPI.bluetoothStop(); // Do NOT await - immediate
                }
            } else {
                window.electronAPI.send('to-python', { command: 'stop' });
            }
        } else {
            setIsConnected(false); // Mock
        }

        // Clear any pending timers
        if (connectingTimeoutRef.current) {
            clearTimeout(connectingTimeoutRef.current);
            connectingTimeoutRef.current = null;
        }
        if (activityTimeoutRef.current) {
            clearTimeout(activityTimeoutRef.current);
            activityTimeoutRef.current = null;
        }

        // Update State
        setConnectionState('idle');
        connectionStateRef.current = 'idle';
        setIsConnected(false);

        // Clear Bluetooth phone name on stop
        if (activeMethod === 'bluetooth') {
            setBluetoothDeviceName('');
        }

        // Feedback
        if (reason === 'manual') {
            // User clicked Stop
            if (activeMethod === 'bluetooth') {
                showToast(t('serviceStopped'), "error");
                playSound('error');
            } else {
                // LAN / USB manual stop
                showToast(t('disconnectedStopStream'), "error", 4000);
                playSound('error'); // disc.mp3
            }
        } else if (reason === 'auto') {
            // Stream was lost (phone stopped streaming)
            showToast(t('deviceDisconnected'), "error");
            playSound('error'); // disc.mp3
        } else if (reason === 'failed') {
            // Connection timed out (handled in toggleConnection's timeout, but safety here)
        }
    };

    const toggleConnection = async () => {
        // Cooldown Guard (Bluetooth Only)
        if (activeMethod === 'bluetooth') {
            if (cooldownSeconds > 0) return;

            // START COOLDOWN (3 seconds)
            setCooldownSeconds(3);
            const timer = setInterval(() => {
                setCooldownSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        // If already connected or connecting -> STOP
        if (connectionState === 'connected' || connectionState === 'connecting') {
            handleStopConnection('manual');
            return;
        }

        // START Connection Logic
        if (connectionState === 'idle' || connectionState === 'failed') {

            // USB PRE-FLIGHT CHECK
            if (activeMethod === 'usb') {
                if (adbStatus === 'missing') {
                    showToast(t('connectDeviceFirst'), "error");
                    playSound('warning');
                    return;
                }
                if (!selectedUsbDevice) {
                    showToast(t('connectDeviceFirst'), "error");
                    playSound('warning');
                    return;
                }
                const usbOk = await setupAdbReverse();
                if (!usbOk) {
                    return;
                }
            }

            // BLUETOOTH: Launch Python service (EXACT same as test.py)
            if (activeMethod === 'bluetooth') {
                // Call Electron IPC to start Bluetooth service
                if (window.electronAPI?.bluetoothStart) {
                    window.electronAPI.bluetoothStart(); // Do NOT await - immediate
                }
                // Immediately update UI
                setConnectionState('connected');
                connectionStateRef.current = 'connected';
                setIsConnected(true);
                showToast(t('serviceStarted'), "success");
                playSound('success');
                return;
            }

            // LAN / USB: Packet-based with timeout
            setConnectionState('connecting');
            connectionStateRef.current = 'connecting';
            lastPacketCountRef.current = 0;
            setStats({ received: 0, lost: 0, queue: 0 }); // Reset stats to prevent stale data

            if (window.electronAPI) {
                window.electronAPI.send('to-python', {
                    command: 'start',
                    payload: {
                        port: parseInt(port),
                        device_index: parseInt(selectedDevice),
                        buffer_ms: bufferValue,
                        protocol: activeMethod === 'usb' ? 'tcp' : 'udp'
                    }
                });
            } else {
                setTimeout(() => { setIsConnected(true); }, 500);
            }

            // Timeout for LAN/USB only (10 seconds)
            if (connectingTimeoutRef.current) clearTimeout(connectingTimeoutRef.current);
            connectingTimeoutRef.current = setTimeout(() => {
                if (connectionStateRef.current === 'connecting') {
                    console.log("Connection timed out (10s). Failing...");
                    if (window.electronAPI) {
                        window.electronAPI.send('to-python', { command: 'stop' });
                    }
                    setConnectionState('failed');
                    connectionStateRef.current = 'failed';
                    showToast(t('connectionFailed'), "error");
                    playSound('failed');
                    setTimeout(() => {
                        if (connectionStateRef.current === 'failed') {
                            setConnectionState('idle');
                            connectionStateRef.current = 'idle';
                        }
                    }, 2000);
                }
            }, 10000);
        }
    };

    const handleWindowControl = (action) => {
        if (window.electronAPI?.windowControl) {
            window.electronAPI.windowControl(action);
        } else {
            console.log("Window control:", action);
        }
    };

    const handleDeviceRefresh = () => {
        setIsRefreshing(true);
        if (window.electronAPI) {
            window.electronAPI.send('to-python', { command: 'get_devices' });
        }
        setTimeout(() => setIsRefreshing(false), 1000); // 1s animation
    };

    /**
     * Bluetooth Logic
     */
    const refreshBluetoothDevices = () => {
        setIsRefreshing(true);
        // Logic Removed
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const startBluetoothSvc = () => {
        if (!selectedBluetoothDevice) return;
        if (window.electronAPI) {
            window.electronAPI.send('to-python', {
                command: 'start_bluetooth',
                payload: { deviceId: selectedBluetoothDevice }
            });
        }
        setBluetoothStatus('connecting');
    };

    /**
     * USB / ADB Logic
     */
    const refreshUsbDevices = async () => {
        if (!window.electronAPI?.adbCommand) return;

        setIsRefreshing(true);
        const res = await window.electronAPI.adbCommand(['devices', '-l']);

        if (!res.success) {
            setIsRefreshing(false); // Stop spinner
            if (res.error.includes('missing')) {
                setAdbStatus('missing');
                showToast(t('adbMissing'), "error");
            } else {
                setAdbStatus('error');
                console.error("ADB Error:", res.error);
            }
            return;
        }

        setAdbStatus('ready');
        // Parse output
        const lines = res.output.split('\n').slice(1);
        const basicDevs = lines
            .filter(l => l.trim().length > 0)
            .map(l => {
                const parts = l.split(/\s+/);
                const serial = parts[0];
                const modelCode = parts.find(p => p.startsWith('model:'))?.split(':')[1] || 'Android Device';
                return { serial, model: modelCode, full: l };
            });

        // 2. Fetch Market Names (Parallel)
        const enrichedDevs = await Promise.all(basicDevs.map(async (d) => {
            try {
                // Try Oppo/Realme specific property first, then standard marketname
                // Check ro.config.marketing_name
                let nameRes = await window.electronAPI.adbCommand(['-s', d.serial, 'shell', 'getprop', 'ro.config.marketing_name']);
                let name = nameRes.success ? nameRes.output.trim() : '';

                if (!name) {
                    // Fallback to ro.product.marketname
                    nameRes = await window.electronAPI.adbCommand(['-s', d.serial, 'shell', 'getprop', 'ro.product.marketname']);
                    name = nameRes.success ? nameRes.output.trim() : '';
                }

                if (!name) {
                    // Fallback to existing model code but underscore replaced
                    name = d.model.replace(/_/g, ' ');
                }

                return { ...d, model: name };
            } catch (e) {
                return d;
            }
        }));

        setUsbDevices(enrichedDevs);
        if (enrichedDevs.length > 0 && !selectedUsbDevice) {
            setSelectedUsbDevice(enrichedDevs[0].serial);
        }
        setIsRefreshing(false);
    };

    const setupAdbReverse = async () => {
        if (!selectedUsbDevice || !window.electronAPI?.adbCommand) return false;

        const p = port || '50005';
        const res = await window.electronAPI.adbCommand(['-s', selectedUsbDevice, 'reverse', `tcp:${p}`, `tcp:${p}`]);

        if (res.success) {
            showToast(t('usbTunnelActive'), "success");
            return true;
        } else {
            showToast(t('usbSetupFailed'), "error");
            console.error(res.error);
            return false;
        }
    };

    // Auto-refresh USB when switching to USB mode and adjust buffer
    useEffect(() => {
        if (activeMethod === 'usb') {
            refreshUsbDevices();
            setBufferValue(10); // Low latency for USB
        } else {
            setBufferValue(100); // Higher buffer for Wi-Fi jitter
        }
    }, [activeMethod]);

    /**
     * Returns a Tailwind color class based on the buffer latency.
     */
    const getBufferColor = (val) => {
        if (val < 60) return 'text-blue-500';
        if (val < 250) return 'text-emerald-500';
        return 'text-rose-500';
    };

    const getBufferAccent = (val) => {
        if (val < 60) return 'accent-blue-500';
        if (val < 250) return 'accent-emerald-500';
        return 'accent-rose-500';
    };

    const generateSimplePort = () => {
        // High ports 1024-65535, but user likes 5 digits, so 10000+
        const strategies = [
            // 1. Repetitive (e.g., 22222)
            () => { const d = Math.floor(Math.random() * 9) + 1; return `${d}${d}${d}${d}${d}`; },

            // 2. Sequential (e.g., 23456)
            () => { const d = Math.floor(Math.random() * 5) + 1; return `${d}${d + 1}${d + 2}${d + 3}${d + 4}`; },
            // 3. Pairs (e.g., 22553 or 22133)
            () => {
                const a = Math.floor(Math.random() * 9) + 1;
                const b = Math.floor(Math.random() * 10);
                const c = Math.floor(Math.random() * 10);
                // 50% chance of AABBC vs AABCC
                return Math.random() > 0.5 ? `${a}${a}${b}${b}${c}` : `${a}${a}${b}${c}${c}`;
            },
            // 4. Alternating (e.g., 12121)
            () => { const a = Math.floor(Math.random() * 9) + 1; const b = Math.floor(Math.random() * 10); return `${a}${b}${a}${b}${a}`; },
            // 5. Thousands (e.g., 25000)
            () => { const a = Math.floor(Math.random() * 5) + 1; const b = Math.floor(Math.random() * 10); return `${a}${b}000`; }
        ];

        let attempts = 0;
        let p = "";
        while (attempts < 10) {
            attempts++;
            const strategy = strategies[Math.floor(Math.random() * strategies.length)];
            p = strategy();
            const portNum = parseInt(p);
            // Ensure valid range
            if (portNum >= 10000 && portNum <= 65535) break;
        }
        setPort(p);
    };

    return (
        <div dir={language === 'ar' ? 'rtl' : 'ltr'} className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 font-sans ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} relative`}>

            {/* --- TOAST NOTIFICATION --- */}
            {/* --- TOAST NOTIFICATION --- */}
            {toastMessage && (
                <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl transition-all duration-300 ${isToastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'} ${toastMessage.type === 'success' ? 'bg-green-500 text-white' :
                    toastMessage.type === 'error' ? 'bg-red-500 text-white' :
                        toastMessage.type === 'volume' ? 'bg-blue-600 text-white' :
                            'bg-yellow-500 text-black'
                    }`}>
                    {toastMessage.type === 'success' ? <Wifi size={18} /> :
                        toastMessage.type === 'error' ? <X size={18} /> :
                            toastMessage.type === 'volume' ? (toastMessage.subType === 'muted' ? <VolumeX size={18} /> : <Volume2 size={18} />) :
                                <Bell size={18} />}
                    <span className="font-bold text-sm">{toastMessage.text}</span>
                </div>
            )}

            {/* --- CUSTOM TITLE BAR --- */}
            <div dir="ltr" className={`h-11 flex items-center justify-between px-4 select-none title-drag-region border-b transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} z-50`}>
                <div className="flex items-center gap-2 opacity-80 pl-2">
                    <Volume2 className="text-blue-500" size={16} />
                    <span className="text-xs font-bold tracking-widest uppercase">AudioSync</span>
                </div>

                <div className="flex items-center gap-1 no-drag">
                    <button onClick={() => handleWindowControl('minimize')} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600'}`}>
                        <Minus size={16} />
                    </button>
                    <button onClick={() => handleWindowControl('maximize')} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600'}`}>
                        <Square size={14} />
                    </button>
                    <button onClick={() => handleWindowControl('close')} className={`p-2 rounded-lg transition-colors hover:bg-red-500 hover:text-white ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* --- MAIN SPLIT LAYOUT --- */}
            <main className="flex-1 flex overflow-hidden">

                {/* Left Sidebar: Methods & Audio Settings */}
                <aside className={`w-80 border-r flex flex-col overflow-hidden ${isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-white/30'}`}>
                    <div className="p-4 flex-1 flex flex-col min-h-0">
                        <section className="mb-4 flex-shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <h1 className="text-xl font-bold tracking-tight">{t('receiver')}</h1>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleTheme}
                                        className={`p-2 rounded-full hover:scale-110 transition-transform ${isDarkMode ? 'hover:bg-zinc-800 text-yellow-500' : 'hover:bg-zinc-200 text-zinc-600'}`}
                                    >
                                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                                    </button>
                                    <button
                                        onClick={handleOpenNotifications}
                                        className={`p-2 rounded-full relative hover:scale-110 transition-transform ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'}`}
                                        title={isSoundMuted ? "Notifications (Muted)" : "Notifications"}
                                    >
                                        <Bell size={18} />
                                        {hasUnread && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-inherit"></span>}
                                        {/* Mute indicator slash */}
                                        {isSoundMuted && (
                                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="w-0.5 h-5 bg-red-500 rotate-45 rounded-full"></span>
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={() => setActiveMethod('lan')}
                                    disabled={connectionState !== 'idle'}
                                    className={`w-full flex items-center justify-between p-3 rounded-[1.25rem] transition-all ${activeMethod === 'lan' ? (isDarkMode ? 'bg-blue-600/10 text-blue-400 border border-blue-600/30' : 'bg-blue-50 text-blue-600 border border-blue-100') : 'hover:bg-zinc-500/05'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Wifi size={18} />
                                        <span className="font-medium">{t('lanNetwork')}</span>
                                    </div>
                                    <ChevronRight size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                                </button>

                                {/* USB Method */}
                                <button
                                    onClick={() => setActiveMethod('usb')}
                                    disabled={connectionState !== 'idle'}
                                    className={`w-full flex items-center justify-between p-3 rounded-[1.25rem] transition-all ${activeMethod === 'usb' ? (isDarkMode ? 'bg-blue-600/10 text-blue-400 border border-blue-600/30' : 'bg-blue-50 text-blue-600 border border-blue-100') : 'hover:bg-zinc-500/05'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Smartphone size={18} />
                                        <span className="font-medium">{t('usbTether')}</span>
                                    </div>
                                    <ChevronRight size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                                </button>

                                {/* Bluetooth Method */}
                                <button
                                    onClick={() => setActiveMethod('bluetooth')}
                                    disabled={connectionState !== 'idle'}
                                    className={`w-full flex items-center justify-between p-3 rounded-[1.25rem] transition-all ${activeMethod === 'bluetooth' ? (isDarkMode ? 'bg-blue-600/10 text-blue-400 border border-blue-600/30' : 'bg-blue-50 text-blue-600 border border-blue-100') : 'hover:bg-zinc-500/05'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Bluetooth size={18} />
                                        <span className="font-medium">{t('bluetooth')}</span>
                                    </div>
                                    <ChevronRight size={16} className={language === 'ar' ? 'rotate-180' : ''} />
                                </button>
                            </div>
                        </section>

                        {/* Global Port Setting (Kept in Sidebar) */}
                        <div className="space-y-3 mb-4 flex-shrink-0">
                            {/* Port */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium opacity-70">{t('listenPort')}</label>
                                    <button
                                        onClick={generateSimplePort}
                                        disabled={isConnected}
                                        className="text-[10px] font-bold text-blue-500 hover:bg-blue-500/10 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                        title={language === 'ar' ? 'إنشاء منفذ عشوائي' : 'Generate Random Simple Port'}
                                    >
                                        <Shuffle size={12} />
                                        {t('random')}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    disabled={isConnected}
                                    className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono ${isDarkMode ? 'bg-zinc-800 border-zinc-700 disabled:opacity-50' : 'bg-zinc-100 border-zinc-200 disabled:opacity-50'}`}
                                    placeholder="50005"
                                />
                            </div>

                            {/* Output Device (Global) */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium opacity-70">{t('outputDevice')}</label>
                                    <button
                                        onClick={handleDeviceRefresh}
                                        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                                        title={language === 'ar' ? 'تحديث الأجهزة' : 'Refresh Devices'}
                                    >
                                        <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedDevice}
                                        onChange={(e) => setSelectedDevice(e.target.value)}
                                        disabled={isConnected}
                                        className={`w-full p-3 rounded-xl border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm ${language === 'ar' ? 'pl-10' : 'pr-10'} ${isDarkMode ? 'bg-zinc-800 border-zinc-700 disabled:opacity-50' : 'bg-zinc-100 border-zinc-200 disabled:opacity-50'}`}
                                    >
                                        <option value="-1">{t('defaultOutput')}</option>
                                        {devices.map((dev) => {
                                            const [id, ...nameParts] = dev.split(':');
                                            return <option key={id} value={id}>{nameParts.join(':').trim()}</option>;
                                        })}
                                    </select>
                                    <ChevronRight size={14} className={`absolute top-3.5 pointer-events-none opacity-50 rotate-90 ${language === 'ar' ? 'left-3' : 'right-3'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Shortcuts Settings */}
                        <div className="space-y-2 mb-4 flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium opacity-70 flex items-center gap-2">
                                    <Sliders size={14} /> {t('volumeControls')}
                                </label>
                                <button
                                    onClick={resetShortcuts}
                                    disabled={isConnected}
                                    title={language === 'ar' ? 'إعادة التعيين' : 'Reset Defaults'}
                                    className="p-1 hover:bg-zinc-500/10 rounded-full transition-colors opacity-50 hover:opacity-100"
                                >
                                    <RotateCcw size={12} />
                                </button>
                            </div>

                            <div className={`p-2 rounded-2xl border space-y-1 ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-100/50 border-zinc-200'}`}>
                                {/* Vol Up */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase font-bold opacity-60 w-24">{t('volumeUp')}</span>
                                    <button
                                        onClick={() => setIsRecording('volUp')}
                                        disabled={isConnected}
                                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono border transition-all truncate text-center ${isRecording === 'volUp'
                                            ? 'bg-red-500 text-white border-red-500 animate-pulse'
                                            : isDarkMode ? 'bg-zinc-900 border-zinc-700 hover:border-blue-500/50' : 'bg-white border-zinc-200 hover:border-blue-500/50'
                                            } disabled:opacity-50`}
                                    >
                                        {isRecording === 'volUp' ? (language === 'ar' ? '...اضغط' : 'Press Keys...') : (shortcuts.volUp || (language === 'ar' ? 'لا يوجد' : 'None'))}
                                    </button>
                                </div>

                                {/* Vol Down */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase font-bold opacity-60 w-24">{t('volumeDown')}</span>
                                    <button
                                        onClick={() => setIsRecording('volDown')}
                                        disabled={isConnected}
                                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono border transition-all truncate text-center ${isRecording === 'volDown'
                                            ? 'bg-red-500 text-white border-red-500 animate-pulse'
                                            : isDarkMode ? 'bg-zinc-900 border-zinc-700 hover:border-blue-500/50' : 'bg-white border-zinc-200 hover:border-blue-500/50'
                                            } disabled:opacity-50`}
                                    >
                                        {isRecording === 'volDown' ? (language === 'ar' ? '...اضغط' : 'Press Keys...') : (shortcuts.volDown || (language === 'ar' ? 'لا يوجد' : 'None'))}
                                    </button>
                                </div>

                                {/* Mute */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] uppercase font-bold opacity-60 w-24">{t('muteUnmute')}</span>
                                    <button
                                        onClick={() => setIsRecording('mute')}
                                        disabled={isConnected}
                                        className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono border transition-all truncate text-center ${isRecording === 'mute'
                                            ? 'bg-red-500 text-white border-red-500 animate-pulse'
                                            : isDarkMode ? 'bg-zinc-900 border-zinc-700 hover:border-blue-500/50' : 'bg-white border-zinc-200 hover:border-blue-500/50'
                                            } disabled:opacity-50`}
                                    >
                                        {isRecording === 'mute' ? (language === 'ar' ? '...سجل' : 'Record...') : (shortcuts.mute || (language === 'ar' ? 'لا يوجد' : 'None'))}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="text-[10px] opacity-50 px-2 leading-relaxed">
                            <b className="text-amber-500">{language === 'ar' ? 'ملاحظة:' : 'Note:'}</b> {t('volumeNote')}
                        </div>

                    </div>
                </aside>

                {/* Right Content Area: Status & Analytics */}
                <section className="flex-1 p-4 overflow-hidden flex flex-col">
                    <div className="w-full h-full flex flex-col gap-2 justify-center">

                        {/* Connection Status Card */}
                        <div className={`p-2 rounded-[1.5rem] relative overflow-hidden transition-all flex-shrink-0 ${connectionState === 'connected' ? 'bg-blue-600 text-white shadow-blue-500/20 shadow-2xl' :
                            connectionState === 'connecting' ? 'bg-amber-500 text-white shadow-amber-500/20 shadow-2xl' :
                                connectionState === 'failed' ? 'bg-red-500 text-white shadow-red-500/20 shadow-2xl' :
                                    (isDarkMode ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50')
                            }`}>
                            <div className="relative z-10 flex flex-col items-center text-center gap-2">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${connectionState === 'connected' ? 'bg-white/20 animate-pulse-slow' :
                                    connectionState === 'connecting' ? 'bg-white/20 animate-pulse' :
                                        connectionState === 'failed' ? 'bg-white/20' :
                                            'bg-blue-500/10 animate-pulse-slow'
                                    }`}>
                                    {activeMethod === 'bluetooth' ? (
                                        <Bluetooth size={32} className={
                                            connectionState === 'connected' ? 'text-white' :
                                                connectionState === 'connecting' ? 'text-white animate-ping' :
                                                    connectionState === 'failed' ? 'text-white' :
                                                        'text-blue-500'
                                        } />
                                    ) : activeMethod === 'usb' ? (
                                        <Cable size={32} className={
                                            connectionState === 'connected' ? 'text-white' :
                                                connectionState === 'connecting' ? 'text-white animate-ping' :
                                                    connectionState === 'failed' ? 'text-white' :
                                                        'text-blue-500'
                                        } />
                                    ) : (
                                        <Wifi size={32} className={
                                            connectionState === 'connected' ? 'text-white' :
                                                connectionState === 'connecting' ? 'text-white animate-ping' :
                                                    connectionState === 'failed' ? 'text-white' :
                                                        'text-blue-500'
                                        } />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">
                                        {connectionState === 'connected' ? t('receiverActive') :
                                            connectionState === 'connecting' ? t('connecting') :
                                                connectionState === 'failed' ? t('connectionFailed') :
                                                    t('readyToConnect')}
                                    </h3>
                                    <p className={`text-sm mt-1 ${connectionState !== 'idle' ? 'text-white/80' : 'opacity-60'}`}>
                                        {connectionState === 'connected' ? (activeMethod === 'bluetooth' ? t('serviceStarted') : t('receivingAudio')) :
                                            connectionState === 'connecting' ? t('waitingPackets') :
                                                connectionState === 'failed' ? t('couldNotReceiveData') :
                                                    (activeMethod === 'bluetooth' ? t('serviceStopped') : t('connectPhone'))}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleConnection}
                                    disabled={connectionState === 'connecting' || connectionState === 'failed' || (activeMethod === 'bluetooth' && cooldownSeconds > 0)}
                                    className={`px-6 py-2 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-70 disabled:cursor-not-allowed ${connectionState === 'connected' ? 'bg-red-500 text-white shadow-xl hover:bg-red-600' :
                                        connectionState === 'connecting' ? 'bg-white/20 text-white cursor-wait' :
                                            connectionState === 'failed' ? 'bg-white/20 text-white' :
                                                'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        }`}
                                >
                                    {activeMethod === 'bluetooth' && cooldownSeconds > 0
                                        ? `${language === 'ar' ? 'انتظر' : 'Wait'} (${cooldownSeconds}s)`
                                        : connectionState === 'connected' ? t('stopListening') :
                                            connectionState === 'connecting' ? t('connecting') :
                                                t('startListening')}
                                </button>
                            </div>
                        </div>

                        {/* LAN Info Panel */}
                        {activeMethod === 'lan' && (
                            <div className={`p-3 rounded-2xl border flex flex-col gap-1 flex-shrink-0 ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                                <div className="flex items-center justify-center w-full gap-2 mb-1">
                                    <Wifi size={20} className="text-blue-500" />
                                    <p className="text-sm font-bold text-blue-500">{t('wifiReceiver')}</p>
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-blue-200/80' : 'text-blue-800/80'}`}>
                                    {language === 'ar' ? (
                                        <>
                                            1. {t('wifiStep1')}<br />
                                            2. {t('wifiStep2')}<br />
                                            3. {t('wifiStep3')}<br />
                                            4. {t('wifiStep4')}<br />
                                            5. {t('wifiStep5')}
                                        </>
                                    ) : (
                                        <>
                                            1. Connect both devices to the <b>same Wi-Fi</b>.<br />
                                            2. Enter the <b>Server IP</b> & <b>Port</b> in the app.<br />
                                            3. <b>Start Streaming</b> from the phone.<br />
                                            4. Click <b>Start Listening</b>.<br />
                                            5. Use the <b>volume shortcuts</b> to adjust the volume.
                                        </>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* USB Info Panel - Directly under Start button */}
                        {activeMethod === 'usb' && (
                            <div className={`p-3 rounded-2xl border flex flex-col gap-1 flex-shrink-0 ${isDarkMode ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                                <div className="flex items-center justify-center w-full gap-2 mb-1">
                                    <Usb size={20} className="text-purple-500" />
                                    <p className="text-sm font-bold text-purple-500">{t('usbBridge')}</p>
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-purple-200/80' : 'text-purple-800/80'}`}>
                                    {language === 'ar' ? (
                                        <>
                                            1. {t('usbStep1')}<br />
                                            2. {t('usbStep2')}<br />
                                            3. {t('usbStep3')}<br />
                                            4. {t('usbStep4')}<br />
                                            5. {t('usbStep5')}
                                        </>
                                    ) : (
                                        <>
                                            1. Enable <b>USB Debugging</b> (check phone app for info).<br />
                                            2. Connect via USB and <b>allow</b> the connection prompt.<br />
                                            3. <b>Start Streaming</b> from the phone.<br />
                                            4. Select your device and click <b>Start Listening</b>.<br />
                                            5. Use the <b>volume shortcuts</b> to adjust the volume.
                                        </>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* --- CONFIGURATION PANELS (Only when Idle) --- */}
                        {connectionState === 'idle' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-shrink-0">

                                {/* LAN Settings */}
                                {activeMethod === 'lan' && (
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-xs font-bold uppercase tracking-wider opacity-60">{t('buffer')}</label>
                                                <span className={`text-xs font-bold ${getBufferColor(bufferValue)}`}>{bufferValue}ms{bufferValue === 100 && (language === 'ar' ? ' (افتراضي)' : ' (Default)')}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="20"
                                                max="1000"
                                                step="10"
                                                value={bufferValue}
                                                onChange={(e) => setBufferValue(parseInt(e.target.value))}
                                                className={`w-full h-1.5 bg-zinc-500/20 rounded-lg appearance-none cursor-pointer ${getBufferAccent(bufferValue)}`}
                                            />
                                            <div className="flex justify-between text-[10px] opacity-40 mt-3 font-medium px-1">
                                                <span>{t('fasterAudio')}</span>
                                                <span>{t('smootherAudio')}</span>
                                            </div>
                                        </div>


                                    </div>
                                )}

                                {/* USB Settings */}
                                {activeMethod === 'usb' && (
                                    <div className="space-y-2">
                                        <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-xs font-bold uppercase tracking-wider opacity-60">{t('androidDevice')}</label>
                                                <button onClick={refreshUsbDevices} className="p-1 hover:bg-zinc-500/10 rounded-full transition-colors">
                                                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                                                </button>
                                            </div>
                                            {adbStatus === 'missing' ? (
                                                <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl flex items-center gap-2">
                                                    <AlertCircle size={16} /> <span>{t('adbMissing')}</span>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <select
                                                        value={selectedUsbDevice}
                                                        onChange={(e) => setSelectedUsbDevice(e.target.value)}
                                                        className={`w-full p-3 rounded-xl border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm ${language === 'ar' ? 'pl-10' : 'pr-10'} ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}
                                                    >
                                                        {usbDevices.length === 0 && <option value="">{t('noDevices')}</option>}
                                                        {usbDevices.map(d => (
                                                            <option key={d.serial} value={d.serial}>{d.model} ({d.serial.slice(0, 4)}...)</option>
                                                        ))}
                                                    </select>
                                                    <ChevronRight size={14} className={`absolute top-3.5 pointer-events-none opacity-50 rotate-90 ${language === 'ar' ? 'left-3' : 'right-3'}`} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            <div className={`p-2 rounded-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-xs font-bold uppercase tracking-wider opacity-60">{t('buffer')}</label>
                                                    <span className={`text-xs font-bold ${getBufferColor(bufferValue)}`}>{bufferValue}ms{bufferValue === 10 && (language === 'ar' ? ' (افتراضي)' : ' (Default)')}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="10"
                                                    max="1000"
                                                    step="10"
                                                    value={bufferValue}
                                                    onChange={(e) => setBufferValue(parseInt(e.target.value))}
                                                    className={`w-full h-1.5 bg-zinc-500/20 rounded-lg appearance-none cursor-pointer ${getBufferAccent(bufferValue)}`}
                                                />
                                                <div className="flex justify-between text-[10px] opacity-40 mt-3 font-medium px-1">
                                                    <span>Faster Audio</span>
                                                    <span>Smoother Audio</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeMethod === 'bluetooth' && (
                            <div className={`p-3 rounded-2xl border flex flex-col gap-2 flex-shrink-0 ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                                <div className="flex items-center justify-center gap-2">
                                    <Bluetooth size={16} className="text-amber-500" />
                                    <p className="text-sm font-bold text-amber-500">{t('bluetoothExp')}</p>
                                </div>
                                <div className={`text-sm ${language === 'ar' ? 'text-right' : 'text-left'} space-y-1 ${isDarkMode ? 'text-amber-200/80' : 'text-amber-800/80'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                    <p className={`p-2 rounded-xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/10' : 'bg-white/50 border-amber-200'}`}>
                                        <b className="text-amber-500">{language === 'ar' ? 'ملاحظة:' : 'Note:'}</b> {t('bluetoothNote')}
                                    </p>
                                    <ol className={`list-decimal list-inside space-y-1 px-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                        <li>{t('bluetoothStep1')}</li>
                                        <li>{t('bluetoothStep2')}</li>
                                        <li>{t('bluetoothStep3')}</li>
                                        <li className="mt-1 pt-1 border-t border-amber-500/20">{t('bluetoothStep3_Alt')}</li>
                                        <li>{t('bluetoothStep4_Alt')}</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        <div className={`grid grid-cols-1 gap-3 flex-1 max-h-48 ${activeMethod === 'bluetooth' ? 'md:grid-cols-3' : 'md:grid-cols-3'}`}>
                            {/* Device Name / IP / Bluetooth Name (PC) */}
                            <div className={`p-2 rounded-3xl h-full flex flex-col justify-center items-center text-center ${isDarkMode ? 'bg-zinc-900' : 'bg-white border border-zinc-200'}`}>
                                <div className="flex items-center gap-2 mb-1 opacity-60">
                                    {activeMethod === 'usb' ? <Smartphone size={16} /> :
                                        activeMethod === 'bluetooth' ? <Bluetooth size={16} /> :
                                            <Info size={16} />}
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        {activeMethod === 'usb' ? t('phoneName') :
                                            activeMethod === 'bluetooth' ? t('bluetoothName') :
                                                t('deviceIP')}
                                    </span>
                                </div>
                                <p className={`text-xl font-bold tracking-tight truncate ${activeMethod !== 'usb' ? 'font-mono' : ''}`}>
                                    {activeMethod === 'usb'
                                        ? (usbDevices.find(d => d.serial === selectedUsbDevice)?.model || (language === 'ar' ? 'لا يوجد جهاز' : 'No Device'))
                                        : activeMethod === 'bluetooth'
                                            ? (systemInfo.hostname || (language === 'ar' ? 'هذا الكمبيوتر' : 'This PC'))
                                            : systemInfo.ip}
                                </p>
                            </div>

                            {/* Connected to (Phone) - Bluetooth ONLY */}
                            {activeMethod === 'bluetooth' && (
                                <div className={`p-2 rounded-3xl h-full flex flex-col justify-center items-center text-center ${isDarkMode ? 'bg-zinc-900' : 'bg-white border border-zinc-200'}`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-60">
                                        <Smartphone size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">{t('connectedTo')}</span>
                                    </div>
                                    <p className="text-xl font-bold tracking-tight truncate">
                                        {connectionState === 'connected'
                                            ? (bluetoothDeviceName || (language === 'ar' ? 'جهاز غير معروف' : 'Unknown Device'))
                                            : '--'}
                                    </p>
                                </div>
                            )}

                            {/* Est. Latency - HIDDEN for Bluetooth */}
                            {activeMethod !== 'bluetooth' && (
                                <div className={`p-2 rounded-3xl h-full flex flex-col justify-center items-center text-center ${isDarkMode ? 'bg-zinc-900' : 'bg-white border border-zinc-200'}`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-60">
                                        <Cpu size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">{t('estLatency')}</span>
                                    </div>
                                    <p className="text-xl font-bold">{isConnected ? `${latencyMs}ms` : '--'}</p>
                                </div>
                            )}

                            {/* Stats - Boolean for Bluetooth, Packet stats for others */}
                            <div className={`p-2 rounded-3xl h-full flex flex-col justify-center items-center text-center ${isDarkMode ? 'bg-zinc-900' : 'bg-white border border-zinc-200'}`}>
                                <div className="flex items-center gap-2 mb-1 opacity-60">
                                    <ShieldCheck size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">{t('stats')}</span>
                                </div>
                                <p className="text-sm font-bold truncate" dir="ltr">
                                    {activeMethod === 'bluetooth'
                                        ? (connectionState === 'connected' ? t('active') : t('idle'))
                                        : (isConnected ? `${t('rec')} ${stats.received} | ${t('lost')} ${stats.lost}` : t('idle'))}
                                </p>
                            </div>

                        </div>
                    </div>
                </section >
            </main >

            {/* --- FOOTER BAR --- */}
            <footer className="h-14 flex items-center justify-between px-4 relative">
                {/* Language Toggle - Left */}
                <button
                    onClick={toggleLanguage}
                    className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase py-2 px-4 rounded-full transition-all hover:scale-105 ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' : 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600'} shadow-lg`}
                    title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
                >
                    <Globe size={14} className="text-blue-500" />
                    {language === 'en' ? 'English' : 'العربية'}
                </button>

                {/* Support Button - Center */}
                <button
                    onClick={() => { setSupportView('info'); setIsSupportOpen(true); }}
                    className={`flex items-center gap-2 text-xs font-bold tracking-widest uppercase py-2 px-6 rounded-full transition-all hover:scale-105 ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' : 'bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600'} shadow-lg absolute left-1/2 -translate-x-1/2`}
                >
                    <Coffee size={14} className="text-amber-500" />
                    {t('supportDev')}
                </button>

                {/* Version Display - Right */}
                <div className="w-24 text-right">
                    <span className={`text-[10px] font-mono opacity-40 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>v{appVersion}</span>
                </div>
            </footer>

            {/* --- SUPPORT MODAL (Multi-page) --- */}
            <Modal
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                title={supportView === 'info' ? t('supportTitle') : supportView === 'payments' ? t('chooseMethod') : t('customSupport')}
                maxWidth="max-w-lg"
                isDarkMode={isDarkMode}
            >
                <div className="space-y-5 px-6 py-4">
                    {supportView === 'info' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="text-center space-y-3 px-2">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <Coffee size={32} className="text-amber-500" />
                                </div>
                                <p className="text-base font-medium leading-relaxed italic">
                                    {t('supportMsg1')}
                                </p>
                                <p className="text-sm opacity-60">
                                    {t('supportMsg2')}
                                </p>
                            </div>
                            <div className="space-y-3 mt-6 flex flex-col items-center">
                                <button
                                    onClick={() => setSupportView('payments')}
                                    className="w-full flex items-center justify-between p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Coffee size={20} />
                                        <span className="font-bold">{t('buyCoffee')}</span>
                                    </div>
                                    <ChevronRight size={18} className={`transition-transform ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                                </button>
                                <button
                                    onClick={() => setSupportView('contact')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <HeartHandshake size={20} className="text-rose-500" />
                                        <span className="font-bold">{t('supportContact')}</span>
                                    </div>
                                    <ChevronRight size={18} className={`transition-transform ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}

                    {supportView === 'payments' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <button onClick={() => setSupportView('info')} className="text-xs font-bold text-blue-500 flex items-center gap-1 mb-2 uppercase tracking-widest hover:underline">{t('back')}</button>

                            <button onClick={() => setSupportView('paypal')} className={`w-full p-4 rounded-2xl border flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform ${isDarkMode ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'}`}>
                                <div className="w-10 h-10 bg-[#003087] rounded-lg flex items-center justify-center text-white"><CreditCard size={20} /></div>
                                <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}><p className="font-bold text-sm">PayPal</p><p className="text-xs opacity-50">{t('paypalDesc')}</p></div>
                                <ChevronRight size={18} className={`opacity-50 ${language === 'ar' ? 'rotate-180' : ''}`} />
                            </button>

                            <button onClick={() => setSupportView('crypto')} className={`w-full p-4 rounded-2xl border flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform ${isDarkMode ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'}`}>
                                <div className="w-10 h-10 bg-[#F3BA2F] rounded-lg flex items-center justify-center text-zinc-900"><QrCode size={20} /></div>
                                <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}><p className="font-bold text-sm">Binance / ByBit</p><p className="text-xs opacity-50">{t('cryptoDesc')}</p></div>
                                <ChevronRight size={18} className={`opacity-50 ${language === 'ar' ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    )}

                    {supportView === 'paypal' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <button onClick={() => setSupportView('payments')} className="text-xs font-bold text-blue-500 flex items-center gap-1 mb-2 uppercase tracking-widest hover:underline">{t('back')}</button>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-[#003087] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CreditCard size={32} className="text-white" />
                                </div>
                                <h4 className="font-bold text-lg mb-2">PayPal</h4>
                                <p className={`text-sm mb-4 ${isDarkMode ? 'text-amber-200/80' : 'text-amber-700'}`}>
                                    {t('paypalInfo')}
                                </p>
                                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'}`}>
                                    <p className="font-mono text-sm font-bold select-all">animecore2020@gmail.com</p>
                                </div>
                                <p className="text-xs opacity-50 mt-4">
                                    {t('paypalStep')}
                                </p>
                            </div>
                        </div>
                    )}

                    {supportView === 'crypto' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <button onClick={() => setSupportView('payments')} className="text-xs font-bold text-blue-500 flex items-center gap-1 mb-2 uppercase tracking-widest hover:underline">{t('back')}</button>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Binance - Left */}
                                <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <div className="w-12 h-12 bg-[#F3BA2F] rounded-full flex items-center justify-center mx-auto mb-3">
                                        <QrCode size={24} className="text-zinc-900" />
                                    </div>
                                    <h4 className="font-bold text-sm mb-1">Binance Pay</h4>
                                    <p className="text-xs opacity-50 font-mono mb-3">ID: 763038084</p>
                                    <div className="rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-600">
                                        <img src={binanceQR} alt="Binance QR" className="w-full h-auto" />
                                    </div>
                                </div>
                                {/* ByBit - Right */}
                                <div className={`p-4 rounded-2xl border text-center ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <div className="w-12 h-12 bg-[#F0B90B] rounded-full flex items-center justify-center mx-auto mb-3">
                                        <QrCode size={24} className="text-zinc-900" />
                                    </div>
                                    <h4 className="font-bold text-sm mb-1">ByBit</h4>
                                    <p className="text-xs opacity-50 font-mono mb-3">ID: 416909609</p>
                                    <div className="rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-600">
                                        <img src={bybitQR} alt="ByBit QR" className="w-full h-auto" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs opacity-50 text-center">
                                {t('cryptoScan')}
                            </p>
                        </div>
                    )}

                    {supportView === 'contact' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <button onClick={() => setSupportView('info')} className="text-xs font-bold text-blue-500 flex items-center gap-1 mb-2 uppercase tracking-widest hover:underline">{t('back')}</button>
                            <div className="text-center p-2">
                                <p className="text-sm opacity-70 mb-6">{t('reachOut')}</p>
                                <div className="grid grid-cols-1 gap-3">
                                    <a href="https://instagram.com/kurei.111" target="_blank" rel="noreferrer" className={`flex items-center gap-4 p-4 rounded-2xl border transition-transform hover:scale-[1.02] ${isDarkMode ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'}`}>
                                        <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 rounded-lg flex items-center justify-center text-white"><Instagram size={20} /></div>
                                        <div className={`${language === 'ar' ? 'text-right' : 'text-left'}`}><p className="font-bold text-sm">Instagram</p><p className="text-xs opacity-50">@kurei.111</p></div>
                                    </a>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText('audio.sync.2025@gmail.com');
                                            setEmailCopied(true);
                                            setTimeout(() => setEmailCopied(false), 2000);
                                        }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-transform hover:scale-[1.02] ${isDarkMode ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'}`}
                                    >
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white"><Mail size={20} /></div>
                                        <div className={`flex-1 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                                            <p className="font-bold text-sm">{t('emailMe')}</p>
                                            <p className={`text-xs opacity-50 ${emailCopied ? 'text-green-500 font-bold' : ''}`}>
                                                {emailCopied
                                                    ? (language === 'ar' ? 'تم النسخ!' : 'Copied!')
                                                    : 'audio.sync.2025@gmail.com'}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal >

            {/* --- UPDATE MODAL --- */}
            {/* --- NOTIFICATIONS MODAL --- */}
            {/* --- NOTIFICATIONS MODAL --- */}
            <Modal
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                title={t('notifications')}
                maxWidth="max-w-lg"
                isDarkMode={isDarkMode}
                rightAction={(
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => fetchRemoteNotifications(false)}
                            className="p-2 hover:bg-zinc-500/10 rounded-full transition-colors"
                            title={language === 'ar' ? 'تحديث الإشعارات' : 'Refresh Notifications'}
                        >
                            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={toggleSoundMute}
                            className={`p-2 hover:bg-zinc-500/10 rounded-full transition-all relative group`}
                            title={isSoundMuted ? t('unmuteNotifications') : t('muteNotifications')}
                        >
                            <Bell size={18} className={`transition-transform ${!isSoundMuted ? 'group-hover:animate-bell-ring' : ''}`} />
                            {/* Animated slash overlay */}
                            <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isSoundMuted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                                <span className="w-0.5 h-6 bg-red-500 rotate-45 rounded-full"></span>
                            </span>
                        </button>
                    </div>
                )}
            >
                <div className="flex flex-col h-[400px]">
                    <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-4">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 opacity-50">
                                <Bell size={48} className="mx-auto mb-2 opacity-20" />
                                <p>{t('noNotifications')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {notifications.map((note) => {
                                    const noteVersion = getVersionFromNote(note);
                                    const isInstalled = note.type === 'update' && !isNewerVersion(noteVersion, appVersion) && appVersion !== '0.0.0';

                                    return (
                                        <div key={note.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-bold text-sm mb-1">{note.title}</h4>
                                                    <p className="text-xs opacity-80 leading-relaxed whitespace-pre-line">{note.message}</p>
                                                </div>
                                                {note.type === 'update' && <Info size={16} className="text-blue-500 shrink-0" />}
                                            </div>
                                            {note.action && (
                                                <button
                                                    onClick={() => {
                                                        if (note.type === 'update' && !isInstalled) {
                                                            handleUpdateAction(note.id);
                                                        } else if (note.link) {
                                                            window.open(note.link, '_blank');
                                                        }
                                                    }}
                                                    disabled={(note.type === 'update' && updateDownloading && downloadingId !== note.id) || isInstalled}
                                                    className={`mt-3 w-full py-2 text-white text-xs font-bold rounded-xl transition-colors ${isInstalled
                                                        ? 'bg-zinc-500/20 text-zinc-500 cursor-default hover:bg-zinc-500/20'
                                                        : note.type === 'update' && downloadingId === note.id
                                                            ? 'bg-blue-400 cursor-wait'
                                                            : note.type === 'update' && readyUpdateId === note.id
                                                                ? 'bg-green-600 hover:bg-green-700'
                                                                : 'bg-blue-600 hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {note.type === 'update'
                                                        ? isInstalled
                                                            ? t('updated')
                                                            : downloadingId === note.id
                                                                ? `${t('downloading')}... ${updateProgress}%`
                                                                : readyUpdateId === note.id
                                                                    ? t('restartToInstall')
                                                                    : t('downloadUpdate')
                                                        : note.action}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
                            <button
                                onClick={handleClearNotifications}
                                className={`w-full py-3 rounded-2xl font-bold transition-colors text-sm ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'}`}
                            >
                                {t('clearNotifications')}
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* --- TERMS OF USE MODAL --- */}
            <Modal
                isOpen={isTermsOpen}
                onClose={() => termsAccepted && setIsTermsOpen(false)}
                title={t('termsTitle')}
                maxWidth="max-w-lg"
                isDarkMode={isDarkMode}
                hideClose={!termsAccepted}
                rightAction={
                    <button
                        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700'}`}
                    >
                        {language === 'ar' ? 'English' : 'العربية'}
                    </button>
                }
            >
                <div className={`px-6 py-4 h-[400px] overflow-y-auto custom-scrollbar ${language === 'ar' ? 'text-right' : ''}`}>
                    <div className={`space-y-4 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                            <p className={`font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                                {language === 'ar' ? '⚠️ إخلاء المسؤولية' : '⚠️ Disclaimer'}
                            </p>
                        </div>

                        {language === 'ar' ? (
                            <>
                                <p>باستخدام AudioSync ("التطبيق")، فإنك توافق على الشروط التالية:</p>

                                <h4 className="font-bold mt-4">1. الاستخدام المقصود</h4>
                                <p>تم تطوير هذا التطبيق لأغراض مشروعة — بث صوت هاتفك إلى جهاز الكمبيوتر الخاص بك. أي سوء استخدام أو استخدام غير قانوني هو مسؤولية المستخدم بالكامل.</p>

                                <h4 className="font-bold mt-4">2. لا توجد ضمانات</h4>
                                <p>يتم توفير التطبيق "كما هو" بدون أي ضمان، صريح أو ضمني. لا يضمن المطور أن التطبيق سيعمل دون انقطاع أو خالياً من الأخطاء.</p>

                                <h4 className="font-bold mt-4">3. تحديد المسؤولية</h4>
                                <p>لن يكون المطور (Kurei) مسؤولاً عن أي أضرار ناتجة عن استخدام هذا التطبيق، بما في ذلك على سبيل المثال لا الحصر:</p>
                                <ul className="list-disc list-inside space-y-1 opacity-80">
                                    <li>فقدان البيانات أو تعطل النظام</li>
                                    <li>مشاكل الاتصال</li>
                                    <li>أي عواقب غير مقصودة</li>
                                </ul>

                                <h4 className="font-bold mt-4">4. استخدام على مسؤوليتك الخاصة</h4>
                                <p>أنت تفهم وتوافق على أنك تستخدم هذا التطبيق على مسؤوليتك الخاصة.</p>
                            </>
                        ) : (
                            <>
                                <p>By using AudioSync ("the App"), you agree to the following terms:</p>

                                <h4 className="font-bold mt-4">1. Intended Use</h4>
                                <p>This application was developed for legitimate purposes — streaming your phone's audio to your PC. Any misuse or unlawful usage is solely the responsibility of the user.</p>

                                <h4 className="font-bold mt-4">2. No Warranty</h4>
                                <p>The App is provided "as is" without any warranty, express or implied. The developer makes no guarantee that the App will work without interruption or be error-free.</p>

                                <h4 className="font-bold mt-4">3. Limitation of Liability</h4>
                                <p>The developer (Kurei) shall not be liable for any damages arising from the use of this App, including but not limited to:</p>
                                <ul className="list-disc list-inside space-y-1 opacity-80">
                                    <li>Data loss or system crashes</li>
                                    <li>Connectivity issues</li>
                                    <li>Any unintended consequences</li>
                                </ul>

                                <h4 className="font-bold mt-4">4. Use at Your Own Risk</h4>
                                <p>You understand and agree that you use this App at your own risk.</p>
                            </>
                        )}
                    </div>
                </div>

                <div className={`p-6 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                    <button
                        onClick={acceptTerms}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                    >
                        {t('termsAccept')}
                    </button>
                    {!termsAccepted && (
                        <p className={`text-xs text-center mt-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {language === 'ar' ? 'يجب عليك الموافقة للمتابعة' : 'You must accept to continue'}
                        </p>
                    )}
                </div>
            </Modal >
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}} />
        </div >
    );
};

// export default App;
export default function WrappedApp() {
    return (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
}