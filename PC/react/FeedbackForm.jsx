import React, { useState, useEffect } from 'react';
import {
    Star,
    Send,
    MessageSquare,
    User,
    ShieldCheck,
    Monitor,
    Lightbulb,
    Heart,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, setDoc, increment } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

import { db, auth, appId } from './firebase-config';

const FeedbackForm = ({ onClose, isDarkMode = true, language = 'en', notificationId = null, onSubmitSuccess = () => { } }) => {
    const [submitted, setSubmitted] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        featureRating: 'definitely',
        feedback: '',
        subscribe: false // Default to unchecked
    });

    // Translations
    const translations = {
        en: {
            title: 'Developer Feedback',
            subtitle: "Hi! I'm the developer behind AudioSync. I'm looking for honest feedback to help me improve the experience for everyone.",
            privacyTitle: 'Personal Privacy Guarantee',
            privacyText: 'Your feedback is strictly confidential and used only to improve AudioSync.',
            privacyBold: ' I will never sell, rent, or share your information.',
            contactInfo: 'Contact Info',
            yourName: 'Your Name',
            namePlaceholder: 'Name or Username',
            emailLabel: 'Email (Optional)',
            emailPlaceholder: 'In case I have questions',
            howAmIDoing: 'How am I doing?',
            rateText: 'Rate AudioSync so far:',
            ratingAmazing: 'Amazing!',
            ratingGreat: 'Great',
            ratingOkay: "It's Okay",
            ratingBetter: 'Could be better',
            ratingWork: 'Needs a lot of work',
            recommend: 'Would you recommend this to a friend?',
            definitely: 'Definitely',
            maybe: 'Maybe',
            notYet: 'Not yet',
            never: 'Never',
            suggestions: 'Suggestions for Me',
            whatChange: "What's one thing you'd change?",
            feedbackPlaceholder: 'Be as honest as you want...',
            testFeatures: "I'm happy to help you test new features in the future.",
            sendFeedback: 'Send My Feedback',
            sendingNote: 'Submitting this sends an internal message directly to the developer.',
            thankYou: 'Thanks a lot!',
            thankYouText: "Your feedback goes directly to my inbox. I'll be reviewing this personally to make AudioSync better for you.",
            close: 'Close',
            back: 'Back'
        },
        ar: {
            title: 'آراء المستخدمين',
            subtitle: 'مرحباً! أنا المطور وراء AudioSync. أبحث عن آراء صادقة لمساعدتي في تحسين التجربة للجميع.',
            privacyTitle: 'ضمان الخصوصية الشخصية',
            privacyText: 'آراؤك سرية للغاية وتُستخدم فقط لتحسين AudioSync.',
            privacyBold: ' لن أبيع أو أؤجر أو أشارك معلوماتك أبداً.',
            contactInfo: 'معلومات الاتصال',
            yourName: 'اسمك',
            namePlaceholder: 'الاسم أو اسم المستخدم',
            emailLabel: 'البريد الإلكتروني (اختياري)',
            emailPlaceholder: 'في حال كانت لدي أسئلة',
            howAmIDoing: 'كيف أقوم بعملي؟',
            rateText: 'قيّم AudioSync حتى الآن:',
            ratingAmazing: 'مذهل!',
            ratingGreat: 'رائع',
            ratingOkay: 'لا بأس',
            ratingBetter: 'يمكن أن يكون أفضل',
            ratingWork: 'يحتاج الكثير من العمل',
            recommend: 'هل تنصح صديقاً بهذا؟',
            definitely: 'بالتأكيد',
            maybe: 'ربما',
            notYet: 'ليس بعد',
            never: 'أبداً',
            suggestions: 'اقتراحات لي',
            whatChange: 'ما الشيء الواحد الذي ستغيره؟',
            feedbackPlaceholder: 'كن صادقاً كما تريد...',
            testFeatures: 'يسعدني مساعدتك في اختبار الميزات الجديدة مستقبلاً.',
            sendFeedback: 'أرسل رأيي',
            sendingNote: 'إرسال هذا يرسل رسالة داخلية مباشرة إلى المطور.',
            thankYou: 'شكراً جزيلاً!',
            thankYouText: 'يصل رأيك مباشرة إلى بريدي. سأراجعه شخصياً لجعل AudioSync أفضل لك.',
            close: 'إغلاق',
            back: 'رجوع'
        }
    };

    // Get translation helper
    const t = (key) => translations[language]?.[key] || translations.en[key] || key;

    // RTL support
    const isRTL = language === 'ar';

    useEffect(() => {
        if (!auth.currentUser) {
            signInAnonymously(auth)
                .catch(err => console.error("[Feedback] Auth Error:", err));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'feedback'), {
                ...formData,
                rating,
                timestamp: serverTimestamp(),
                status: 'active',
                replied: false,
                source: 'pc_app_v1',
                notificationId: notificationId // Track which notification triggered this
            });
            // Call the success callback to mark feedback as sent
            onSubmitSuccess();
        } catch (error) {
            console.error("[Feedback] Send error:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- DYNAMIC THEME BASED ON isDarkMode PROP ---
    const theme = isDarkMode ? {
        bg: 'bg-zinc-950',
        card: 'bg-zinc-900 border-zinc-800',
        textPrimary: 'text-white',
        textSecondary: 'text-zinc-400',
        input: 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500',
        divider: 'border-zinc-800',
        sectionBg: 'bg-zinc-800/50 border-zinc-700',
        accentBg: 'bg-blue-600',
        accentText: 'text-blue-400',
        accentBorder: 'border-blue-500',
        starEmpty: 'text-zinc-700',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
        buttonSecondary: 'bg-blue-500/20 hover:bg-blue-500/30 text-white',
        buttonInactive: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
        navButton: 'text-zinc-500 hover:text-white hover:bg-white/10',
        emeraldBg: 'bg-emerald-500/10 border-emerald-500/20',
        emeraldText: 'text-emerald-400',
        emeraldSub: 'text-emerald-300/80',
        successCard: 'bg-zinc-900 border-zinc-800'
    } : {
        bg: 'bg-zinc-50',
        card: 'bg-white border-zinc-200',
        textPrimary: 'text-zinc-900',
        textSecondary: 'text-zinc-600',
        input: 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400',
        divider: 'border-zinc-200',
        sectionBg: 'bg-zinc-100 border-zinc-200',
        accentBg: 'bg-blue-600',
        accentText: 'text-blue-600',
        accentBorder: 'border-blue-500',
        starEmpty: 'text-zinc-300',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
        buttonSecondary: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-700',
        buttonInactive: 'bg-zinc-200 hover:bg-zinc-300 text-zinc-600',
        navButton: 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200',
        emeraldBg: 'bg-emerald-50 border-emerald-200',
        emeraldText: 'text-emerald-700',
        emeraldSub: 'text-emerald-600',
        successCard: 'bg-white border-zinc-200'
    };

    // Rating label based on language
    const getRatingLabel = (r) => {
        if (r === 5) return t('ratingAmazing');
        if (r === 4) return t('ratingGreat');
        if (r === 3) return t('ratingOkay');
        if (r === 2) return t('ratingBetter');
        if (r === 1) return t('ratingWork');
        return '';
    };

    // Recommend options with translation
    const recommendOptions = [
        { key: 'definitely', label: t('definitely') },
        { key: 'maybe', label: t('maybe') },
        { key: 'notYet', label: t('notYet') },
        { key: 'never', label: t('never') }
    ];

    if (submitted) {
        return (
            <div dir={isRTL ? 'rtl' : 'ltr'} className={`h-full w-full flex items-center justify-center p-4 animate-in fade-in duration-300 ${theme.bg}`}>
                <div className={`max-w-md w-full border rounded-3xl shadow-xl p-8 text-center relative animate-in zoom-in-95 duration-300 ${theme.successCard}`}>
                    <button onClick={onClose} className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 rounded-full transition-colors ${theme.navButton}`}>
                        <X size={24} />
                    </button>
                    <div className="w-20 h-20 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-10 h-10 text-blue-500 fill-blue-500" />
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 ${theme.textPrimary}`}>{t('thankYou')}</h2>
                    <p className={`mb-6 ${theme.textSecondary}`}>
                        {t('thankYouText')}
                    </p>
                    <button onClick={onClose} className={`px-6 py-2 rounded-xl font-bold transition-colors ${theme.buttonInactive}`}>
                        {t('close')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className={`h-full w-full overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300 ${theme.bg}`}>
            <div className={`min-h-full py-12 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="max-w-3xl w-full relative">

                    {/* Back Button */}
                    <button
                        onClick={onClose}
                        className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} p-3 rounded-full transition-all flex items-center gap-2 ${theme.navButton}`}
                    >
                        {isRTL ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                        <span className="font-bold text-sm uppercase tracking-wider">{t('back')}</span>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-10 pt-12">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-500/20 border border-blue-500/30 rounded-2xl mb-4">
                            <User className="w-8 h-8 text-blue-500" />
                        </div>
                        <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${theme.textPrimary}`}>
                            {t('title')}
                        </h1>
                        <p className={`text-lg max-w-xl mx-auto ${theme.textSecondary}`}>
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className={`border rounded-[2rem] shadow-2xl overflow-hidden relative transition-colors duration-300 ${theme.card}`}>
                        <div className={`h-2 ${theme.accentBg}`} />

                        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">

                            {/* Privacy */}
                            <section className={`p-6 rounded-2xl flex items-start gap-4 border ${theme.emeraldBg}`}>
                                <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                                <div>
                                    <h3 className={`font-bold ${theme.emeraldText}`}>{t('privacyTitle')}</h3>
                                    <p className={`text-sm leading-relaxed ${theme.emeraldSub}`}>
                                        {t('privacyText')}
                                        <strong>{t('privacyBold')}</strong>
                                    </p>
                                </div>
                            </section>

                            {/* User Info */}
                            <section className="space-y-6">
                                <div className={`flex items-center gap-2 font-bold text-xl ${theme.textPrimary}`}>
                                    <MessageSquare className={`w-5 h-5 ${theme.accentText}`} />
                                    <h2>{t('contactInfo')}</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-sm font-semibold mb-2 ${theme.textSecondary}`}>{t('yourName')}</label>
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder={t('namePlaceholder')}
                                            className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all border ${theme.input}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-semibold mb-2 ${theme.textSecondary}`}>{t('emailLabel')}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder={t('emailPlaceholder')}
                                            className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all border ${theme.input}`}
                                        />
                                    </div>
                                </div>
                            </section>

                            <hr className={theme.divider} />

                            {/* Ratings */}
                            <section className="space-y-6">
                                <div className={`flex items-center gap-2 font-bold text-xl ${theme.textPrimary}`}>
                                    <Monitor className={`w-5 h-5 ${theme.accentText}`} />
                                    <h2>{t('howAmIDoing')}</h2>
                                </div>

                                <div className={`p-6 rounded-2xl text-center border ${theme.sectionBg}`}>
                                    <p className={`font-medium mb-4 ${theme.textSecondary}`}>{t('rateText')}</p>
                                    <div className="flex justify-center gap-2" dir="ltr">
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onMouseEnter={() => setHoverRating(num)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(num)}
                                                className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                            >
                                                <Star
                                                    className={`w-10 h-10 ${(hoverRating || rating) >= num
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : theme.starEmpty
                                                        } transition-colors duration-200`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className={`mt-3 text-sm font-bold h-5 uppercase tracking-wider ${theme.accentText}`}>
                                        {getRatingLabel(rating)}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <label className={`block text-sm font-semibold ${theme.textSecondary}`}>{t('recommend')}</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {recommendOptions.map((option) => (
                                            <label key={option.key} className="relative cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="featureRating"
                                                    value={option.key}
                                                    className="peer sr-only"
                                                    onChange={handleInputChange}
                                                    defaultChecked={option.key === 'definitely'}
                                                />
                                                <div className={`px-4 py-3 text-center rounded-xl transition-all text-sm font-medium border
                                                    peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600
                                                    ${theme.buttonInactive}
                                                `}>
                                                    {option.label}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <hr className={theme.divider} />

                            {/* Suggestions */}
                            <section className="space-y-6">
                                <div className={`flex items-center gap-2 font-bold text-xl ${theme.textPrimary}`}>
                                    <Lightbulb className={`w-5 h-5 ${theme.accentText}`} />
                                    <h2>{t('suggestions')}</h2>
                                </div>

                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${theme.textSecondary}`}>
                                        {t('whatChange')}
                                    </label>
                                    <textarea
                                        name="feedback"
                                        value={formData.feedback}
                                        onChange={handleInputChange}
                                        rows="4"
                                        placeholder={t('feedbackPlaceholder')}
                                        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none border ${theme.input}`}
                                    ></textarea>
                                </div>

                                <div className={`flex items-center gap-3 p-4 border rounded-xl ${theme.sectionBg}`}>
                                    <input
                                        type="checkbox"
                                        id="subscribe"
                                        name="subscribe"
                                        checked={formData.subscribe}
                                        onChange={handleInputChange}
                                        className={`w-5 h-5 text-blue-500 rounded focus:ring-blue-500 ${theme.input}`}
                                    />
                                    <label htmlFor="subscribe" className={`text-sm font-medium cursor-pointer ${theme.textSecondary}`}>
                                        {t('testFeatures')}
                                    </label>
                                </div>
                            </section>

                            {/* Submit Button */}
                            <div className="pt-6 text-center">
                                <button
                                    type="submit"
                                    disabled={loading || rating === 0}
                                    className={`w-full group relative flex items-center justify-center py-4 px-6 border border-transparent font-bold rounded-2xl transition-all shadow-xl overflow-hidden ${loading || rating === 0
                                        ? (isDarkMode ? 'bg-zinc-800/50 text-zinc-500' : 'bg-zinc-200 text-zinc-400') + ' cursor-not-allowed shadow-none'
                                        : theme.buttonPrimary
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>{t('sendFeedback')}</span>
                                            <Send className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} w-5 h-5 group-hover:translate-x-1 transition-transform`} />
                                        </>
                                    )}
                                </button>
                                <p className={`mt-4 text-xs ${theme.textSecondary}`}>
                                    {t('sendingNote')}
                                </p>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackForm;
