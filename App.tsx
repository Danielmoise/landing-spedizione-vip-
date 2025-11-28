import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured, base64ToBlob } from './services/supabaseClient';
import { generateLandingPage, generateReviews, generateActionImages, translateLandingPage } from './services/geminiService';
import LandingPage, { ThankYouPage } from './components/LandingPage';
import { ProductDetails, GeneratedContent, PageTone, UserSession, LandingPageRow, TemplateId, FormFieldConfig, TypographyConfig, UiTranslation, SiteConfig, Testimonial } from './types';
import { Loader2, LogOut, Sparkles, ChevronLeft, ChevronRight, Save, ShoppingBag, ArrowRight, Trash2, Eye, UserPlus, LogIn, LayoutDashboard, Check, Image as ImageIcon, X, MonitorPlay, RefreshCcw, ArrowLeft, Settings, CreditCard, Link as LinkIcon, ListChecks, Pencil, Smartphone, Tablet, Monitor, Plus, MessageSquare, Images, Upload, Type, Truck, Flame, Zap, Globe, Banknote, MousePointerClick, Palette, Users, Copy, Target, MessageCircle, Code, Mail, Lock, Map, User, ArrowUp, ArrowDown, Package, ShieldCheck } from 'lucide-react';

// Declare Leaflet global
declare global {
  interface Window {
    L: any;
  }
}

interface OnlineUser {
    id: string;
    lat?: number;
    lon?: number;
    city?: string;
    country?: string;
    ip?: string;
    online_at: string;
}

const TEMPLATES: { id: TemplateId; name: string; desc: string; color: string }[] = [
    { id: 'gadget-cod', name: 'Gadget COD', desc: 'Stile "Offerte-On". Perfetto per prodotti fisici e pagamento alla consegna.', color: 'bg-blue-600 text-white border-blue-800' },
];

const BUTTON_GRADIENTS = [
    { label: 'Orange Sunset', class: 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-400' },
    { label: 'Emerald Green', class: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-emerald-400' },
    { label: 'Ocean Blue', class: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-blue-400' },
    { label: 'Royal Purple', class: 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white border-purple-400' },
    { label: 'Solid Black', class: 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700' },
    { label: 'Solid Red', class: 'bg-red-600 hover:bg-red-700 text-white border-red-500' },
];

const SUPPORTED_LANGUAGES = [
    { code: 'Italiano', label: 'Italiano' },
    { code: 'Inglese', label: 'Inglese' },
    { code: 'Francese', label: 'Francese' },
    { code: 'Tedesco', label: 'Tedesco' },
    { code: 'Austriaco', label: 'Tedesco (Austria)' },
    { code: 'Spagnolo', label: 'Spagnolo' },
    { code: 'Portoghese', label: 'Portoghese' },
    { code: 'Olandese', label: 'Olandese' },
    { code: 'Polacco', label: 'Polacco' },
    { code: 'Rumeno', label: 'Rumeno' },
    { code: 'Svedese', label: 'Svedese' },
    { code: 'Bulgaro', label: 'Bulgaro' },
    { code: 'Greco', label: 'Greco' },
    { code: 'Ungherese', label: 'Ungherese' },
    { code: 'Croato', label: 'Croato' },
    { code: 'Serbo', label: 'Serbo' }
];

const TY_SUFFIXES: Record<string, string> = {
    'Italiano': '-grazie',
    'Inglese': '-thanks',
    'Francese': '-merci',
    'Tedesco': '-danke',
    'Austriaco': '-danke',
    'Spagnolo': '-gracias',
    'Portoghese': '-obrigado',
    'Olandese': '-bedankt',
    'Polacco': '-dziekuje',
    'Rumeno': '-multumesc',
    'Svedese': '-tack',
    'Bulgaro': '-blagodarya',
    'Greco': '-efcharisto',
    'Ungherese': '-koszonom',
    'Croato': '-hvala',
    'Serbo': '-hvala'
};

const getThankYouSuffix = (lang: string) => TY_SUFFIXES[lang] || '-thanks';

const SUPPORTED_CURRENCIES = [
    { symbol: '€', label: 'Euro (€)' },
    { symbol: '$', label: 'Dollaro ($)' },
    { symbol: '£', label: 'Sterlina (£)' },
    { symbol: 'lei', label: 'Leu Rumeno (lei)' },
    { symbol: 'zł', label: 'Złoty Polacco (zł)' },
    { symbol: 'kr', label: 'Corona Svedese (kr)' },
    { symbol: 'лв', label: 'Lev Bulgaro (лв)' },
    { symbol: 'Ft', label: 'Fiorino Ungherese (Ft)' },
    { symbol: 'din', label: 'Dinaro Serbo (din)' }
];

const DEFAULT_FORM_CONFIG: FormFieldConfig[] = [
    { id: 'name', label: 'Nome e Cognome', enabled: true, required: true, type: 'text' },
    { id: 'phone', label: 'Telefono', enabled: true, required: true, type: 'tel' },
    { id: 'address', label: 'Indirizzo e Civico', enabled: true, required: true, type: 'text' },
    { id: 'city', label: 'Città', enabled: true, required: true, type: 'text' },
    { id: 'cap', label: 'CAP', enabled: true, required: false, type: 'text' },
    { id: 'email', label: 'Email', enabled: false, required: false, type: 'email' },
    { id: 'notes', label: 'Note per il corriere', enabled: true, required: false, type: 'textarea' },
];

// --- MAP MODAL COMPONENT ---
const LiveMapModal = ({ isOpen, onClose, users }: { isOpen: boolean, onClose: () => void, users: OnlineUser[] }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            if (mapRef.current && !mapInstance.current && window.L) {
                mapInstance.current = window.L.map(mapRef.current).setView([20, 0], 2);
                window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: 'abcd', maxZoom: 19 }).addTo(mapInstance.current);
            }
            if (mapInstance.current) {
                mapInstance.current.eachLayer((layer: any) => { if (!layer._url) mapInstance.current.removeLayer(layer); });
                users.forEach(user => { if (user.lat && user.lon) { window.L.circleMarker([user.lat, user.lon], { radius: 6, fillColor: "#10b981", color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.8 }).addTo(mapInstance.current).bindPopup(`<b>${user.city || 'Sconosciuto'}, ${user.country || 'N/A'}</b><br>IP: ${user.ip || 'Hidden'}`); } });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [isOpen, users]);
    useEffect(() => { if (!isOpen && mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-700 animate-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-400" /><h3 className="font-bold text-white">Mappa Utenti Live</h3><span className="bg-emerald-900/50 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20">{users.length} Online</span></div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition"><X className="w-5 h-5"/></button>
                </div>
                <div className="relative h-[60vh] w-full bg-slate-900"><div ref={mapRef} id="map" className="w-full h-full z-10"></div></div>
                <div className="p-3 bg-slate-950 text-xs text-slate-500 text-center border-t border-slate-800">Posizioni approssimative basate su indirizzo IP.</div>
            </div>
        </div>
    );
};

const PageCard = React.memo(({ page, onView, onEdit, onDuplicate, onDelete }: { 
    page: LandingPageRow, 
    onView: (p: LandingPageRow) => void,
    onEdit?: (p: LandingPageRow) => void, 
    onDuplicate?: (p: LandingPageRow) => void,
    onDelete?: (id: string) => void
}) => {
    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 relative" onClick={() => onView(page)}>
             <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-slate-900/80 rounded-bl-xl backdrop-blur z-20" onClick={(e) => e.stopPropagation()}>
                {onDuplicate && <button onClick={() => onDuplicate(page)} className="p-1.5 hover:bg-purple-600 rounded text-white" title="Duplica & Traduci"><Copy className="w-4 h-4"/></button>}
                {onEdit && <button onClick={() => onEdit(page)} className="p-1.5 hover:bg-blue-600 rounded text-white" title="Modifica"><Pencil className="w-4 h-4"/></button>}
                {onDelete && <button onClick={() => onDelete(page.id)} className="p-1.5 hover:bg-red-600 rounded text-white" title="Elimina"><Trash2 className="w-4 h-4"/></button>}
            </div>
            <div className="aspect-video bg-slate-200 relative overflow-hidden">
                <img src={page.content.heroImageBase64 || (page.content.generatedImages?.[0] || `https://picsum.photos/seed/${page.product_name.replace(/\s/g,'')}/800/600`)} alt={page.product_name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-900 z-10">{page.niche}</div>
            </div>
            <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors truncate">{page.product_name}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{page.content.subheadline}</p>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{page.slug ? `/${page.slug}` : 'Offerta Limitata'}</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><ArrowRight className="w-4 h-4" /></div>
                </div>
            </div>
        </div>
    );
});

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'product_view' | 'thank_you_view' | 'admin' | 'preview'>('home');
  const [adminSection, setAdminSection] = useState<'pages' | 'settings'>('pages');
  const [publicPages, setPublicPages] = useState<LandingPageRow[]>([]);
  const [selectedPublicPage, setSelectedPublicPage] = useState<GeneratedContent | null>(null);
  const [currentThankYouSlug, setCurrentThankYouSlug] = useState<string | undefined>(undefined);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('gadget-cod');
  const [orderData, setOrderData] = useState<{name?: string, phone?: string, price?: string} | undefined>(undefined);
  
  const [slug, setSlug] = useState<string>('');
  const [tySlug, setTySlug] = useState<string>(''); 
  const [product, setProduct] = useState<ProductDetails>({
    name: '', niche: '', description: '', targetAudience: '', tone: PageTone.PROFESSIONAL, language: 'Italiano', image: undefined, images: [], featureCount: 3
  });
  const [imageGenerationCount, setImageGenerationCount] = useState<number>(1);
  const [genTechImages, setGenTechImages] = useState(false);
  const [genBeforeAfter, setGenBeforeAfter] = useState(false);
  const [genHumanUse, setGenHumanUse] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState('');

  const [reviewCount, setReviewCount] = useState<number>(10);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const boxImageInputRef = useRef<HTMLInputElement>(null);
  const reviewImageInputRef = useRef<{ id: number, input: HTMLInputElement | null }>({ id: -1, input: null });
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [previewMode, setPreviewMode] = useState<'landing' | 'thankyou'>('landing'); 
  const [stealthCount, setStealthCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ siteName: 'BESTOFFERS', footerText: `© ${new Date().getFullYear()} Tutti i diritti riservati.` });
  
  // Duplication State
  const [duplicationTarget, setDuplicationTarget] = useState<LandingPageRow | null>(null);
  const [duplicationLang, setDuplicationLang] = useState<string>('Inglese');
  const [duplicationName, setDuplicationName] = useState<string>('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('site_settings').select('config').eq('id', 1).maybeSingle();
            if (!error && data && data.config) setSiteConfig(data.config);
        } else {
            const savedConfig = localStorage.getItem('site_config');
            if(savedConfig) try { setSiteConfig(JSON.parse(savedConfig)); } catch(e){ console.error("Error parsing site config", e); }
        }
    };
    fetchSettings();
    let authSubscription: { unsubscribe: () => void } | null = null;
    let presenceChannel: any = null;

    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => { if (session?.user) setSession({ id: session.user.id, email: session.user.email || '' }); });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) setSession({ id: session.user.id, email: session.user.email || '' }); else { setSession(null); setView('home'); }
      });
      authSubscription = data.subscription;

      // --- REALTIME PRESENCE & GEOLOCATION ---
      presenceChannel = supabase.channel('online_users', {
         config: { presence: { key: Math.random().toString(36).substring(7) } }
      });

      presenceChannel.on('presence', { event: 'sync' }, () => {
          const newState = presenceChannel.presenceState();
          const users: OnlineUser[] = [];
          for (const key in newState) {
              // @ts-ignore
              users.push(...newState[key]);
          }
          setOnlineUsers(users);
      }).subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
              const currentUser: OnlineUser = {
                  id: Math.random().toString(36).substring(7),
                  online_at: new Date().toISOString()
              };

              try {
                  // Fetch IP and rough location
                  const res = await fetch('https://ipapi.co/json/');
                  const data = await res.json();
                  if (!data.error) {
                      currentUser.ip = data.ip;
                      currentUser.city = data.city;
                      currentUser.country = data.country_name;
                      currentUser.lat = data.latitude;
                      currentUser.lon = data.longitude;
                  }
              } catch (e) {
                  console.warn("Geo fetch failed", e);
              }
              
              await presenceChannel.track(currentUser);
          }
      });

    } else {
        setIsLoadingPages(false);
        setPublicPages([{ id: '1', created_at: new Date().toISOString(), product_name: 'CryptoBot 3000', niche: 'Finanza', is_published: true, slug: 'cryptobot-3000', thank_you_slug: 'cryptobot-3000-grazie', content: { templateId: 'classic', language: 'Italiano', headline: "Sblocca i tuoi guadagni", subheadline: "Il bot di trading automatico n.1", heroImagePrompt: "trading", benefits: ["Sicuro", "Veloce"], features: [], testimonial: { name: "Test", role: "User", text: "Wow" }, testimonials: [{ name: "Test", role: "User", text: "Wow" }], ctaText: "Compra Ora", ctaSubtext: "Garanzia", colorScheme: "blue", niche: "Finanza", price: "49.00", currency: "€", originalPrice: "99.00", showDiscount: true, announcementBarText: "SPEDIZIONE GRATUITA + PAGAMENTO ALLA CONSEGNA", formConfiguration: DEFAULT_FORM_CONFIG, showSocialProofBadge: true, socialProofConfig: { enabled: true, intervalSeconds: 10, maxShows: 4 }, shippingCost: "0", enableShippingCost: false } }]);
    }
    const handleRouting = async () => {
         const params = new URLSearchParams(window.location.search);
         const pageId = params.get('p');
         const pageSlug = params.get('s');
         if (pageId || pageSlug) {
             setIsLoadingPages(true);
             if (isSupabaseConfigured() && supabase) {
                 let query = supabase.from('landing_pages').select('*');
                 const { data: allPages, error } = await query;
                 if (!error && allPages) {
                     let matchedPage = allPages.find(p => p.id === pageId || p.slug === pageSlug);
                     if (matchedPage) {
                         const contentWithScripts = { ...matchedPage.content, customHeadHtml: matchedPage.custom_head_html || matchedPage.content.customHeadHtml, customThankYouHtml: matchedPage.custom_thankyou_html || matchedPage.content.customThankYouHtml };
                         setSelectedPublicPage(contentWithScripts); setCurrentThankYouSlug(matchedPage.thank_you_slug); setView('product_view');
                     } else {
                         let tyPage = allPages.find(p => p.thank_you_slug === pageSlug);
                         if (!tyPage && pageSlug) {
                             const suffixes = Object.values(TY_SUFFIXES);
                             for (const suffix of suffixes) { if (pageSlug.endsWith(suffix)) { const originalSlug = pageSlug.slice(0, -suffix.length); tyPage = allPages.find(p => p.slug === originalSlug); if (tyPage) break; } }
                         }
                         if (tyPage) {
                             const contentWithScripts = { ...tyPage.content, customHeadHtml: tyPage.custom_head_html || tyPage.content.customHeadHtml, customThankYouHtml: tyPage.custom_thankyou_html || tyPage.content.customThankYouHtml };
                             setSelectedPublicPage(contentWithScripts); setView('thank_you_view');
                         } else { setView('home'); window.history.replaceState({}, '', window.location.pathname); }
                     }
                 } else { setView('home'); }
             } else { setView('home'); }
             setIsLoadingPages(false);
         } else { if (!window.location.search.includes('p=') && !window.location.search.includes('s=') && !session) { setView('home'); setSelectedPublicPage(null); } }
    };
    window.addEventListener('popstate', handleRouting);
    handleRouting();
    if (isSupabaseConfigured()) fetchPublicPages();
    return () => { 
        if (authSubscription) authSubscription.unsubscribe(); 
        if (presenceChannel) supabase?.removeChannel(presenceChannel);
        window.removeEventListener('popstate', handleRouting); 
    };
  }, []);

  const formatSlug = (text: string) => { return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'); };

  const saveSiteSettings = async () => {
      if (isSupabaseConfigured() && supabase && session) { const { error } = await supabase.from('site_settings').upsert({ id: 1, config: siteConfig }); if (error) { console.error("Settings save error:", error); alert("Errore salvataggio impostazioni: " + error.message); } else { alert("Impostazioni del sito salvate nel database!"); } } else { localStorage.setItem('site_config', JSON.stringify(siteConfig)); alert("Impostazioni del sito salvate (Locale)!"); }
  };

  const fetchPublicPages = async () => {
    if (!supabase) return;
    const params = new URLSearchParams(window.location.search);
    if(!params.get('p') && !params.get('s')) setIsLoadingPages(true);
    const { data, error } = await supabase.from('landing_pages').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(20); 
    if (!error && data) { const transformedData = data.map((page: any) => ({ ...page, content: { ...page.content, customHeadHtml: page.custom_head_html || page.content.customHeadHtml, customThankYouHtml: page.custom_thankyou_html || page.content.customThankYouHtml } })); setPublicPages(transformedData as LandingPageRow[]); }
    setIsLoadingPages(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setAuthError(''); setAuthSuccess('');
    if (isSupabaseConfigured() && supabase) {
      if (isRegistering) { const { data, error } = await supabase.auth.signUp({ email, password }); if (error) setAuthError(error.message); else if (data.session) { setSession({ id: data.session.user.id, email: data.session.user.email || '' }); setIsLoginOpen(false); setView('admin'); } else { setAuthSuccess("Registrazione avvenuta! Controlla la posta."); } } else { const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setAuthError(error.message); else if (data.session?.user) { setSession({ id: data.session.user.id, email: data.session.user.email || '' }); setIsLoginOpen(false); setView('admin'); } }
    } else { setAuthError("Supabase non configurato. Controlla services/supabaseClient.ts"); }
    setLoading(false);
  };

  const handleLogout = async () => { if (isSupabaseConfigured() && supabase) await supabase.auth.signOut(); setSession(null); setView('home'); };
  const handleStealthClick = () => { const now = Date.now(); if (now - lastClickTime < 1000) { const newCount = stealthCount + 1; setStealthCount(newCount); if (newCount >= 3) { setIsLoginOpen(true); setStealthCount(0); } } else { setStealthCount(1); } setLastClickTime(now); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = []; const fileList = Array.from(files) as File[];
      for (const file of fileList) { if (file.size > 4 * 1024 * 1024) { alert(`Immagine ${file.name} troppo grande (max 4MB). Saltata.`); continue; } await new Promise<void>((resolve) => { const reader = new FileReader(); reader.onloadend = () => { if (reader.result) newImages.push(reader.result as string); resolve(); }; reader.readAsDataURL(file); }); }
      setProduct(prev => ({ ...prev, images: [...(prev.images || []), ...newImages], image: (prev.images || []).length === 0 && newImages.length > 0 ? newImages[0] : prev.image }));
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!generatedContent) return;
      const files = e.target.files;
      if (files && files.length > 0) { const fileList = Array.from(files) as File[]; fileList.forEach(file => { if (file.size > 4 * 1024 * 1024) return; const reader = new FileReader(); reader.onloadend = () => { if (reader.result) { setGeneratedContent(prev => { if (!prev) return null; const existing = prev.generatedImages || []; if (!existing.includes(reader.result as string)) { return { ...prev, generatedImages: [...existing, reader.result as string] }; } return prev; }); } }; reader.readAsDataURL(file); }); }
      if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleReviewImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      if (!generatedContent || !e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) { alert("Immagine troppo grande"); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
          if (reader.result) {
              updateTestimonial(index, 'image', reader.result as string);
          }
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
  };
  
  const handleBoxImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!generatedContent || !generatedContent.boxContent || !e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) { alert("Immagine troppo grande"); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
          if (reader.result) {
              updateBoxContent('image', reader.result as string);
          }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const removeImage = (indexToRemove: number) => { setProduct(prev => { const newImages = (prev.images || []).filter((_, i) => i !== indexToRemove); return { ...prev, images: newImages, image: newImages.length > 0 ? newImages[0] : undefined }; }); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const removeGalleryImage = (imgToRemove: string) => { if (!generatedContent) return; const newImages = (generatedContent.generatedImages || []).filter(img => img !== imgToRemove); setGeneratedContent({ ...generatedContent, generatedImages: newImages, heroImageBase64: generatedContent.heroImageBase64 === imgToRemove ? (newImages[0] || undefined) : generatedContent.heroImageBase64 }); }
  const moveGalleryImage = (index: number, direction: 'left' | 'right') => { if (!generatedContent || !generatedContent.generatedImages) return; const images = [...generatedContent.generatedImages]; const targetIndex = direction === 'left' ? index - 1 : index + 1; if (targetIndex < 0 || targetIndex >= images.length) return; [images[index], images[targetIndex]] = [images[targetIndex], images[index]]; setGeneratedContent({ ...generatedContent, generatedImages: images }); };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
      if (!generatedContent || !generatedContent.features) return;
      const features = [...generatedContent.features];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= features.length) return;
      [features[index], features[targetIndex]] = [features[targetIndex], features[index]];
      setGeneratedContent({ ...generatedContent, features });
  };

  const handleGenerate = async () => {
    if (!product.name || !product.description) { alert("Inserisci almeno il nome e una descrizione."); return; }
    setIsGenerating(true); setEditingPageId(null); if (!slug) { setSlug(formatSlug(product.name)); }
    try {
      const result = await generateLandingPage(product, reviewCount);
      let testimonials = result.testimonials || []; if (testimonials.length === 0 && result.testimonial) { testimonials = [result.testimonial]; }
      const initialGallery = [...(product.images || [])];
      let resultWithTemplate: GeneratedContent = { ...result, testimonials, templateId: selectedTemplate, heroImageBase64: initialGallery.length > 0 ? initialGallery[0] : undefined, generatedImages: initialGallery };
      setGeneratedContent(resultWithTemplate);
      const lang = result.language || 'Italiano'; setTySlug(formatSlug(product.name) + getThankYouSuffix(lang));
      if (product.images && product.images.length > 0) { setIsGeneratingImage(true); const styles: string[] = []; if (genTechImages) styles.push('technical'); if (genBeforeAfter) styles.push('before_after'); if (genHumanUse) styles.push('human_use'); generateActionImages(product, imageGenerationCount, styles, customImagePrompt).then(generatedImages => { if (generatedImages && generatedImages.length > 0) { setGeneratedContent(prev => { if (!prev) return null; const newGallery = [...generatedImages, ...(prev.generatedImages || [])]; return { ...prev, heroImageBase64: generatedImages[0], generatedImages: newGallery }; }); } setIsGeneratingImage(false); }).catch(err => { console.error("Background image gen failed", err); setIsGeneratingImage(false); }); }
    } catch (error) { console.error(error); alert("Errore generazione. Controlla la console o l'API KEY."); } finally { setIsGenerating(false); }
  };

  const handleGenerateMoreReviews = async () => { if(!generatedContent) return; setIsGeneratingReviews(true); try { const lang = generatedContent.language || 'Italiano'; const newReviews = await generateReviews(product.name || generatedContent.headline, generatedContent.niche, lang); if(newReviews.length > 0) { setGeneratedContent(prev => { if(!prev) return null; return { ...prev, testimonials: [...(prev.testimonials || []), ...newReviews] } }) } } catch(err) { alert("Errore generazione recensioni."); } finally { setIsGeneratingReviews(false); } };

  const handleGenerateMoreImages = async () => { if (!generatedContent) return; const sourceImage = generatedContent.heroImageBase64 || (generatedContent.generatedImages && generatedContent.generatedImages.length > 0 ? generatedContent.generatedImages[0] : null) || product.image; if (!sourceImage) { alert("Nessuna immagine sorgente trovata. Caricane una prima."); return; } setIsGeneratingImage(true); try { const styles: string[] = []; if (genTechImages) styles.push('technical'); if (genBeforeAfter) styles.push('before_after'); if (genHumanUse) styles.push('human_use'); const tempProduct = { ...product, image: sourceImage, images: [sourceImage] }; const newImages = await generateActionImages(tempProduct, imageGenerationCount, styles, customImagePrompt); if (newImages && newImages.length > 0) { setGeneratedContent(prev => { if (!prev) return null; const uniqueNew = newImages.filter(img => !prev.generatedImages?.includes(img)); return { ...prev, generatedImages: [...uniqueNew, ...(prev.generatedImages || [])] }; }); } } catch(e) { console.error(e); alert("Errore generazione immagini"); } finally { setIsGeneratingImage(false); } };
  
  // Initialize Duplication
  const handleOpenDuplicate = (page: LandingPageRow) => {
    setDuplicationTarget(page);
    setDuplicationName(`${page.product_name} (Copia)`);
    setDuplicationLang(page.content.language || 'Italiano');
  };

  const handleProcessDuplication = async () => { 
      if (!duplicationTarget) return; 
      
      const originalLang = duplicationTarget.content.language || 'Italiano';
      const isTranslation = duplicationLang !== originalLang;

      if (isTranslation) {
        setIsDuplicating(true); 
        try { 
            const translatedContent = await translateLandingPage(duplicationTarget.content, duplicationLang); 
            setGeneratedContent(translatedContent); 
            setProduct({ 
                name: duplicationName, 
                niche: duplicationTarget.niche, 
                description: "Pagina Tradotta", 
                targetAudience: "N/A", 
                tone: PageTone.PROFESSIONAL, 
                language: duplicationLang, 
                featureCount: translatedContent.features.length,
                image: translatedContent.heroImageBase64,
                images: translatedContent.generatedImages || []
            }); 
            const newSlug = formatSlug(duplicationName);
            setSlug(newSlug); 
            setTySlug(newSlug + getThankYouSuffix(duplicationLang)); 
            setEditingPageId(null); 
            setDuplicationTarget(null); 
            setAdminSection('pages');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) { 
            console.error(error); 
            alert("Errore durante la duplicazione e traduzione."); 
        } finally { 
            setIsDuplicating(false); 
        } 
      } else {
        // Simple Copy
        const newContent = { ...duplicationTarget.content };
        setGeneratedContent(newContent);
        setProduct({
            name: duplicationName,
            niche: duplicationTarget.niche,
            description: "Copia di " + duplicationTarget.product_name,
            targetAudience: "N/A",
            tone: PageTone.PROFESSIONAL,
            language: duplicationLang,
            featureCount: newContent.features.length,
            image: newContent.heroImageBase64,
            images: newContent.generatedImages || []
        });
        const newSlug = formatSlug(duplicationName);
        setSlug(newSlug);
        setTySlug(newSlug + getThankYouSuffix(duplicationLang));
        setEditingPageId(null);
        setDuplicationTarget(null);
        setAdminSection('pages');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  const handleEditPage = (page: LandingPageRow) => {
      setEditingPageId(page.id); setSlug(page.slug || formatSlug(page.product_name)); setTySlug(page.thank_you_slug || (page.slug + getThankYouSuffix(page.content.language || 'Italiano')));
      let testimonials = page.content.testimonials || []; if (testimonials.length === 0 && page.content.testimonial) { testimonials = [page.content.testimonial]; }
      const contentWithDefaults = { ...page.content, testimonials, formConfiguration: page.content.formConfiguration || DEFAULT_FORM_CONFIG, price: page.content.price || "49.90", currency: page.content.currency || "€", originalPrice: page.content.originalPrice || "99.90", generatedImages: page.content.generatedImages || (page.content.heroImageBase64 ? [page.content.heroImageBase64] : []), typography: page.content.typography || { fontFamily: 'sans', h1Size: 'lg', h2Size: 'md', bodySize: 'md' }, stockConfig: page.content.stockConfig || { enabled: false, quantity: 13 }, showFeatureIcons: page.content.showFeatureIcons || false, language: page.content.language || 'Italiano', showSocialProofBadge: page.content.showSocialProofBadge !== false, socialProofConfig: page.content.socialProofConfig || { enabled: true, intervalSeconds: 10, maxShows: 4 }, shippingCost: page.content.shippingCost || "0", enableShippingCost: page.content.enableShippingCost || false, insuranceConfig: page.content.insuranceConfig || { enabled: false, label: 'Assicurazione Spedizione VIP', cost: '4.99', defaultChecked: false }, customTypography: page.content.customTypography || {}, priceStyles: page.content.priceStyles || {}, reviewsPosition: page.content.reviewsPosition, customHeadHtml: page.custom_head_html || page.content.customHeadHtml || '', customThankYouHtml: page.custom_thankyou_html || page.content.customThankYouHtml || '', metaLandingHtml: page.content.metaLandingHtml || '', tiktokLandingHtml: page.content.tiktokLandingHtml || '', metaThankYouHtml: page.content.metaThankYouHtml || '', tiktokThankYouHtml: page.content.tiktokThankYouHtml || '', extraLandingHtml: page.content.extraLandingHtml || '', extraThankYouHtml: page.content.extraThankYouHtml || '', customThankYouUrl: page.content.customThankYouUrl || '', backgroundColor: page.content.backgroundColor, customThankYouTitle: page.content.customThankYouTitle, customThankYouMessage: page.content.customThankYouMessage };
      setGeneratedContent(contentWithDefaults as GeneratedContent); setProduct({ name: page.product_name, niche: page.niche, description: "Caricato da pagina esistente", targetAudience: "N/A", tone: PageTone.PROFESSIONAL, language: contentWithDefaults.language, featureCount: contentWithDefaults.features?.length || 3, image: contentWithDefaults.heroImageBase64 }); if (page.content.templateId) { setSelectedTemplate(page.content.templateId); }
  };

  const uploadImageToStorage = async (imageString: string): Promise<string> => {
      if (!supabase || !imageString.startsWith('data:')) return imageString;
      try { const blob = base64ToBlob(imageString); if (!blob) return imageString; const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`; const { data, error } = await supabase.storage.from('landing-images').upload(fileName, blob, { contentType: blob.type || 'image/png', upsert: false }); if (error) { console.error("Upload error:", error); return imageString; } const { data: publicData } = supabase.storage.from('landing-images').getPublicUrl(fileName); return publicData.publicUrl; } catch (e) { console.error("Exception uploading image:", e); return imageString; }
  };

  const handleSaveToDb = async () => {
    if (!generatedContent) return;
    if (!session) { alert("Devi essere loggato per salvare."); return; }
    setIsSaving(true);
    try {
        const contentToSave = JSON.parse(JSON.stringify(generatedContent));
        if (isSupabaseConfigured() && supabase) {
            if (contentToSave.heroImageBase64) contentToSave.heroImageBase64 = await uploadImageToStorage(contentToSave.heroImageBase64);
            if (contentToSave.generatedImages && contentToSave.generatedImages.length > 0) contentToSave.generatedImages = await Promise.all(contentToSave.generatedImages.map((img: string) => uploadImageToStorage(img)));
            if (contentToSave.features) for (let i = 0; i < contentToSave.features.length; i++) { if (contentToSave.features[i].image) contentToSave.features[i].image = await uploadImageToStorage(contentToSave.features[i].image); }
            if (contentToSave.testimonials) {
                for (let i = 0; i < contentToSave.testimonials.length; i++) {
                    if (contentToSave.testimonials[i].image) contentToSave.testimonials[i].image = await uploadImageToStorage(contentToSave.testimonials[i].image);
                }
            }
            if (contentToSave.boxContent && contentToSave.boxContent.image) contentToSave.boxContent.image = await uploadImageToStorage(contentToSave.boxContent.image);
        }
        const finalSlug = slug || formatSlug(product.name); const lang = generatedContent.language || 'Italiano'; const finalTySlug = tySlug || (finalSlug + getThankYouSuffix(lang)); const customHeadScript = contentToSave.customHeadHtml || ''; const customThankYouScript = contentToSave.customThankYouHtml || '';
        const contentPayload = { ...contentToSave, templateId: selectedTemplate, thankYouConfig: { enabled: true, slugSuffix: getThankYouSuffix(lang) } };
        if (isSupabaseConfigured() && supabase && session.id !== 'admin-local') {
            let error;
            if (editingPageId) { const { error: updateError } = await supabase.from('landing_pages').update({ product_name: product.name, slug: finalSlug, thank_you_slug: finalTySlug, niche: product.niche, content: contentPayload, custom_head_html: customHeadScript, custom_thankyou_html: customThankYouScript }).eq('id', editingPageId); error = updateError; } else { const { error: insertError } = await supabase.from('landing_pages').insert({ product_name: product.name, slug: finalSlug, thank_you_slug: finalTySlug, niche: product.niche, content: contentPayload, is_published: true, custom_head_html: customHeadScript, custom_thankyou_html: customThankYouScript }); error = insertError; }
            if (error) { console.error("Supabase save error:", error); alert("Errore salvataggio database: " + error.message); } else { alert(editingPageId ? "Pagina aggiornata con successo!" : "Pagina pubblicata con successo!"); await fetchPublicPages(); handleCloseEditor(); }
        } else {
            if (editingPageId) { setPublicPages(prev => prev.map(p => p.id === editingPageId ? { ...p, product_name: product.name, slug: finalSlug, thank_you_slug: finalTySlug, content: contentPayload, custom_head_html: customHeadScript, custom_thankyou_html: customThankYouScript } : p)); alert("Modalità Demo: Pagina aggiornata (Immagini non caricate su storage reale)."); } else { const newPage: LandingPageRow = { id: Date.now().toString(), created_at: new Date().toISOString(), product_name: product.name, slug: finalSlug, thank_you_slug: finalTySlug, niche: product.niche, content: contentPayload, is_published: true, custom_head_html: customHeadScript, custom_thankyou_html: customThankYouScript }; setPublicPages(prev => [newPage, ...prev]); alert("Modalità Demo: Pagina pubblicata (Immagini non caricate su storage reale)."); } handleCloseEditor();
        }
    } catch (err) { console.error("Unexpected error saving:", err); alert("Errore imprevisto durante il salvataggio."); } finally { setIsSaving(false); }
  };

  const handleCloseEditor = () => { setGeneratedContent(null); setEditingPageId(null); setSlug(''); setTySlug(''); setProduct({ name: '', niche: '', description: '', targetAudience: '', tone: PageTone.PROFESSIONAL, language: 'Italiano', image: undefined, images: [], featureCount: 3 }); setSelectedTemplate('gadget-cod'); setImageGenerationCount(1); setReviewCount(10); setGenTechImages(false); setGenBeforeAfter(false); setGenHumanUse(false); setCustomImagePrompt(''); setPreviewMode('landing'); }
  const handleDiscard = () => { if(confirm("Sei sicuro? Le modifiche non salvate andranno perse.")) { handleCloseEditor(); } }
  const handleDeletePage = useCallback(async (id: string) => { if(!confirm("Sei sicuro di voler eliminare questa pagina?")) return; if (isSupabaseConfigured() && supabase && session?.id !== 'admin-local') { await supabase.from('landing_pages').delete().eq('id', id); fetchPublicPages(); } else { setPublicPages(prev => prev.filter(p => p.id !== id)); } }, [session]);
  const updateContentField = (field: keyof GeneratedContent, value: any) => { if (!generatedContent) return; setGeneratedContent({ ...generatedContent, [field]: value }); };
  const updateFeature = (index: number, key: 'title' | 'description' | 'image' | 'showCta', value: any) => { if (!generatedContent) return; const newFeatures = [...generatedContent.features]; newFeatures[index] = { ...newFeatures[index], [key]: value }; setGeneratedContent({ ...generatedContent, features: newFeatures }); };
  const updateBenefit = (index: number, value: string) => { if (!generatedContent) return; const newBenefits = [...generatedContent.benefits]; newBenefits[index] = value; setGeneratedContent({ ...generatedContent, benefits: newBenefits }); };
  const updateTypography = (field: keyof TypographyConfig, value: string) => { if (!generatedContent) return; const currentTypo = generatedContent.typography || { fontFamily: 'sans', h1Size: 'lg', h2Size: 'md', bodySize: 'md' }; setGeneratedContent({ ...generatedContent, typography: { ...currentTypo, [field]: value } }); };
  const updateCustomTypography = (field: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'cta', value: string) => { if (!generatedContent) return; const currentCustom = generatedContent.customTypography || {}; setGeneratedContent({ ...generatedContent, customTypography: { ...currentCustom, [field]: value } }); };
  const updatePriceStyles = (field: 'color' | 'fontSize', value: string) => { if (!generatedContent) return; const currentStyles = generatedContent.priceStyles || {}; setGeneratedContent({ ...generatedContent, priceStyles: { ...currentStyles, [field]: value } }); };
  const updateStockConfig = (key: 'enabled' | 'quantity' | 'textOverride', value: any) => { if (!generatedContent) return; const currentConfig = generatedContent.stockConfig || { enabled: false, quantity: 13 }; setGeneratedContent({ ...generatedContent, stockConfig: { ...currentConfig, [key]: value } }); };
  const updateSocialProofConfig = (key: 'enabled' | 'intervalSeconds' | 'maxShows', value: any) => { if (!generatedContent) return; const currentConfig = generatedContent.socialProofConfig || { enabled: true, intervalSeconds: 10, maxShows: 4 }; setGeneratedContent({ ...generatedContent, socialProofConfig: { ...currentConfig, [key]: value } }); };
  const updateInsuranceConfig = (key: keyof NonNullable<GeneratedContent['insuranceConfig']>, value: any) => { if (!generatedContent) return; const currentConfig = generatedContent.insuranceConfig || { enabled: false, label: '', cost: '0.00', defaultChecked: false }; setGeneratedContent({ ...generatedContent, insuranceConfig: { ...currentConfig, [key]: value } });};
  const updateTestimonial = (index: number, key: keyof Testimonial, value: string) => { if(!generatedContent || !generatedContent.testimonials) return; const newTestimonials = [...generatedContent.testimonials]; newTestimonials[index] = { ...newTestimonials[index], [key]: value }; setGeneratedContent({ ...generatedContent, testimonials: newTestimonials, testimonial: index === 0 ? newTestimonials[0] : generatedContent.testimonial }); };
  const addTestimonial = () => { if(!generatedContent) return; const newT: Testimonial = { name: "Nuovo Cliente", role: "Acquisto Verificato", text: "...", date: new Date().toLocaleDateString('it-IT') }; setGeneratedContent({ ...generatedContent, testimonials: [...(generatedContent.testimonials || []), newT] }); };
  const removeTestimonial = (index: number) => { if(!generatedContent || !generatedContent.testimonials) return; const newTestimonials = generatedContent.testimonials.filter((_, i) => i !== index); setGeneratedContent({ ...generatedContent, testimonials: newTestimonials, testimonial: index === 0 && newTestimonials.length > 0 ? newTestimonials[0] : generatedContent.testimonial }); };
  const updateBoxContent = (field: 'enabled' | 'title' | 'items' | 'image', value: any) => { if (!generatedContent) return; const currentBox = generatedContent.boxContent || { enabled: false, title: "Ordinando oggi ricevi:", items: [] }; setGeneratedContent({ ...generatedContent, boxContent: { ...currentBox, [field]: value } }); };
  const updateFormConfig = (index: number, field: keyof FormFieldConfig, value: any) => { if (!generatedContent || !generatedContent.formConfiguration) return; const newConfig = [...generatedContent.formConfiguration]; newConfig[index] = { ...newConfig[index], [field]: value }; if (field === 'enabled' && value === false) { newConfig[index].required = false; } setGeneratedContent({ ...generatedContent, formConfiguration: newConfig }); };
  const updateUiTranslation = (key: keyof UiTranslation, value: string) => { if (!generatedContent || !generatedContent.uiTranslation) return; setGeneratedContent({ ...generatedContent, uiTranslation: { ...generatedContent.uiTranslation, [key]: value } }); };
  const handleViewPage = useCallback((page: LandingPageRow) => { const contentWithScripts = { ...page.content, customHeadHtml: page.custom_head_html || page.content.customHeadHtml, customThankYouHtml: page.custom_thankyou_html || page.content.customThankYouHtml }; setSelectedPublicPage(contentWithScripts); const tySlug = page.thank_you_slug || (page.slug ? `${page.slug}${getThankYouSuffix(page.content.language || 'Italiano')}` : undefined); setCurrentThankYouSlug(tySlug); setView('product_view'); const param = page.slug ? `s=${page.slug}` : `p=${page.id}`; window.history.pushState({}, '', `?${param}`); }, []);

  // ... (Render logic) ...
  if (view === 'product_view' && selectedPublicPage) {
      return (
        <div className="relative">
            <div className="fixed top-3 left-3 z-[100] md:left-3 left-auto right-3 md:right-auto"><button onClick={() => { setView('home'); window.history.pushState({}, '', window.location.pathname); }} className="hidden md:flex bg-white/80 backdrop-blur-md text-slate-800 p-2 md:px-4 md:py-2 rounded-full shadow-sm border border-slate-200/50 hover:bg-white hover:shadow-md transition-all items-center gap-2 group" title="Torna allo Shop"><ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" /> <span className="hidden md:inline font-bold text-sm">Torna allo Shop</span></button></div>
            {session && (<div className="fixed top-3 right-3 z-[100]"><button onClick={() => setView('admin')} className="bg-emerald-600/90 backdrop-blur text-white p-2 md:px-4 md:py-2 rounded-full shadow-lg hover:bg-emerald-600 transition flex items-center gap-2 font-bold" title="Dashboard Admin"><LayoutDashboard className="w-5 h-5" /> <span className="hidden md:inline">Dashboard Admin</span></button></div>)}
            <LandingPage content={selectedPublicPage} thankYouSlug={currentThankYouSlug} onRedirect={(data) => { setOrderData(data); setView('thank_you_view'); window.scrollTo(0,0); try { const lang = selectedPublicPage?.language || 'Italiano'; const suffix = getThankYouSuffix(lang); let targetSlug = currentThankYouSlug; if (!targetSlug && selectedPublicPage) { const currentSlugParam = new URLSearchParams(window.location.search).get('s'); targetSlug = (currentSlugParam || formatSlug(selectedPublicPage.headline)) + suffix; } const nextUrl = new URL(window.location.href); nextUrl.search = ''; if (targetSlug) nextUrl.searchParams.set('s', targetSlug.replace(/^\//, '')); window.history.pushState({}, '', nextUrl.toString()); } catch (e) { console.warn("Navigation/Redirect failed (benign in preview):", e); } }} />
        </div>
      );
  }

  if (view === 'thank_you_view' && selectedPublicPage) {
      return ( <div className="relative"> {session && (<div className="fixed top-3 right-3 z-[100]"><button onClick={() => setView('admin')} className="bg-emerald-600 text-white p-2 rounded-full shadow"><LayoutDashboard className="w-4 h-4"/></button></div>)} <ThankYouPage content={selectedPublicPage} initialData={orderData} /> </div> )
  }

  if (view === 'admin' && session) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
        <LiveMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} users={onlineUsers} />
        <nav className="border-b border-slate-800 bg-slate-950 p-4 sticky top-0 z-40">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl"><Sparkles className="w-6 h-6" /><span>Agdid Admin</span></div>
                <button onClick={() => setIsMapOpen(true)} className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 ml-2 shadow-sm animate-in fade-in hover:bg-slate-800 transition cursor-pointer hover:border-emerald-500/50 group" title="Apri Mappa"><div className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></div><span className="text-xs font-mono font-bold text-emerald-100 group-hover:text-white transition-colors">{onlineUsers.length} Live</span></button>
                <div className="hidden md:flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800"><button onClick={() => setAdminSection('pages')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${adminSection === 'pages' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Generatore</button><button onClick={() => setAdminSection('settings')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${adminSection === 'settings' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Impostazioni Sito</button></div>
            </div>
            <div className="flex items-center gap-4"><button onClick={() => setView('home')} className="text-sm text-slate-400 hover:text-white mr-4">Vedi Sito Pubblico</button><span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-500 hidden sm:block">{session.email}</span><button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"><LogOut className="w-5 h-5" /></button></div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-12">
            {adminSection === 'settings' ? (
                // ... (Settings view) ...
                <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-8"><div className="bg-slate-800 p-3 rounded-xl"><Settings className="w-8 h-8 text-emerald-400" /></div><div><h1 className="text-2xl font-bold text-white">Impostazioni Globali Sito</h1><p className="text-slate-400">Personalizza il nome del sito e i testi del footer.</p></div></div>
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl space-y-6">
                        <div><label className="block text-sm font-bold text-slate-300 mb-2">Nome del Sito</label><input type="text" value={siteConfig.siteName} onChange={(e) => setSiteConfig({...siteConfig, siteName: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold" placeholder="es. BESTOFFERS"/><p className="text-xs text-slate-500 mt-2">Appare nell'header e nel footer.</p></div>
                        <div><label className="block text-sm font-bold text-slate-300 mb-2">Testo Footer</label><input type="text" value={siteConfig.footerText} onChange={(e) => setSiteConfig({...siteConfig, footerText: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="es. © 2025 Tutti i diritti riservati."/><p className="text-xs text-slate-500 mt-2">Appare in fondo a tutte le pagine.</p></div>
                        <div className="pt-4 border-t border-slate-700 flex justify-end"><button onClick={saveSiteSettings} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition flex items-center gap-2"><Save className="w-5 h-5" /> Salva Impostazioni</button></div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5 xl:col-span-4 h-fit sticky top-24">
                        {!generatedContent ? (
                            <>
                                <div className="mb-6"><h1 className="text-2xl font-bold text-white mb-1">Crea Nuova Landing</h1><p className="text-slate-400 text-sm">Compila i dati e genera la tua pagina.</p></div>
                                <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">Step 1: Design</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {TEMPLATES.map((t) => (<div key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`cursor-pointer relative p-2 rounded-lg border-2 transition-all text-center ${selectedTemplate === t.id ? 'border-emerald-500 bg-slate-700' : 'border-slate-700 hover:bg-slate-750'}`}><div className={`h-8 mb-1 rounded w-full ${t.color}`}></div><p className="text-[10px] font-bold text-white leading-tight">{t.name}</p></div>))}
                                            </div>
                                        </div>
                                        <div className="border-t border-slate-700 pt-6">
                                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">Step 2: Dettagli</label>
                                            <div className="space-y-4">
                                                <div><label className="block text-xs font-medium text-slate-400 mb-1">Nome Prodotto</label><input type="text" value={product.name} onChange={(e) => setProduct({...product, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="es. Integratore FocusPro"/></div>
                                                <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-slate-400 mb-1">Nicchia</label><input type="text" value={product.niche} onChange={(e) => setProduct({...product, niche: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="es. Salute"/></div><div><label className="block text-xs font-medium text-slate-400 mb-1">Target</label><input type="text" value={product.targetAudience} onChange={(e) => setProduct({...product, targetAudience: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="es. Studenti"/></div></div>
                                                <div><label className="block text-xs font-medium text-slate-400 mb-1">Foto (Carica più immagini)</label><div className="flex flex-col gap-2"><div className="w-full border border-dashed border-slate-600 hover:border-emerald-500 rounded-lg p-3 text-center cursor-pointer transition bg-slate-900/50 flex flex-col items-center justify-center gap-1 group" onClick={() => fileInputRef.current?.click()}><Images className="w-5 h-5 text-slate-500 group-hover:text-emerald-400" /><span className="text-[10px] text-slate-400">Carica Foto Prodotto</span><input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleImageUpload} /></div>{product.images && product.images.length > 0 && (<div className="grid grid-cols-4 gap-2 mt-2">{product.images.map((img, idx) => (<div key={idx} className="relative aspect-square rounded border border-slate-600 overflow-hidden group"><img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" /><button onClick={(e) => { e.stopPropagation(); removeImage(idx); }} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white"><X className="w-4 h-4" /></button></div>))}</div>)}</div>{product.images && product.images.length > 0 && (<div className="bg-slate-900 p-2 rounded-lg border border-slate-700 mt-2 space-y-2"><div className="flex items-center justify-between"><span className="text-[10px] text-slate-400">Genera altre varianti AI?</span><div className="flex items-center gap-2"><span className="text-xs font-bold text-emerald-400">{imageGenerationCount}</span><input type="range" min="0" max="5" value={imageGenerationCount} onChange={(e) => setImageGenerationCount(parseInt(e.target.value))} className="w-20 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"/></div></div><div className="flex flex-col gap-2 pt-1 border-t border-slate-800"><div className="flex items-center gap-3"><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={genTechImages} onChange={(e) => setGenTechImages(e.target.checked)} className="w-3 h-3 accent-emerald-500 rounded"/><span className="text-[10px] text-slate-300">Tecniche/Esploso</span></label><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={genBeforeAfter} onChange={(e) => setGenBeforeAfter(e.target.checked)} className="w-3 h-3 accent-emerald-500 rounded"/><span className="text-[10px] text-slate-300">Prima/Dopo</span></label></div><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={genHumanUse} onChange={(e) => setGenHumanUse(e.target.checked)} className="w-3 h-3 accent-emerald-500 rounded"/><span className="text-[10px] text-slate-300">Umano/Lifestyle <span className="text-slate-500">(Usato da una persona)</span></span></label><div><input type="text" value={customImagePrompt} onChange={(e) => setCustomImagePrompt(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 text-[10px] text-white placeholder-slate-500" placeholder="Prompt opzionale (es: ambientato in montagna...)"/></div></div></div>)}</div>
                                                <div><label className="block text-xs font-medium text-slate-400 mb-1">Descrizione</label><textarea value={product.description} onChange={(e) => setProduct({...product, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none h-24" placeholder="Punti di forza..."/></div>
                                                <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-slate-400 mb-1">Tono</label><select value={product.tone} onChange={(e) => setProduct({...product, tone: e.target.value as PageTone})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none">{Object.values(PageTone).map((t) => (<option key={t} value={t}>{t}</option>))}</select></div><div><label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1"><Globe className="w-3 h-3"/> Lingua Landing</label><select value={product.language} onChange={(e) => setProduct({...product, language: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none">{SUPPORTED_LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}</select></div></div>
                                                <div><label className="block text-xs font-medium text-slate-400 mb-1">Numero Paragrafi/Features</label><div className="flex items-center gap-2 h-10 bg-slate-900 border border-slate-700 rounded-lg px-2"><input type="range" min="1" max="20" value={product.featureCount || 3} onChange={(e) => setProduct({...product, featureCount: parseInt(e.target.value)})} className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"/><span className="text-xs font-bold text-white w-5 text-center">{product.featureCount || 3}</span></div></div>
                                                <div><label className="block text-xs font-medium text-slate-400 mb-1">Num. Recensioni</label><div className="flex items-center gap-2 h-10 bg-slate-900 border border-slate-700 rounded-lg px-2"><input type="range" min="1" max="20" value={reviewCount} onChange={(e) => setReviewCount(parseInt(e.target.value))} className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"/><span className="text-xs font-bold text-white w-5 text-center">{reviewCount}</span></div></div>
                                                <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-500/20 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">{isGenerating ? (<><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>) : (<><Sparkles className="w-4 h-4" /> Genera Anteprima</>)}</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center gap-2 mb-6">
                                    <button onClick={handleDiscard} className="p-2 hover:bg-slate-800 rounded-full transition"><ArrowLeft className="w-5 h-5 text-slate-400" /></button>
                                    <div><h1 className="text-2xl font-bold text-white mb-0.5">Modifica Contenuti</h1><p className="text-slate-400 text-xs">{editingPageId ? "Modifica pagina esistente" : "Rifinisci prima di pubblicare"}</p></div>
                                </div>
                                <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-600">
                                    <div className="space-y-8">
                                        <div className="border-b border-slate-700 pb-4">
                                            <div className="flex items-center gap-2 mb-3"><LinkIcon className="w-4 h-4 text-emerald-400" /><label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide">URL & Link</label></div>
                                            <div className="space-y-3"><div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700"><label className="block text-[10px] font-medium text-slate-400 mb-1">Landing Page Slug</label><div className="flex items-center"><span className="text-xs text-slate-500 bg-slate-800 px-2 py-2 rounded-l border-y border-l border-slate-700">/s/</span><input type="text" value={slug} onChange={(e) => setSlug(formatSlug(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-r p-2 text-sm text-white focus:border-emerald-500 outline-none font-mono" placeholder="nome-prodotto"/></div></div></div>
                                        </div>
                                        {/* Design */}
                                        <div><label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">1. Design</label><div className="grid grid-cols-3 gap-2 mb-4">{TEMPLATES.map((t) => (<div key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`cursor-pointer p-1.5 rounded border-2 transition-all text-center ${selectedTemplate === t.id ? 'border-emerald-500 bg-slate-700' : 'border-slate-700 hover:bg-slate-750'}`}><p className="text-[9px] font-bold text-white truncate">{t.name}</p></div>))}</div></div>
                                        {/* Price & Offer */}
                                        <div className="border-t border-slate-700 pt-4"><label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">2. Prezzo & Offerta</label><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] text-slate-400">Prezzo</label><input type="text" value={generatedContent.price} onChange={(e) => updateContentField('price', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"/></div><div><label className="text-[10px] text-slate-400">Prezzo Originale</label><input type="text" value={generatedContent.originalPrice} onChange={(e) => updateContentField('originalPrice', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"/></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] text-slate-400">Valuta</label><select value={generatedContent.currency} onChange={(e) => updateContentField('currency', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white">{SUPPORTED_CURRENCIES.map(c => <option key={c.symbol} value={c.symbol}>{c.label}</option>)}</select></div><div><label className="text-[10px] text-slate-400">Costo Spedizione</label><input type="text" value={generatedContent.shippingCost} onChange={(e) => updateContentField('shippingCost', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"/></div></div><div className="flex items-center gap-2"><input type="checkbox" checked={generatedContent.enableShippingCost || false} onChange={(e) => updateContentField('enableShippingCost', e.target.checked)} className="w-4 h-4 accent-emerald-500"/><span className="text-xs text-slate-300">Mostra Costo Spedizione nel carrello</span></div><div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] text-slate-400">Quantità Stock</label><input type="number" value={generatedContent.stockConfig?.quantity || 13} onChange={(e) => updateStockConfig('quantity', parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"/></div><div className="flex items-end pb-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={generatedContent.stockConfig?.enabled || false} onChange={(e) => updateStockConfig('enabled', e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded"/><span className="text-xs text-slate-300">Mostra Scarsità</span></label></div></div>{generatedContent.stockConfig?.enabled && (<div className="mt-2 animate-in fade-in slide-in-from-top-1"><label className="text-[10px] text-slate-400">Testo Personalizzato (Usa <strong>{'{x}'}</strong> per il numero)</label><input type="text" placeholder="Es: Affrettati! Solo {x} pezzi rimasti!" value={generatedContent.stockConfig?.textOverride || ''} onChange={(e) => updateStockConfig('textOverride', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white placeholder-slate-600"/></div>)}<div className="bg-slate-900 p-3 rounded-lg border border-slate-700"><div className="flex items-center justify-between mb-2"><label className="text-xs font-bold text-slate-300">Notifiche Social Proof</label><input type="checkbox" checked={generatedContent.socialProofConfig?.enabled !== false} onChange={(e) => updateSocialProofConfig('enabled', e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded"/></div>{generatedContent.socialProofConfig?.enabled !== false && (<div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-slate-500">Intervallo (sec)</label><input type="number" value={generatedContent.socialProofConfig?.intervalSeconds || 10} onChange={(e) => updateSocialProofConfig('intervalSeconds', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white"/></div><div><label className="text-[10px] text-slate-500">Max Mostre</label><input type="number" value={generatedContent.socialProofConfig?.maxShows || 4} onChange={(e) => updateSocialProofConfig('maxShows', parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white"/></div></div>)}</div>
                                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 mt-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-400"/> Assicurazione Spedizione</label>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={generatedContent.insuranceConfig?.enabled || false} 
                                                        onChange={(e) => updateInsuranceConfig('enabled', e.target.checked)} 
                                                        className="w-4 h-4 accent-emerald-500 rounded"
                                                    />
                                                </div>
                                                {generatedContent.insuranceConfig?.enabled && (
                                                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-800 animate-in fade-in slide-in-from-top-1">
                                                        <div>
                                                            <label className="text-[10px] text-slate-500">Etichetta</label>
                                                            <input 
                                                                type="text" 
                                                                value={generatedContent.insuranceConfig?.label || ''} 
                                                                onChange={(e) => updateInsuranceConfig('label', e.target.value)} 
                                                                className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-slate-500">Costo (es. 4.99)</label>
                                                            <input 
                                                                type="text" 
                                                                value={generatedContent.insuranceConfig?.cost || '0.00'} 
                                                                onChange={(e) => updateInsuranceConfig('cost', e.target.value)} 
                                                                className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-xs text-white"
                                                            />
                                                        </div>
                                                        <div className="pt-1">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={generatedContent.insuranceConfig?.defaultChecked || false} 
                                                                    onChange={(e) => updateInsuranceConfig('defaultChecked', e.target.checked)} 
                                                                    className="w-3 h-3 accent-emerald-500 rounded"
                                                                />
                                                                <span className="text-xs text-slate-300">Selezionata di default</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div></div>
                                        {/* Content */}
                                        <div className="border-t border-slate-700 pt-4">
                                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">3. Contenuti</label>
                                            <div className="space-y-3">
                                                <div><label className="text-[10px] text-slate-400">Headline (H1)</label><textarea value={generatedContent.headline} onChange={(e) => updateContentField('headline', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white h-16"/></div>
                                                <div><label className="text-[10px] text-slate-400">Subheadline (H2)</label><textarea value={generatedContent.subheadline} onChange={(e) => updateContentField('subheadline', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white h-12"/></div>
                                                <div><label className="text-[10px] text-slate-400 mb-1 block">Benefici (Lista puntata)</label>{generatedContent.benefits.map((b, i) => (<input key={i} type="text" value={b} onChange={(e) => updateBenefit(i, e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white mb-1"/>))}</div>
                                                <div className="mt-4">
                                                    <label className="text-xs font-bold text-slate-300 mb-2 block">Features / Paragrafi</label>
                                                    
                                                    {/* REVIEWS POSITION SELECTOR */}
                                                    <div className="bg-slate-900 p-2 rounded border border-slate-700 mb-3">
                                                        <label className="text-[10px] text-emerald-400 mb-1 block font-bold">Posizione Recensioni</label>
                                                        <select 
                                                            value={generatedContent.reviewsPosition === undefined ? 'bottom' : generatedContent.reviewsPosition} 
                                                            onChange={(e) => updateContentField('reviewsPosition', e.target.value === 'bottom' ? undefined : parseInt(e.target.value))}
                                                            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white outline-none"
                                                        >
                                                            <option value="bottom">In fondo alla pagina (Default)</option>
                                                            {generatedContent.features.map((_, i) => (
                                                                <option key={i} value={i+1}>Dopo il paragrafo {i+1}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {generatedContent.features.map((f, i) => (
                                                        <div key={i} className="bg-slate-900 p-3 rounded-lg border border-slate-700 mb-2 transition-all">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] text-emerald-500 font-bold">Feature {i+1}</span>
                                                                {/* MOVE BUTTONS */}
                                                                <div className="flex gap-1">
                                                                    <button 
                                                                        onClick={() => moveFeature(i, 'up')} 
                                                                        disabled={i === 0}
                                                                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30"
                                                                        title="Sposta Su"
                                                                    >
                                                                        <ArrowUp className="w-3 h-3"/>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => moveFeature(i, 'down')} 
                                                                        disabled={i === generatedContent.features.length - 1}
                                                                        className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white disabled:opacity-30"
                                                                        title="Sposta Giù"
                                                                    >
                                                                        <ArrowDown className="w-3 h-3"/>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <input type="text" value={f.title} onChange={(e) => updateFeature(i, 'title', e.target.value)} className="w-full bg-slate-800 border-none rounded p-1 text-sm text-white mb-1 font-bold placeholder-slate-600" placeholder="Titolo"/>
                                                            <textarea value={f.description} onChange={(e) => updateFeature(i, 'description', e.target.value)} className="w-full bg-slate-800 border-none rounded p-1 text-xs text-slate-300 h-16 placeholder-slate-600" placeholder="Descrizione"/>
                                                            <div className="mt-2"><label className="text-[10px] text-slate-400 mb-1 block">Seleziona Immagine</label><div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"><div onClick={() => updateFeature(i, 'image', undefined)} className={`w-10 h-10 flex-shrink-0 border cursor-pointer flex items-center justify-center bg-slate-800 rounded ${!f.image ? 'border-emerald-500' : 'border-slate-600'}`} title="Nessuna immagine specifica (usa automatica)"><span className="text-[8px] text-slate-400">Auto</span></div>{(generatedContent.generatedImages || []).map((img, imgIdx) => (<img key={imgIdx} src={img} onClick={() => updateFeature(i, 'image', img)} className={`w-10 h-10 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${f.image === img ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`} alt={`Option ${imgIdx}`}/>))}</div></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Box Content Editor */}
                                        <div className="border-t border-slate-700 pt-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                                                    <Package className="w-3 h-3" />
                                                    Box "Cosa Ricevi"
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400">{generatedContent.boxContent?.enabled ? 'Attivo' : 'Disattivato'}</span>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={generatedContent.boxContent?.enabled || false} 
                                                        onChange={(e) => updateBoxContent('enabled', e.target.checked)} 
                                                        className="w-4 h-4 accent-emerald-500"
                                                    />
                                                </div>
                                            </div>
                                            
                                            {generatedContent.boxContent?.enabled && (
                                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-3 animate-in fade-in slide-in-from-top-2">
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 mb-1 block">Titolo Sezione</label>
                                                        <input 
                                                            type="text" 
                                                            value={generatedContent.boxContent?.title || ''} 
                                                            onChange={(e) => updateBoxContent('title', e.target.value)} 
                                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white"
                                                            placeholder="Es: Ordinando oggi ricevi:"
                                                        />
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 mb-1 block">Lista Oggetti (uno per riga)</label>
                                                        <textarea 
                                                            value={(generatedContent.boxContent?.items || []).join('\n')} 
                                                            onChange={(e) => updateBoxContent('items', e.target.value.split('\n'))} 
                                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white h-24"
                                                            placeholder="1x Prodotto&#10;1x Manuale&#10;1x Garanzia"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] text-slate-400 mb-1 block">Immagine Box/Packaging (Opzionale)</label>
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                className="w-16 h-16 bg-slate-800 border border-dashed border-slate-600 rounded flex items-center justify-center cursor-pointer hover:border-emerald-500 overflow-hidden relative group"
                                                                onClick={() => boxImageInputRef.current?.click()}
                                                            >
                                                                {generatedContent.boxContent?.image ? (
                                                                    <>
                                                                        <img src={generatedContent.boxContent.image} className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                                            <Pencil className="w-4 h-4 text-white" />
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <Plus className="w-5 h-5 text-slate-500" />
                                                                )}
                                                            </div>
                                                            {generatedContent.boxContent?.image && (
                                                                <button onClick={() => updateBoxContent('image', undefined)} className="text-xs text-red-400 hover:text-red-300">Rimuovi</button>
                                                            )}
                                                            <input 
                                                                type="file" 
                                                                ref={boxImageInputRef} 
                                                                className="hidden" 
                                                                accept="image/*" 
                                                                onChange={handleBoxImageUpload} 
                                                            />
                                                            <p className="text-[9px] text-slate-500 flex-1">Clicca per caricare un'immagine del packaging o del contenuto.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Images & Gallery */}
                                        <div className="border-t border-slate-700 pt-4"><label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">4. Immagini</label><div className="grid grid-cols-3 gap-2 mb-2">{(generatedContent.generatedImages || []).map((img, idx) => (<div key={idx} className="relative group aspect-square rounded overflow-hidden border border-slate-600 bg-slate-800"><img src={img} className="w-full h-full object-cover"/><div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><button onClick={(e) => { e.stopPropagation(); moveGalleryImage(idx, 'left'); }} className={`bg-black/60 hover:bg-black/80 p-1 rounded-full text-white pointer-events-auto transition-transform hover:scale-110 ${idx === 0 ? 'invisible' : ''}`}><ChevronLeft className="w-4 h-4" /></button><button onClick={(e) => { e.stopPropagation(); moveGalleryImage(idx, 'right'); }} className={`bg-black/60 hover:bg-black/80 p-1 rounded-full text-white pointer-events-auto transition-transform hover:scale-110 ${idx === (generatedContent.generatedImages?.length || 0) - 1 ? 'invisible' : ''}`}><ChevronRight className="w-4 h-4" /></button></div><button onClick={() => removeGalleryImage(img)} className="absolute top-1 right-1 bg-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition z-20 hover:scale-110"><X className="w-3 h-3 text-white"/></button>{generatedContent.heroImageBase64 === img && <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-[8px] text-white text-center font-bold z-10 py-0.5">HERO</div>}{generatedContent.heroImageBase64 !== img && (<button onClick={() => updateContentField('heroImageBase64', img)} className="absolute bottom-1 left-1 bg-slate-800/90 text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 z-10 hover:bg-emerald-600 transition">Set Hero</button>)}</div>))}<div onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded border border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700 hover:border-emerald-500 transition text-slate-500 hover:text-emerald-400"><Plus className="w-6 h-6"/><span className="text-[8px]">Add</span></div><input type="file" ref={galleryInputRef} className="hidden" multiple accept="image/*" onChange={handleGalleryUpload} /></div><div className="bg-slate-900 p-3 rounded-lg border border-slate-700 mt-3 space-y-3"><label className="text-[10px] font-bold text-slate-300 mb-1 block flex items-center gap-1"><Sparkles className="w-3 h-3 text-emerald-400" /> Genera Nuove Varianti AI</label><div className="flex items-center justify-between"><span className="text-[10px] text-slate-400">Quante?</span><div className="flex items-center gap-2"><span className="text-xs font-bold text-emerald-400">{imageGenerationCount}</span><input type="range" min="1" max="4" value={imageGenerationCount} onChange={(e) => setImageGenerationCount(parseInt(e.target.value))} className="w-20 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"/></div></div><div className="flex flex-col gap-2 pt-1 border-t border-slate-800"><div className="flex items-center gap-3"><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={genTechImages} onChange={(e) => setGenTechImages(e.target.checked)} className="w-3 h-3 accent-emerald-500 rounded"/><span className="text-[10px] text-slate-300">Tecniche/Esploso</span></label><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={genBeforeAfter} onChange={(e) => setGenBeforeAfter(e.target.checked)} className="w-3 h-3 accent-emerald-500 rounded"/><span className="text-[10px] text-slate-300">Prima/Dopo</span></label></div><label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={genHumanUse} onChange={(e) => setGenHumanUse(e.target.checked)} className="w-3 h-3 accent-emerald-500 rounded"/><span className="text-[10px] text-slate-300">Umano/Lifestyle <span className="text-slate-500">(Usato da una persona)</span></span></label><div><input type="text" value={customImagePrompt} onChange={(e) => setCustomImagePrompt(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 text-[10px] text-white placeholder-slate-500" placeholder="Prompt opzionale (es: ambientato in montagna...)"/></div></div><button onClick={handleGenerateMoreImages} disabled={isGeneratingImage} className="w-full py-2 bg-slate-800 text-xs text-emerald-400 border border-emerald-500/30 rounded hover:bg-slate-700 flex items-center justify-center gap-1">{isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} Genera Ora</button></div></div>
                                        {/* Reviews */}
                                        <div className="border-t border-slate-700 pt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide">5. Recensioni</label>
                                                <button onClick={addTestimonial} className="bg-slate-700 hover:bg-slate-600 text-emerald-400 text-xs font-bold py-1 px-2 rounded-md flex items-center gap-1"><Plus className="w-3 h-3"/> Aggiungi</button>
                                            </div>
                                            <div className="space-y-2">
                                                {(generatedContent.testimonials || []).map((t, i) => (
                                                    <div key={i} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                                        <div className="flex items-start gap-2">
                                                            <div className="flex-1 space-y-1">
                                                                <input type="text" value={t.name} onChange={(e) => updateTestimonial(i, 'name', e.target.value)} className="w-full bg-slate-800 border-none rounded p-1 text-sm text-white font-bold" placeholder="Nome"/>
                                                                <input type="text" value={t.title || ''} onChange={(e) => updateTestimonial(i, 'title', e.target.value)} className="w-full bg-slate-800 border-none rounded p-1 text-xs text-white" placeholder="Titolo"/>
                                                                <textarea value={t.text} onChange={(e) => updateTestimonial(i, 'text', e.target.value)} className="w-full bg-slate-800 border-none rounded p-1 text-xs text-slate-300 h-16" placeholder="Testo recensione"/>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <input type="number" min="1" max="5" value={t.rating || 5} onChange={(e) => updateTestimonial(i, 'rating', e.target.value)} className="w-full bg-slate-800 border-none rounded p-1 text-xs text-white" placeholder="Rating"/>
                                                                    <input type="text" value={t.date || ''} onChange={(e) => updateTestimonial(i, 'date', e.target.value)} className="w-full bg-slate-800 border-none rounded p-1 text-xs text-white" placeholder="Data"/>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1">
                                                                <div 
                                                                    className="w-16 h-16 bg-slate-800 rounded border border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-emerald-500 overflow-hidden relative group"
                                                                    onClick={() => reviewImageInputRef.current?.input?.click()}
                                                                >
                                                                    {t.image ? <img src={t.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-slate-500" />}
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"><Pencil className="w-4 h-4 text-white"/></div>
                                                                    <input 
                                                                        type="file" 
                                                                        ref={el => { if (el) reviewImageInputRef.current = { id: i, input: el } }}
                                                                        className="hidden" 
                                                                        accept="image/*" 
                                                                        onChange={(e) => handleReviewImageUpload(i, e)} 
                                                                    />
                                                                </div>
                                                                <button onClick={() => removeTestimonial(i)} className="p-1.5 bg-red-900/50 hover:bg-red-800 rounded text-red-400"><Trash2 className="w-3 h-3"/></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={handleGenerateMoreReviews} disabled={isGeneratingReviews} className="w-full mt-3 py-2 bg-slate-700/50 text-emerald-400 text-xs font-bold rounded-lg border border-slate-700 hover:bg-slate-700 flex items-center justify-center gap-2">{isGeneratingReviews ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} Genera Altre Recensioni</button>
                                        </div>
                                        {/* 6. Form & Webhook */}
                                        <div className="border-t border-slate-700 pt-4">
                                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">6. Form & Webhook</label>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] text-slate-400 mb-1 block">Webhook URL</label>
                                                    <input 
                                                        type="text" 
                                                        value={generatedContent.webhookUrl || ''} 
                                                        onChange={(e) => updateContentField('webhookUrl', e.target.value)} 
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white font-mono"
                                                        placeholder="https://hook.make.com/..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-400 mb-1 block">Campi del Form</label>
                                                    <div className="space-y-1">
                                                        {(generatedContent.formConfiguration || []).map((field, index) => (
                                                            <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/50 p-1.5 rounded">
                                                                <span className="col-span-4 text-xs text-slate-300 truncate">{field.label}</span>
                                                                <div className="col-span-5">
                                                                    <input 
                                                                        type="text" 
                                                                        value={field.label} 
                                                                        onChange={(e) => updateFormConfig(index, 'label', e.target.value)}
                                                                        className="w-full bg-slate-800 border border-slate-700 rounded p-1 text-[10px] text-white"
                                                                    />
                                                                </div>
                                                                <label className="col-span-2 flex items-center justify-center gap-1 cursor-pointer text-[10px]">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={field.enabled} 
                                                                        onChange={(e) => updateFormConfig(index, 'enabled', e.target.checked)}
                                                                        className="w-3 h-3 accent-emerald-500 rounded"
                                                                    /> 
                                                                    <span className={field.enabled ? 'text-slate-300' : 'text-slate-500'}>On</span>
                                                                </label>
                                                                <label className="col-span-1 flex items-center justify-center gap-1 cursor-pointer text-[10px]">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={field.required}
                                                                        disabled={!field.enabled}
                                                                        onChange={(e) => updateFormConfig(index, 'required', e.target.checked)}
                                                                        className="w-3 h-3 accent-emerald-500 rounded disabled:opacity-50"
                                                                    />
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 7. Stile & Colori */}
                                        <div className="border-t border-slate-700 pt-4">
                                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">7. Stile & Colori</label>
                                            <div className="space-y-4">
                                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                                    <label className="text-xs font-bold text-slate-300 mb-2 block">Tipografia</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="text-[10px] text-slate-400">Font</label>
                                                            <select value={generatedContent.typography?.fontFamily} onChange={(e) => updateTypography('fontFamily', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white">
                                                                <option value="sans">Sans Serif</option>
                                                                <option value="serif">Serif</option>
                                                                <option value="mono">Mono</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-slate-400">Dim. H1</label>
                                                            <select value={generatedContent.typography?.h1Size} onChange={(e) => updateTypography('h1Size', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white">
                                                                <option value="sm">SM</option><option value="md">MD</option><option value="lg">LG</option><option value="xl">XL</option><option value="2xl">2XL</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-slate-400">Dim. Body</label>
                                                            <select value={generatedContent.typography?.bodySize} onChange={(e) => updateTypography('bodySize', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white">
                                                                <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-2 border-t border-slate-800">
                                                         <label className="text-[10px] font-medium text-slate-400 mb-1 block">Dimensione Testo in PX (Opzionale, sovrascrive sopra)</label>
                                                         <div className="grid grid-cols-3 gap-2">
                                                             <input type="text" placeholder="H1" value={generatedContent.customTypography?.h1 || ''} onChange={e => updateCustomTypography('h1', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"/>
                                                             <input type="text" placeholder="H2" value={generatedContent.customTypography?.h2 || ''} onChange={e => updateCustomTypography('h2', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"/>
                                                             <input type="text" placeholder="H3/Feature" value={generatedContent.customTypography?.h3 || ''} onChange={e => updateCustomTypography('h3', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"/>
                                                             <input type="text" placeholder="Body" value={generatedContent.customTypography?.body || ''} onChange={e => updateCustomTypography('body', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"/>
                                                             <input type="text" placeholder="Small" value={generatedContent.customTypography?.small || ''} onChange={e => updateCustomTypography('small', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"/>
                                                             <input type="text" placeholder="CTA" value={generatedContent.customTypography?.cta || ''} onChange={e => updateCustomTypography('cta', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"/>
                                                         </div>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                                    <label className="text-xs font-bold text-slate-300 mb-2 block">Colori</label>
                                                    <div className="space-y-3">
                                                         <div>
                                                            <label className="text-[10px] text-slate-400 mb-1 block">Colore Sfondo Pagina</label>
                                                            <div className="flex items-center gap-2">
                                                                 <input type="color" value={generatedContent.backgroundColor || '#f8fafc'} onChange={(e) => updateContentField('backgroundColor', e.target.value)} className="w-8 h-8 rounded border-none bg-transparent" />
                                                                 <input type="text" value={generatedContent.backgroundColor || ''} onChange={(e) => updateContentField('backgroundColor', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white" placeholder="#f8fafc"/>
                                                            </div>
                                                         </div>
                                                        <div>
                                                            <label className="text-[10px] text-slate-400 mb-1 block">Colore Pulsante CTA</label>
                                                            <div className="grid grid-cols-4 gap-1">
                                                                {BUTTON_GRADIENTS.map(g => (
                                                                    <button key={g.label} onClick={() => updateContentField('buttonColor', g.class)} className={`h-8 rounded text-[9px] font-bold border-2 ${g.class} ${generatedContent.buttonColor === g.class ? 'border-emerald-400' : 'border-transparent'}`}>{g.label}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                             <div>
                                                                <label className="text-[10px] text-slate-400">Colore Prezzo</label>
                                                                <input type="text" value={generatedContent.priceStyles?.color || ''} onChange={e => updatePriceStyles('color', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white" placeholder="es. #ff0000"/>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] text-slate-400">Dimensione Prezzo (px)</label>
                                                                <input type="text" value={generatedContent.priceStyles?.fontSize || ''} onChange={e => updatePriceStyles('fontSize', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white" placeholder="es. 48"/>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* 8. Script & Avanzate */}
                                        <div className="border-t border-slate-700 pt-4">
                                            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide mb-2">8. Script & Avanzate</label>
                                            <div className="space-y-3">
                                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                                     <label className="text-xs font-bold text-slate-300 mb-2 block">Pixel & Script (HTML)</label>
                                                     <div className="grid grid-cols-2 gap-2">
                                                         <div><label className="text-[10px] text-slate-400">Meta - Landing Page</label><textarea value={generatedContent.metaLandingHtml || ''} onChange={(e) => updateContentField('metaLandingHtml', e.target.value)} className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-1 text-[10px] text-white font-mono"/></div>
                                                         <div><label className="text-[10px] text-slate-400">Meta - Thank You Page</label><textarea value={generatedContent.metaThankYouHtml || ''} onChange={(e) => updateContentField('metaThankYouHtml', e.target.value)} className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-1 text-[10px] text-white font-mono"/></div>
                                                         <div><label className="text-[10px] text-slate-400">TikTok - Landing Page</label><textarea value={generatedContent.tiktokLandingHtml || ''} onChange={(e) => updateContentField('tiktokLandingHtml', e.target.value)} className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-1 text-[10px] text-white font-mono"/></div>
                                                         <div><label className="text-[10px] text-slate-400">TikTok - Thank You Page</label><textarea value={generatedContent.tiktokThankYouHtml || ''} onChange={(e) => updateContentField('tiktokThankYouHtml', e.target.value)} className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-1 text-[10px] text-white font-mono"/></div>
                                                     </div>
                                                     <div className="mt-2">
                                                         <label className="text-[10px] text-slate-400">Extra HTML (Body - Landing)</label>
                                                         <textarea value={generatedContent.extraLandingHtml || ''} onChange={(e) => updateContentField('extraLandingHtml', e.target.value)} className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-1 text-[10px] text-white font-mono"/>
                                                     </div>
                                                     <div className="mt-2">
                                                         <label className="text-[10px] text-slate-400">Extra HTML (Body - Thank You)</label>
                                                         <textarea value={generatedContent.extraThankYouHtml || ''} onChange={(e) => updateContentField('extraThankYouHtml', e.target.value)} className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-1 text-[10px] text-white font-mono"/>
                                                     </div>
                                                </div>
                                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                                     <label className="text-xs font-bold text-slate-300 mb-2 block">Thank You Page</label>
                                                     <div><label className="text-[10px] text-slate-400">URL Redirect (Opzionale, sovrascrive pagina di grazie)</label><input type="text" value={generatedContent.customThankYouUrl || ''} onChange={(e) => updateContentField('customThankYouUrl', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white" placeholder="https://..."/></div>
                                                     <div className="grid grid-cols-2 gap-2 mt-2">
                                                        <div><label className="text-[10px] text-slate-400">Titolo (Usa {'{name}'})</label><input type="text" value={generatedContent.customThankYouTitle || ''} onChange={(e) => updateContentField('customThankYouTitle', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"/></div>
                                                        <div><label className="text-[10px] text-slate-400">Messaggio (Usa {'{phone}'})</label><input type="text" value={generatedContent.customThankYouMessage || ''} onChange={(e) => updateContentField('customThankYouMessage', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-1 text-xs text-white"/></div>
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-7 xl:col-span-8">
                        {!generatedContent ? (
                            <div className="animate-in fade-in">
                                <div className="flex items-center justify-between mb-4">
                                     <h2 className="text-xl font-bold text-white flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-emerald-400" /> Pagine Pubblicate</h2>
                                     <span className="text-sm font-bold text-slate-500">{publicPages.length} Pagine</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {isLoadingPages && <div className="col-span-full h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500"/></div>}
                                    {!isLoadingPages && publicPages.map(page => <PageCard key={page.id} page={page} onView={handleViewPage} onEdit={handleEditPage} onDuplicate={handleOpenDuplicate} onDelete={handleDeletePage} />)}
                                </div>
                            </div>
                        ) : (
                            <div className="sticky top-[88px]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700"><button onClick={() => setPreviewDevice('mobile')} className={`px-3 py-1.5 rounded-md transition ${previewDevice === 'mobile' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Smartphone className="w-4 h-4" /></button><button onClick={() => setPreviewDevice('tablet')} className={`px-3 py-1.5 rounded-md transition ${previewDevice === 'tablet' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Tablet className="w-4 h-4" /></button><button onClick={() => setPreviewDevice('desktop')} className={`px-3 py-1.5 rounded-md transition ${previewDevice === 'desktop' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}><Monitor className="w-4 h-4" /></button></div>
                                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700"><button onClick={() => setPreviewMode('landing')} className={`px-3 py-1.5 rounded-md transition text-xs font-bold ${previewMode === 'landing' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Landing</button><button onClick={() => setPreviewMode('thankyou')} className={`px-3 py-1.5 rounded-md transition text-xs font-bold ${previewMode === 'thankyou' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Thank You</button></div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => { setView('preview'); setPreviewMode('landing'); }} className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 font-bold"><Eye className="w-4 h-4"/> Anteprima Reale</button>
                                        <button onClick={handleSaveToDb} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition flex items-center gap-2">{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} {editingPageId ? "Aggiorna" : "Pubblica"}</button>
                                    </div>
                                </div>
                                <div className={`mx-auto rounded-2xl border-8 border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 bg-white ${previewDevice === 'mobile' ? 'w-[375px] h-[667px]' : (previewDevice === 'tablet' ? 'w-[768px] h-[1024px]' : 'w-full h-[calc(100vh-160px)]')}`}>
                                    <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400">
                                        {previewMode === 'landing' ? <LandingPage content={generatedContent} onRedirect={() => setPreviewMode('thankyou')} /> : <ThankYouPage content={generatedContent} initialData={{ name: 'Mario Rossi', phone: '3331234567' }}/>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
      </div>
    );
  }

  // Preview Mode
  if (view === 'preview' && generatedContent) {
      return (
          <div className="relative">
              <div className="fixed top-3 left-3 z-[100]"><button onClick={() => setView('admin')} className="bg-white/80 backdrop-blur-md text-slate-800 px-4 py-2 rounded-full shadow-lg border border-slate-200/50 hover:bg-white hover:shadow-xl transition-all flex items-center gap-2 group" title="Torna all'Editor"><ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" /> <span className="font-bold">Torna all'Editor</span></button></div>
              {previewMode === 'landing' ? <LandingPage content={generatedContent} onRedirect={() => setPreviewMode('thankyou')} /> : <ThankYouPage content={generatedContent} />}
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-3 text-xl font-bold" onClick={handleStealthClick}><Sparkles className="w-6 h-6 text-emerald-500" /> <span>{siteConfig.siteName}</span></div>
             <div className="flex items-center gap-4">
                {session ? (<button onClick={() => setView('admin')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-md font-bold text-sm flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Admin</button>) : (<button onClick={() => setIsLoginOpen(true)} className="text-sm font-semibold text-slate-600 hover:text-slate-900">Login</button>)}
             </div>
          </div>
      </header>
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Le Migliori Offerte, Scelte per Te</h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-600">Esplora le nostre pagine di offerta, create con cura per ogni nicchia.</p>
        </div>
        {isLoadingPages ? (<div className="h-64 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-slate-400"/></div>) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publicPages.map(page => (<PageCard key={page.id} page={page} onView={handleViewPage} />))}
            </div>
        )}
      </main>
      <footer className="bg-white border-t border-slate-200 mt-16">
          <div className="container mx-auto px-6 py-8 text-center text-sm text-slate-500">
            <p>{siteConfig.footerText}</p>
          </div>
      </footer>
      {isLoginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsLoginOpen(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-bold text-center mb-2">{isRegistering ? 'Crea Account' : 'Login Admin'}</h3>
                <p className="text-center text-slate-500 mb-6 text-sm">{isRegistering ? 'Registrati per accedere al pannello' : 'Accedi al pannello di controllo'}</p>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border border-slate-300 rounded-lg"/></div>
                    <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-3 border border-slate-300 rounded-lg"/></div>
                    {authError && <p className="text-red-500 text-xs text-center p-2 bg-red-50 rounded-md">{authError}</p>}
                    {authSuccess && <p className="text-green-600 text-xs text-center p-2 bg-green-50 rounded-md">{authSuccess}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition disabled:opacity-50">{loading ? <Loader2 className="w-5 h-5 mx-auto animate-spin"/> : (isRegistering ? 'Registrati' : 'Accedi')}</button>
                </form>
                <p className="text-center text-xs text-slate-500 mt-4">
                    {isRegistering ? 'Hai già un account? ' : 'Non hai un account? '}
                    <button onClick={() => setIsRegistering(!isRegistering)} className="font-bold text-emerald-600 hover:underline">{isRegistering ? 'Accedi' : 'Registrati'}</button>
                </p>
            </div>
        </div>
      )}
      {/* DUPLICATION MODAL */}
      {duplicationTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDuplicationTarget(null)}></div>
            <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 text-white">
                <h3 className="text-2xl font-bold mb-2">Duplica & Traduci</h3>
                <p className="text-slate-400 mb-6">Crea una copia o traduci la pagina <strong className="text-emerald-400">"{duplicationTarget.product_name}"</strong>.</p>
                <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">Nuovo Nome Prodotto</label><input type="text" value={duplicationName} onChange={(e) => setDuplicationName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"/></div>
                    <div><label className="block text-sm font-bold text-slate-300 mb-1">Lingua di Destinazione</label><select value={duplicationLang} onChange={(e) => setDuplicationLang(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none">{SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => setDuplicationTarget(null)} className="px-6 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition">Annulla</button>
                    <button onClick={handleProcessDuplication} disabled={isDuplicating} className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50 flex items-center gap-2">{isDuplicating ? <><Loader2 className="w-4 h-4 animate-spin"/> Traducendo...</> : 'Procedi'}</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
export default App;