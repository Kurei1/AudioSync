import React, { useState, useEffect } from 'react';
import {
    Bug,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    Eye,
    EyeOff,
    AlertTriangle,
    AlertCircle,
    Lightbulb,
    HelpCircle,
    Send,
    ArrowLeft,
    Check
} from 'lucide-react';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

import { db, auth, appId } from './firebase-config';

const BugReportForm = ({ onClose, isDarkMode = true, language = 'en' }) => {
    // Views: 'list' | 'detail' | 'create'
    const [view, setView] = useState('list');
    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        tag: '',
        title: '',
        description: ''
    });

    // Translations
    const translations = {
        en: {
            title: 'Bug Reports',
            subtitle: 'Report issues and track your tickets',
            noTickets: 'No tickets yet',
            noTicketsDesc: 'Create your first bug report to get started',
            createTicket: 'Create Ticket',
            back: 'Back',
            ticketDetails: 'Ticket Details',
            newTicket: 'New Ticket',
            selectTag: 'Select a category',
            titleLabel: 'Short Summary',
            titlePlaceholder: 'Brief description of the issue',
            descriptionLabel: 'Details',
            descriptionPlaceholder: 'Describe the issue in detail. Include steps to reproduce if possible...',
            submit: 'Submit Ticket',
            submitting: 'Submitting...',
            submitted: 'Ticket Submitted!',
            submittedDesc: 'Your ticket has been received. Check back later to see if the developer has reviewed it.',
            goBack: 'Back to Tickets',
            status: 'Status',
            read: 'Reviewed',
            unread: 'Pending Review',
            createdAt: 'Created',
            // Tags
            tagCritical: 'Critical Bug',
            tagCriticalDesc: 'App crashes or data loss',
            tagMajor: 'Major Bug',
            tagMajorDesc: 'Feature broken or unusable',
            tagMinor: 'Minor Bug',
            tagMinorDesc: 'Small issues, visual glitches',
            tagFeature: 'Feature Request',
            tagFeatureDesc: 'Suggest new functionality',
            tagOther: 'Other',
            tagOtherDesc: 'General questions or feedback'
        },
        ar: {
            title: 'تقارير الأخطاء',
            subtitle: 'أبلغ عن المشاكل وتتبع تذاكرك',
            noTickets: 'لا توجد تذاكر بعد',
            noTicketsDesc: 'أنشئ أول تقرير خطأ للبدء',
            createTicket: 'إنشاء تذكرة',
            back: 'رجوع',
            ticketDetails: 'تفاصيل التذكرة',
            newTicket: 'تذكرة جديدة',
            selectTag: 'اختر فئة',
            titleLabel: 'ملخص قصير',
            titlePlaceholder: 'وصف موجز للمشكلة',
            descriptionLabel: 'التفاصيل',
            descriptionPlaceholder: 'صف المشكلة بالتفصيل. أضف خطوات إعادة الإنتاج إن أمكن...',
            submit: 'إرسال التذكرة',
            submitting: 'جاري الإرسال...',
            submitted: 'تم إرسال التذكرة!',
            submittedDesc: 'تم استلام تذكرتك. تحقق لاحقاً لمعرفة ما إذا راجعها المطور.',
            goBack: 'العودة للتذاكر',
            status: 'الحالة',
            read: 'تمت المراجعة',
            unread: 'قيد المراجعة',
            createdAt: 'تاريخ الإنشاء',
            // Tags
            tagCritical: 'خطأ حرج',
            tagCriticalDesc: 'تعطل التطبيق أو فقدان البيانات',
            tagMajor: 'خطأ كبير',
            tagMajorDesc: 'ميزة معطلة أو غير قابلة للاستخدام',
            tagMinor: 'خطأ صغير',
            tagMinorDesc: 'مشاكل صغيرة، خلل بصري',
            tagFeature: 'طلب ميزة',
            tagFeatureDesc: 'اقتراح وظائف جديدة',
            tagOther: 'أخرى',
            tagOtherDesc: 'أسئلة عامة أو ملاحظات'
        }
    };

    const t = (key) => translations[language]?.[key] || translations.en[key] || key;
    const isRTL = language === 'ar';

    // Theme
    const theme = isDarkMode ? {
        bg: 'bg-zinc-950',
        card: 'bg-zinc-900 border-zinc-800',
        cardHover: 'hover:bg-zinc-800/50',
        textPrimary: 'text-white',
        textSecondary: 'text-zinc-400',
        input: 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500',
        divider: 'border-zinc-800',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonSecondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
        navButton: 'text-zinc-500 hover:text-white hover:bg-white/10',
        tagSelected: 'border-blue-500 bg-blue-500/10',
        tagUnselected: 'border-zinc-700 hover:border-zinc-600',
        badge: 'bg-zinc-800',
        badgeSuccess: 'bg-emerald-500/20 text-emerald-400',
        badgePending: 'bg-amber-500/20 text-amber-400'
    } : {
        bg: 'bg-zinc-50',
        card: 'bg-white border-zinc-200',
        cardHover: 'hover:bg-zinc-50',
        textPrimary: 'text-zinc-900',
        textSecondary: 'text-zinc-600',
        input: 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder-zinc-400',
        divider: 'border-zinc-200',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonSecondary: 'bg-zinc-200 hover:bg-zinc-300 text-zinc-600',
        navButton: 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200',
        tagSelected: 'border-blue-500 bg-blue-50',
        tagUnselected: 'border-zinc-200 hover:border-zinc-300',
        badge: 'bg-zinc-100',
        badgeSuccess: 'bg-emerald-100 text-emerald-700',
        badgePending: 'bg-amber-100 text-amber-700'
    };

    // Tags configuration
    const tags = [
        { id: 'critical', icon: AlertTriangle, color: 'text-red-500', label: t('tagCritical'), desc: t('tagCriticalDesc') },
        { id: 'major', icon: AlertCircle, color: 'text-orange-500', label: t('tagMajor'), desc: t('tagMajorDesc') },
        { id: 'minor', icon: Bug, color: 'text-yellow-500', label: t('tagMinor'), desc: t('tagMinorDesc') },
        { id: 'feature', icon: Lightbulb, color: 'text-blue-500', label: t('tagFeature'), desc: t('tagFeatureDesc') },
        { id: 'other', icon: HelpCircle, color: 'text-zinc-500', label: t('tagOther'), desc: t('tagOtherDesc') }
    ];

    // Auth and fetch tickets
    useEffect(() => {
        const init = async () => {
            try {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }
                await fetchTickets();
            } catch (err) {
                console.error("[BugReport] Init error:", err);
                setLoading(false);
            }
        };
        init();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            if (!auth.currentUser) return;

            const ticketsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bugReports');
            const q = query(
                ticketsRef,
                where('userId', '==', auth.currentUser.uid),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);
            const ticketList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTickets(ticketList);
        } catch (err) {
            console.error("[BugReport] Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.tag || !formData.title.trim()) return;

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bugReports'), {
                userId: auth.currentUser?.uid,
                tag: formData.tag,
                title: formData.title.trim(),
                description: formData.description.trim(),
                timestamp: serverTimestamp(),
                read: false,
                replied: false
            });
            setSubmitted(true);
            // Reset form
            setFormData({ tag: '', title: '', description: '' });
        } catch (err) {
            console.error("[BugReport] Submit error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '--';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTagInfo = (tagId) => tags.find(t => t.id === tagId) || tags[4];

    // --- TICKET LIST VIEW ---
    const renderListView = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onClose}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${theme.navButton}`}
                >
                    {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    <span className="font-bold text-sm">{t('back')}</span>
                </button>
                <button
                    onClick={() => { setView('create'); setSubmitted(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${theme.buttonPrimary}`}
                >
                    <Plus size={18} />
                    {t('createTicket')}
                </button>
            </div>

            {/* Title */}
            <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>{t('title')}</h1>
                <p className={`text-sm ${theme.textSecondary}`}>{t('subtitle')}</p>
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : tickets.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border ${theme.card}`}>
                    <Bug size={48} className={`mx-auto mb-4 ${theme.textSecondary} opacity-30`} />
                    <p className={`font-bold ${theme.textPrimary}`}>{t('noTickets')}</p>
                    <p className={`text-sm ${theme.textSecondary}`}>{t('noTicketsDesc')}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => {
                        const tagInfo = getTagInfo(ticket.tag);
                        const TagIcon = tagInfo.icon;
                        return (
                            <button
                                key={ticket.id}
                                onClick={() => { setSelectedTicket(ticket); setView('detail'); }}
                                className={`w-full p-4 rounded-2xl border transition-all ${theme.card} ${theme.cardHover} ${isRTL ? 'text-right' : 'text-left'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl ${theme.badge}`}>
                                        <TagIcon size={20} className={tagInfo.color} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold text-sm truncate ${theme.textPrimary}`}>{ticket.title}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ticket.read ? theme.badgeSuccess : theme.badgePending}`}>
                                                {ticket.read ? t('read') : t('unread')}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs ${theme.textSecondary}`}>
                                            <Clock size={12} />
                                            <span>{formatDate(ticket.timestamp)}</span>
                                            <span>•</span>
                                            <span>{tagInfo.label}</span>
                                        </div>
                                    </div>
                                    {isRTL ? <ChevronLeft size={18} className={theme.textSecondary} /> : <ChevronRight size={18} className={theme.textSecondary} />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // --- TICKET DETAIL VIEW ---
    const renderDetailView = () => {
        if (!selectedTicket) return null;
        const tagInfo = getTagInfo(selectedTicket.tag);
        const TagIcon = tagInfo.icon;

        return (
            <div className="space-y-6">
                {/* Header */}
                <button
                    onClick={() => { setSelectedTicket(null); setView('list'); }}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${theme.navButton}`}
                >
                    {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    <span className="font-bold text-sm">{t('back')}</span>
                </button>

                {/* Ticket Card */}
                <div className={`rounded-2xl border overflow-hidden ${theme.card}`}>
                    {/* Tag Header */}
                    <div className={`p-4 border-b ${theme.divider} flex items-center gap-3`}>
                        <div className={`p-2 rounded-xl ${theme.badge}`}>
                            <TagIcon size={24} className={tagInfo.color} />
                        </div>
                        <div>
                            <span className={`text-xs font-bold uppercase ${tagInfo.color}`}>{tagInfo.label}</span>
                            <h2 className={`font-bold text-lg ${theme.textPrimary}`}>{selectedTicket.title}</h2>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {/* Status */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`text-sm font-medium ${theme.textSecondary}`}>{t('status')}:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${selectedTicket.read ? theme.badgeSuccess : theme.badgePending}`}>
                                {selectedTicket.read ? <Eye size={14} /> : <EyeOff size={14} />}
                                {selectedTicket.read ? t('read') : t('unread')}
                            </span>
                        </div>

                        {/* Date */}
                        <div className={`flex items-center gap-2 mb-6 text-sm ${theme.textSecondary}`}>
                            <Clock size={14} />
                            <span>{t('createdAt')}: {formatDate(selectedTicket.timestamp)}</span>
                        </div>

                        {/* Description */}
                        {selectedTicket.description && (
                            <div className={`p-4 rounded-xl ${theme.badge}`}>
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${theme.textPrimary}`}>
                                    {selectedTicket.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // --- CREATE TICKET VIEW ---
    const renderCreateView = () => {
        if (submitted) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className={`text-center p-8 rounded-2xl border ${theme.card}`}>
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check size={32} className="text-emerald-500" />
                        </div>
                        <h2 className={`text-xl font-bold mb-2 ${theme.textPrimary}`}>{t('submitted')}</h2>
                        <p className={`text-sm mb-6 ${theme.textSecondary}`}>{t('submittedDesc')}</p>
                        <button
                            onClick={() => { setView('list'); fetchTickets(); }}
                            className={`px-6 py-2 rounded-xl font-bold transition-colors ${theme.buttonSecondary}`}
                        >
                            {t('goBack')}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                {/* Header */}
                <button
                    onClick={() => setView('list')}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${theme.navButton}`}
                >
                    {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    <span className="font-bold text-sm">{t('back')}</span>
                </button>

                <h1 className={`text-2xl font-bold ${theme.textPrimary} ${isRTL ? 'text-right' : 'text-left'}`}>{t('newTicket')}</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tag Selection */}
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                        <label className={`block text-sm font-bold mb-3 ${theme.textSecondary}`}>{t('selectTag')}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {tags.map(tag => {
                                const TagIcon = tag.icon;
                                const isSelected = formData.tag === tag.id;
                                return (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, tag: tag.id }))}
                                        className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${isSelected ? theme.tagSelected : theme.tagUnselected}`}
                                    >
                                        <TagIcon size={24} className={tag.color} />
                                        <div className={isRTL ? 'text-right' : 'text-left'}>
                                            <p className={`font-bold text-sm ${theme.textPrimary}`}>{tag.label}</p>
                                            <p className={`text-xs ${theme.textSecondary}`}>{tag.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                        <label className={`block text-sm font-bold mb-2 ${theme.textSecondary}`}>{t('titleLabel')}</label>
                        <input
                            required
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder={t('titlePlaceholder')}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all focus:ring-2 focus:ring-blue-500 ${theme.input}`}
                        />
                    </div>

                    {/* Description */}
                    <div className={isRTL ? 'text-right' : 'text-left'}>
                        <label className={`block text-sm font-bold mb-2 ${theme.textSecondary}`}>{t('descriptionLabel')}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder={t('descriptionPlaceholder')}
                            rows={5}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all resize-none focus:ring-2 focus:ring-blue-500 ${theme.input}`}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting || !formData.tag || !formData.title.trim()}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${submitting || !formData.tag || !formData.title.trim()
                                ? (isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-200 text-zinc-400') + ' cursor-not-allowed'
                                : theme.buttonPrimary
                            }`}
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t('submitting')}
                            </>
                        ) : (
                            <>
                                <Send size={18} />
                                {t('submit')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className={`h-full w-full overflow-y-auto custom-scrollbar ${theme.bg}`}>
            <div className="max-w-2xl mx-auto p-6">
                {view === 'list' && renderListView()}
                {view === 'detail' && renderDetailView()}
                {view === 'create' && renderCreateView()}
            </div>
        </div>
    );
};

export default BugReportForm;
