export enum RoutePath {
  HOME = '/',
  GALLERY = '/gallery',
  NEWS = '/news',
  LOGIN = '/login',
  DASHBOARD = '/dashboard',
  TRANSPARENCY = '/transparency',
  SIGNUP = '/signup',
  BILLS = '/admin/bills',
  FUNDS = '/funds',
  USERS = '/users',
  REQUESTS = '/admin/requests',
  SITE_EDITOR = '/admin/site-editor',
  GALLERY_ADMIN = '/admin/gallery',
  MONTHLY_REPORT = '/admin/monthly-report',
  GENERATE_ID = '/admin/generate-id',
  ALL_IDS = '/admin/all-ids',
  VERIFY_ID = '/verify-id/:uid',
  NEWS_ADMIN = '/admin/news',
  CHAT = '/admin/chat'
}

export type Role = 'SUPER_ADMIN' | 'MEMBER_ADMIN' | 'USER' | 'super_admin' | 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string; // In a real app, this is hashed. 
  isApproved?: boolean; // Member Approval Status
  accessCode?: string; // Unique code for ID generation
  transparencyCode?: string; // Unique code for Transparency access
  memberAccessCode?: string; // Code for Member Dashboard access
  photoURL?: string;
  phoneNumber?: string;
  grade?: string;
  indexNumber?: string;
  position?: string;
  // Gamification & Security
  points?: number;
  pointsHistory?: PointHistoryItem[];
  isIdUnlocked?: boolean;
}

export interface FirestoreUser extends User {
  createdAt?: any;
  displayName?: string;
}

export interface PointHistoryItem {
  date: string;
  score: number;
  reason: string;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  title: string;
  description: string;
  timestamp: any; // Firestore Timestamp
  status: 'unread' | 'read';
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl?: string;
  location?: string;
}

export interface FinanceState {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  transactions: Transaction[];
  requests: ExpenseRequest[];
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  date: string;
  source?: string;
}

export interface ExpenseRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  projectName: string;
  description: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  date: string;
  proofUrl?: string; // Image/Bill URL
  deadline?: string;
}

export interface CMSData {
  // Global Theme
  heroTitle: string;
  heroSubtitle: string;
  heroImages: string[];
  heroRedSaturation: number; // 0-100
  globalOverlayColor: string; // Hex/RGB
  globalOverlayOpacity: number; // 0-100
  heroButtonText?: string;
  heroButtonLink?: string;
  heroOverlayColor?: string; // Specific Hero Overlay
  heroBackgroundImageUrl?: string; // New: Dynamic Hero Background Image URL


  // New Dynamic Settings
  navbarLogoUrl?: string;
  globalHeadingColor?: string;
  globalBodyTextColor?: string;
  accentTextColor?: string;

  // Granular Home Page Colors (Overrides)
  heroTitleColor?: string;
  heroButtonColor?: string;
  accentColor?: string; // Global Red Replacement
  backgroundColor?: string; // Optional Overlay/Bg

  // Text Content
  aboutTitle?: string;
  aboutDescription?: string;
  footerText?: string;

  // About Content
  missionTitle?: string;
  missionText: string;
  visionTitle?: string;
  visionText: string;

  // Revised About Content
  mainIntro: string; // "Who We Are"
  historyText: string; // "Our History / Legacy"
  presidentMessage: string; // Optional

  aboutText: string; // Kept for backward compatibility
  aboutImages: string[]; // Mini Carousel
  teamMembers?: TeamMember[]; // New Team Section

  // Contact & Help
  contactIntro: string; // Rich Text
  helpFaqContent: string; // Rich Text / JSON text (Deprecated, use faqList)
  googleMapUrl: string; // URL string only
  helpTitle?: string;
  helpSubtitle?: string;
  faqList?: FAQItem[];

  // New Contact Details
  phoneNumber1?: string;
  phoneNumber2?: string;
  officialEmail?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  openingHours?: string;

  // Home Stats
  stats: {
    membersConfig: number;
    projectsConfig: number;
    awardsConfig: number;
    legacyConfig: number;
  };

  // Social
  socialLinks: {
    id: string;
    name: string;
    url: string;
    icon?: string; // Legacy: Lucide icon name
    iconUrl?: string; // New: Custom Image URL
  }[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  messageBody: string;
  timestamp: any; // Firestore Timestamp
  readStatus: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category?: string;
  pdfUrl?: string;
  downloadLinks?: LinkItem[];
  date: string;
}

export interface GalleryAlbum {
  id: string;
  name: string;
  images: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  targetUserId?: string; // If null, global
}

export interface IDCard {
  id?: string;
  uid: string;
  fullName: string;
  memberId: string;
  position: string;
  profileImage: string;
  phone: string;
  email: string;
  generatedAt: string;
  motto?: string;
  batch?: string;
  issuedDate?: string;
  expiryDate?: string;
  secretaryName?: string;
}

export interface GalleryFolder {
  id: string;
  name: string;
  createdAt: number;
  coverImage?: string; // Optional URL for thumbnail
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  category: 'carousel' | 'standard'; // 'carousel' for hero, 'standard' for folders
  parentFolderId?: string; // Link to GalleryFolder
  createdAt: number;
}