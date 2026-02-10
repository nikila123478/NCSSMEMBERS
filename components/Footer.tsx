import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Globe, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { db } from '../utils/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FooterData {
  aboutText: string;
  socialLinks: { id: string; name: string; url: string }[];
}

const Footer: React.FC = () => {
  const [footerData, setFooterData] = useState<FooterData>({
    aboutText: "Advancing humanity through the exploration of the cosmos.",
    socialLinks: []
  });

  // Contact Form State
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const docRef = doc(db, 'site_config', 'footer_data');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFooterData(docSnap.data() as FooterData);
        }
      } catch (error) {
        console.error("Error fetching footer data:", error);
      }
    };
    fetchFooterData();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: "New Contact Message",
        message: `From: ${email} - ${message}`,
        type: "message",
        date: serverTimestamp(),
        read: false
      });
      alert("Message sent to Admin!");
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <footer className="w-full bg-black text-white border-t border-white/10 pt-16 pb-8 relative z-40 font-outfit">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Brand */}
        <div>
          <h2 className="text-3xl font-black mb-4">NCSS<span className="text-red-600">.</span></h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            {footerData.aboutText}
          </p>
          <div className="flex gap-3 flex-wrap">
            {footerData.socialLinks.map(link => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-500 transition-all flex items-center gap-2 text-xs font-bold text-gray-400"
              >
                <LinkIcon className="w-3 h-3" />
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-lg font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li><a href="#" className="hover:text-red-600">Our Mission</a></li>
            <li><a href="#" className="hover:text-red-600">Financial Transparency</a></li>
            <li><a href="#" className="hover:text-red-600">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-red-600">Terms of Service</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col items-start gap-4 text-sm text-gray-400">
          <h3 className="text-lg font-bold text-white">Contact</h3>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>1024 Stellar Way, Science City</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-red-600" />
            <span>contact@ncss.org</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-red-600" />
            <span>+1 (800) SCIENCE</span>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h3 className="text-lg font-bold mb-4">Message Us</h3>
          <form className="space-y-3" onSubmit={handleSendMessage}>
            <input
              type="email"
              placeholder="Your Email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600"
            />
            <textarea
              placeholder="Message"
              rows={2}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-600"
            ></textarea>
            <button
              type="submit"
              disabled={sending}
              className={`w-full py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all flex justify-center items-center gap-2 ${sending ? 'opacity-50' : ''}`}
            >
              {sending ? 'Sending...' : 'Send'} <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-600 text-xs font-medium uppercase tracking-wider">
        &copy; {new Date().getFullYear()} NCSS. Designed for Excellence.
      </div>
    </footer>
  );
};

export default Footer;