import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, FinanceState, CMSData, ExpenseRequest, Transaction, ContentItem, Notification, Role, GalleryAlbum } from '../types';
import { auth, db } from '../utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

// Hardcoded Super Admins (Fallback & Override)
const SUPER_ADMIN_EMAILS = ["nikila2008@gmail.com", "admin@ncss.com"];

const INITIAL_CMS: CMSData = {
  heroTitle: "NCSS.",
  heroSubtitle: "Pioneering the Future of Science & Innovation",
  heroImages: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1920&auto=format&fit=crop"
  ],
  missionTitle: "Our Mission",
  missionText: "To advance human knowledge through the relentless exploration of the cosmos.",
  visionTitle: "Our Vision",
  visionText: "A society where scientific literacy is universal.",

  // Default Style Settings
  heroRedSaturation: 80,
  globalOverlayColor: '#000000',
  globalOverlayOpacity: 60,

  // Default Content
  mainIntro: "Welcome to NCSS",
  historyText: "Established in ...",
  presidentMessage: "Message from the President...",
  aboutText: "About NCSS...",
  aboutImages: [],
  contactIntro: "Get in touch with us.",
  helpFaqContent: "Frequently Asked Questions...",
  googleMapUrl: "https://www.google.com/maps",

  // Stats Defaults
  stats: {
    membersConfig: 100,
    projectsConfig: 50,
    awardsConfig: 10,
    legacyConfig: 20
  },

  socialLinks: [
    { id: '1', name: 'Facebook', url: '#', icon: 'Facebook' },
    { id: '2', name: 'Instagram', url: '#', icon: 'Instagram' }
  ]
};

const INITIAL_FINANCE: FinanceState = {
  balance: 0,
  totalIncome: 0,
  totalExpenses: 0,
  transactions: [],
  requests: []
};

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  finance: FinanceState;
  cms: CMSData;
  gallery: ContentItem[];
  albums: GalleryAlbum[];
  news: ContentItem[];
  notifications: Notification[];
  access: {
    idUnlocked: boolean;
    transparencyUnlocked: boolean;
    unlockId: () => void;
    unlockTransparency: () => void;
  };
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, pass: string) => void;
  createMemberAdmin: (name: string, email: string) => void;
  deleteUser: (id: string) => void;
  updateUserRole: (id: string, role: Role) => void;
  updateCMS: (data: CMSData) => void;
  addIncome: (amount: number, source: string, desc: string) => void;
  addTransaction: (amount: number, type: 'INCOME' | 'EXPENSE', description: string, date: string) => void;
  deleteTransaction: (id: string) => void;
  requestExpense: (amount: number, project: string, desc: string, deadline: string) => void;
  processRequest: (reqId: string, approved: boolean) => void;
  sendNotification: (msg: string, targetId?: string) => void;
  addContent: (type: 'gallery' | 'news', item: ContentItem) => void;
  deleteContent: (type: 'gallery' | 'news', id: string) => void;
  createAlbum: (name: string) => void;
  deleteAlbum: (id: string) => void;
  addImageToAlbum: (albumId: string, url: string) => void;
  removeImageFromAlbum: (albumId: string, url: string) => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [finance, setFinance] = useState<FinanceState>(INITIAL_FINANCE);
  const [cms, setCms] = useState<CMSData>(INITIAL_CMS);
  const [gallery, setGallery] = useState<ContentItem[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [news, setNews] = useState<ContentItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // --- VOLATILE ACCESS STATE (Resets on Refresh) ---
  const [idUnlocked, setIdUnlocked] = useState(false);
  const [transparencyUnlocked, setTransparencyUnlocked] = useState(false);
  const [memberDashboardUnlocked, setMemberDashboardUnlocked] = useState(false);

  const unlockId = () => setIdUnlocked(true);
  const unlockTransparency = () => setTransparencyUnlocked(true);
  const unlockMemberDashboard = () => setMemberDashboardUnlocked(true);

  // --- FIREBASE AUTH SYNC ---
  useEffect(() => {
    let userDocUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, (user) => {
      // Cleanup previous listener if user switches or logs out
      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      if (user) {
        // Set up Real-Time Listener for User Data
        userDocUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          let role: Role = 'USER';
          let name = user.displayName || 'User';
          let isApproved = false;
          let photoURL = user.photoURL || undefined;

          if (docSnap.exists()) {
            const data = docSnap.data();
            role = (data.role as Role) || 'USER';
            name = (data.displayName || data.name) || name;
            isApproved = data.isApproved === true;
            photoURL = data.photoURL || photoURL;
          }

          // FORCE SUPER ADMIN for specific emails (Safety Net)
          if (user.email && SUPER_ADMIN_EMAILS.includes(user.email)) {
            role = 'SUPER_ADMIN';
            isApproved = true; // Auto-approve super admins
          } else if (['SUPER_ADMIN', 'super_admin'].includes(role)) {
            // If DB says they are admin/super_admin, they are approved by default
            isApproved = true;
          }

          setCurrentUser({
            id: user.uid,
            name,
            email: user.email || '',
            role,
            isApproved,
            photoURL,
            password: ''
          });
        }, (error) => {
          console.error("Error listening to user doc:", error);
        });

      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authUnsub();
      if (userDocUnsub) userDocUnsub();
    };
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    const storedUsers = localStorage.getItem('ncss_users');
    const storedFinance = localStorage.getItem('ncss_finance');
    const storedCms = localStorage.getItem('ncss_cms');
    const storedGallery = localStorage.getItem('ncss_gallery');
    const storedAlbums = localStorage.getItem('ncss_albums');
    const storedNews = localStorage.getItem('ncss_news');
    const storedNotifs = localStorage.getItem('ncss_notifs');

    if (storedUsers) setUsers(JSON.parse(storedUsers));
    if (storedFinance) setFinance(JSON.parse(storedFinance));
    if (storedCms) setCms(JSON.parse(storedCms));
    if (storedGallery) setGallery(JSON.parse(storedGallery));
    if (storedAlbums) setAlbums(JSON.parse(storedAlbums));
    if (storedNews) setNews(JSON.parse(storedNews));
    if (storedNotifs) setNotifications(JSON.parse(storedNotifs));
  }, []);

  useEffect(() => {
    localStorage.setItem('ncss_users', JSON.stringify(users));
    localStorage.setItem('ncss_finance', JSON.stringify(finance));
    localStorage.setItem('ncss_cms', JSON.stringify(cms));
    localStorage.setItem('ncss_gallery', JSON.stringify(gallery));
    localStorage.setItem('ncss_albums', JSON.stringify(albums));
    localStorage.setItem('ncss_news', JSON.stringify(news));
    localStorage.setItem('ncss_notifs', JSON.stringify(notifications));
  }, [users, finance, cms, gallery, albums, news, notifications]);

  // --- ACTIONS ---
  const logout = async () => {
    await signOut(auth);
    // State clear handled by onAuthStateChanged
  };

  // Deprecated/Mock - kept for signature compatibility
  const login = (email: string, pass: string): boolean => true;
  const register = (name: string, email: string, pass: string) => { };
  const createMemberAdmin = (name: string, email: string) => { };
  const deleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));
  const updateUserRole = (id: string, role: Role) => setUsers(users.map(u => u.id === id ? { ...u, role } : u));
  const updateCMS = (data: CMSData) => setCms(data);
  const addIncome = (amount: number, source: string, desc: string) => { };
  const addTransaction = (amount: number, type: 'INCOME' | 'EXPENSE', description: string, date: string) => { };
  const deleteTransaction = (id: string) => { };
  const requestExpense = (amount: number, project: string, desc: string, deadline: string) => { };
  const processRequest = (reqId: string, approved: boolean) => { };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await import('firebase/firestore').then(({ setDoc }) => setDoc(userRef, data, { merge: true }));

      // Update local state
      const updatedUser = { ...currentUser, ...data };
      setCurrentUser(updatedUser);

      // Update users list if admin
      setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const sendNotification = (msg: string, targetId?: string) => {
    const notif: Notification = {
      id: Date.now().toString(),
      message: msg,
      date: new Date().toISOString(),
      read: false,
      targetUserId: targetId
    };
    setNotifications([notif, ...notifications]);
  };

  const addContent = (type: 'gallery' | 'news', item: ContentItem) => {
    if (type === 'gallery') setGallery([...gallery, item]);
    else setNews([item, ...news]);
  };

  const deleteContent = (type: 'gallery' | 'news', id: string) => {
    if (type === 'gallery') setGallery(gallery.filter(i => i.id !== id));
    else setNews(news.filter(i => i.id !== id));
  };

  const createAlbum = (name: string) => {
    const newAlbum: GalleryAlbum = {
      id: Date.now().toString(),
      name,
      images: [],
      createdAt: new Date().toISOString()
    };
    setAlbums([newAlbum, ...albums]);
  };

  const deleteAlbum = (id: string) => {
    setAlbums(albums.filter(a => a.id !== id));
  };

  const addImageToAlbum = (albumId: string, url: string) => {
    setAlbums(albums.map(a => {
      if (a.id === albumId) {
        return { ...a, images: [...a.images, url] };
      }
      return a;
    }));
  };

  const removeImageFromAlbum = (albumId: string, url: string) => {
    setAlbums(albums.map(a => {
      if (a.id === albumId) {
        return { ...a, images: a.images.filter(img => img !== url) };
      }
      return a;
    }));
  };

  return (
    <StoreContext.Provider value={{
      currentUser, users, finance, cms, gallery, albums, news, notifications,
      access: { idUnlocked, transparencyUnlocked, unlockId, unlockTransparency },
      login, logout, register, createMemberAdmin, deleteUser, updateUserRole, updateCMS,
      addIncome, addTransaction, deleteTransaction, requestExpense, processRequest, sendNotification, addContent, deleteContent,
      createAlbum, deleteAlbum, addImageToAlbum, removeImageFromAlbum, updateUserProfile
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};