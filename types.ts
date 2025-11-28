

export interface UserSession {
  id: string;
  email: string;
}

export enum PageTone {
  PROFESSIONAL = 'Professional',
  URGENT = 'Urgent/Hype',
  FRIENDLY = 'Friendly/Personal',
  LUXURY = 'Luxury'
}

export type TemplateId = 'classic' | 'modern-split' | 'luxury' | 'advertorial' | 'high-impact' | 'gadget-cod' | 'shopify-clean' | 'premium-brand' | 'mobile-optimized';

export interface SiteConfig {
  siteName: string;
  footerText: string;
}

export interface ProductDetails {
  name: string;
  niche: string;
  description: string;
  targetAudience: string;
  tone: PageTone;
  language: string; // Selected language for generation
  image?: string; // Legacy support for single image
  images?: string[]; // Array of images
  featureCount?: number; // Number of paragraphs/features to generate
}

export interface FormFieldConfig {
  id: 'name' | 'phone' | 'email' | 'address' | 'notes' | 'city' | 'cap';
  label: string;
  enabled: boolean;
  required: boolean;
  type: 'text' | 'tel' | 'email' | 'textarea';
}

export interface Testimonial {
  name: string;
  title?: string; // Specific title for the review
  text: string;
  role: string;
  rating?: number;
  date?: string; // Date of the review
  image?: string; // NEW: Image for the review
}

export interface TypographyConfig {
  fontFamily: 'sans' | 'serif' | 'mono';
  h1Size: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; 
  h2Size: 'sm' | 'md' | 'lg' | 'xl';
  bodySize: 'sm' | 'md' | 'lg';
}

export interface UiTranslation {
    reviews: string;
    offer: string;
    onlyLeft: string; // "Only {x} left" -> "Solo {x} rimasti"
    secure: string;
    returns: string;
    original: string;
    express: string;
    warranty: string;
    checkoutHeader: string;
    paymentMethod: string;
    cod: string; // Cash on Delivery
    card: string; // Credit Card label
    shippingInfo: string;
    completeOrder: string;
    orderReceived: string;
    orderReceivedMsg: string;
    techDesign: string;
    discountLabel: string; // "o" for offer or "sconto"
    certified: string; // For reviews
    currencyPos: 'before' | 'after';
    legalDisclaimer: string; // The full legal text translated
    privacyPolicy: string;
    termsConditions: string;
    cookiePolicy: string;
    rightsReserved: string;
    generatedPageNote: string;
    // Card Error Flow
    cardErrorTitle: string;
    cardErrorMsg: string;
    switchToCod: string;
    mostPopular: string; // Badge "Most chosen"
    giveUpOffer: string;
    confirmCod: string; // Button "Confirm Cash on Delivery"
    // Thank You Page Personalization
    thankYouTitle: string; // "Grazie {name}!"
    thankYouMsg: string; // "Ti chiameremo al {phone} per confermare."
    backToShop: string;
    // Social Proof Badge
    socialProof: string; // "e altre {x} persone hanno acquistato"
    shippingInsurance: string; // NEW
}

export interface GeneratedContent {
  templateId?: TemplateId; 
  language?: string; 
  currency?: string; // Currency symbol (e.g. €, LEI, kr)
  headline: string;
  subheadline: string;
  heroImagePrompt: string; 
  heroImageBase64?: string; 
  generatedImages?: string[]; 
  
  announcementBarText?: string; 

  stockConfig?: {
    enabled: boolean;
    quantity: number;
    textOverride?: string; // Custom scarcity text i.e. "Only {x} left"
  };
  
  socialProofConfig?: {
      enabled: boolean;
      intervalSeconds: number;
      maxShows: number;
  };

  showFeatureIcons?: boolean;
  showSocialProofBadge?: boolean; // NEW: Toggle for the "Michelle and 758 others" badge

  benefits: string[];
  features: Array<{ title: string; description: string; image?: string; showCta?: boolean }>; 
  reviewsPosition?: number; // Index to insert reviews after (undefined = bottom)

  testimonial?: Testimonial; 
  testimonials?: Testimonial[];

  // NEW: Box Content (Cosa ricevi)
  boxContent?: {
      enabled: boolean;
      title: string; // "Ordinando oggi ricevi:"
      items: string[];
      image?: string; // Optional custom image for the box
  };

  ctaText: string;
  ctaSubtext: string;
  colorScheme: 'blue' | 'green' | 'red' | 'purple' | 'dark' | 'gold';
  buttonColor?: string; // Custom CSS classes for button gradient/color
  backgroundColor?: string; // NEW: Custom background color for the page body
  niche: string;
  
  // Pricing & Offer
  price?: string;
  originalPrice?: string;
  showDiscount?: boolean;
  shippingCost?: string; // NEW: Costo spedizione
  enableShippingCost?: boolean; // NEW: Toggle visibilità spedizione

  // NEW: Shipping Insurance
  insuranceConfig?: {
    enabled: boolean;
    label: string;
    cost: string;
    defaultChecked: boolean;
  };
  
  // Advanced Customization (PX)
  priceStyles?: {
      color?: string; // Hex color override for price
      fontSize?: string; // PX size for price
  };
  customTypography?: {
      h1?: string; // PX size
      h2?: string; // PX size
      h3?: string; // PX size for Feature Titles
      body?: string; // PX size
      small?: string; // PX size for disclaimers/captions
      cta?: string; // PX size for Buttons
  };
  
  // Form Configuration
  webhookUrl?: string;

  // Custom HTML Injection (Explicit Separation)
  metaLandingHtml?: string;     // HTML for Meta on Landing Page
  tiktokLandingHtml?: string;   // HTML for TikTok on Landing Page
  metaThankYouHtml?: string;    // HTML for Meta on Thank You Page
  tiktokThankYouHtml?: string;  // HTML for TikTok on Thank You Page
  
  // Legacy/Generic (kept for backward compatibility or extra scripts)
  customHeadHtml?: string; 
  customThankYouHtml?: string; 
  customThankYouUrl?: string; // NEW: Full URL redirect override
  
  // NEW: Generic Extra HTML (for body/visual injection)
  extraLandingHtml?: string;
  extraThankYouHtml?: string;

  formConfiguration?: FormFieldConfig[];

  // Typography Customization
  typography?: TypographyConfig;

  // Full UI Translation Data
  uiTranslation?: UiTranslation;

  // Thank You Page Specifics
  thankYouConfig?: {
    enabled: boolean;
    slugSuffix?: string; // e.g. "-grazie"
  };

  customFooterCopyrightText?: string; // NEW: Custom footer text
}

export interface LandingPageRow {
  id: string;
  created_at: string;
  product_name: string;
  slug?: string; // NEW: Custom URL slug
  thank_you_slug?: string; // NEW: Thank you page slug
  niche: string;
  content: GeneratedContent;
  thank_you_content?: GeneratedContent; // NEW: Independent content for thank you page
  is_published: boolean;
  // New columns for scripts
  custom_head_html?: string;
  custom_thankyou_html?: string;
}