import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, MapPin, Mail, Phone, ArrowUp } from 'lucide-react';
import { Page } from '../types';

interface FooterProps {
  onPageChange: (page: Page) => void;
}

export default function Footer({ onPageChange }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLinkClick = (page: Page) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <footer className="bg-[#050e18] text-gray-300 font-sans pt-16 pb-8 relative border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1.5 flex flex-col gap-6">
            <button 
              onClick={() => handleLinkClick('Home')}
              className="flex items-center gap-2 text-left cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00c2b2] to-[#041a31] flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center relative">
                  <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-[#00c2b2] to-[#018073] flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold font-mono">C</span>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#00c2b2]"></div>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">
                Chib<span className="text-[#00c2b2]">uike</span><span className="text-xs text-gray-500 font-normal">.com</span>
              </span>
            </button>
            <p className="text-sm text-gray-400 leading-relaxed font-normal">
              Lorem ipsum dolor sit amet consctetur adicing elit. Dolor emque dicta molest enim beatae ame consequatur tempo pretium auctor nam.
            </p>
            {/* Social Icons matching circles exactly */}
            <div className="flex gap-3 mt-2">
              {[
                { icon: <Facebook size={16} />, link: "https://facebook.com" },
                { icon: <Twitter size={16} />, link: "https://twitter.com" },
                { icon: <Instagram size={16} />, link: "https://instagram.com" },
                { icon: <Linkedin size={16} />, link: "https://linkedin.com" }
              ].map((soc, i) => (
                <a 
                  key={i} 
                  href={soc.link} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-800 bg-[#071524] text-gray-400 hover:bg-[#00c2b2] hover:text-[#050e18] hover:border-[#00c2b2] hover:scale-105 transition-all duration-300"
                >
                  {soc.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company Column */}
          <div className="flex flex-col gap-5">
            <h4 className="text-white font-bold text-lg leading-6 font-display border-b border-[#00c2b2]/20 pb-2 inline-block">Company</h4>
            <div className="flex flex-col gap-3 font-medium text-sm text-gray-400">
              <button onClick={() => handleLinkClick('About')} className="text-left hover:text-[#00c2b2] transition-colors">About Us</button>
              <button onClick={() => handleLinkClick('News')} className="text-left hover:text-[#00c2b2] transition-colors">News & Blog</button>
            </div>
          </div>

          {/* Resources Column */}
          <div className="flex flex-col gap-5">
            <h4 className="text-white font-bold text-lg leading-6 font-display border-b border-[#00c2b2]/20 pb-2 inline-block">Resources</h4>
            <div className="flex flex-col gap-3 font-medium text-sm text-gray-400">
              <button onClick={() => {
                handleLinkClick('Home');
                setTimeout(() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }} className="text-left hover:text-[#00c2b2] transition-colors">Contact Us</button>
              <button onClick={() => handleLinkClick('FAQs')} className="text-left hover:text-[#00c2b2] transition-colors">FAQ's</button>
              <button onClick={() => handleLinkClick('Home')} className="text-left hover:text-[#00c2b2] transition-colors">Download App</button>
              <button onClick={() => handleLinkClick('Home')} className="text-left hover:text-[#00c2b2] transition-colors">Privacy Policy</button>
              <button onClick={() => handleLinkClick('Home')} className="text-left hover:text-[#00c2b2] transition-colors">Terms & Conditions</button>
            </div>
          </div>

          {/* Transfer Money Column */}
          <div className="flex flex-col gap-5">
            <h4 className="text-white font-bold text-lg leading-6 font-display border-b border-[#00c2b2]/20 pb-2 inline-block">Transfer Money</h4>
            <div className="flex flex-col gap-3 font-medium text-sm text-gray-400">
              <button onClick={() => handleLinkClick('Register')} className="text-left hover:text-[#00c2b2] transition-colors">Login</button>
              <button onClick={() => handleLinkClick('Register')} className="text-left hover:text-[#00c2b2] transition-colors">Register</button>
              <button onClick={() => handleLinkClick('Dashboard')} className="text-left hover:text-[#00c2b2] transition-colors">USA Money Transfer</button>
              <button onClick={() => handleLinkClick('Dashboard')} className="text-left hover:text-[#00c2b2] transition-colors">USA Money Transfer</button>
              <button onClick={() => handleLinkClick('Dashboard')} className="text-left hover:text-[#00c2b2] transition-colors">Euro Money Transfer</button>
            </div>
          </div>

          {/* Contact Us Column */}
          <div className="flex flex-col gap-5">
            <h4 className="text-white font-bold text-lg leading-6 font-display border-b border-[#00c2b2]/20 pb-2 inline-block">Contact Us</h4>
            <div className="flex flex-col gap-4 text-sm text-gray-400">
              {/* Location */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#071626] border border-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={13} className="text-[#00c2b2]" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Location</div>
                  <div className="text-gray-300">2767 Sunrise Street, NY 1002, USA</div>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#071626] border border-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={13} className="text-[#00c2b2]" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Email</div>
                  <a href="mailto:support@Chibuike.com" className="text-gray-300 hover:text-[#00c2b2] transition-colors">support@Chibuike.com</a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#071626] border border-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone size={13} className="text-[#00c2b2]" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phone</div>
                  <a href="tel:+13454567877" className="text-gray-300 hover:text-[#00c2b2] transition-colors">+1-3454-5678-77</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sub-footer line exactly */}
        <div className="border-t border-gray-950 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] text-gray-500">
          <div>
            © Chibuike.com. All Rights Reserved By{' '}
            <button onClick={() => handleLinkClick('Home')} className="text-[#00c2b2] hover:underline cursor-pointer">
              Chibuike.com
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => handleLinkClick('About')} className="hover:text-gray-400 transition-colors">About</button>
            <button onClick={() => handleLinkClick('FAQs')} className="hover:text-gray-400 transition-colors">FAQs</button>
            <button onClick={scrollToTop} className="hover:text-gray-400 transition-colors">Terms of Services</button>
          </div>
        </div>
      </div>

      {/* Persistent floating Arrow back-to-top button in footer layout right corner */}
      <button 
        onClick={scrollToTop}
        className="absolute bottom-8 right-6 w-11 h-11 bg-[#00c2b2] hover:bg-[#00a093] active:scale-95 text-[#050e18] rounded-full flex items-center justify-center shadow-premium transition-all duration-300 cursor-pointer"
        title="Scroll to Top"
      >
        <ArrowUp size={18} className="stroke-[2.5]" />
      </button>
    </footer>
  );
}
