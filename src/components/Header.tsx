import React, { useState } from 'react';
import { Phone, Mail, MapPin, ChevronDown, User, LogOut, Menu, X, ArrowRight } from 'lucide-react';
import { Page, UserState } from '../types';

interface HeaderProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  user: UserState;
  onLogout: () => void;
}

export default function Header({ currentPage, onPageChange, user, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navItems = [
    { name: 'Home', view: 'Home' as Page },
    { name: 'About Us', view: 'About' as Page },
    { name: 'FAQs', view: 'FAQs' as Page },
    { name: 'News', view: 'News' as Page },
    { name: 'Contact Us', view: 'Home' as Page, elementId: 'contact-section' }, // anchor scroll to contact
  ];

  const handleNavClick = (view: Page, elementId?: string) => {
    onPageChange(view);
    setMobileMenuOpen(false);
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <header className="w-full relative z-50">
      {/* Top Bar Contacts */}
      <div className="bg-[#071625] text-white text-[11px] md:text-xs py-2 px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-2">
          {/* Left Contacts */}
          <div className="flex items-center gap-4 text-gray-300">
            <a href="tel:+2455921125" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone size={12} className="text-[#00c2b2]" />
              <span>(+245) 592 1125</span>
            </a>
            <a href="mailto:support@Chibuike.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail size={12} className="text-[#00c2b2]" />
              <span>support@Chibuike.com</span>
            </a>
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-[#00c2b2]" />
              <span>2767 Sunrise Street, NY 1002, USA</span>
            </span>
          </div>

          {/* Right Links & Languages */}
          <div className="flex items-center gap-4 text-gray-300">
            <button className="hover:text-white transition-colors">Support</button>
            <span className="text-gray-700">|</span>
            <button className="hover:text-white transition-colors">Help</button>
            <span className="text-gray-700">|</span>
            
            {/* Language dropdown */}
            <div className="relative">
              <button 
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 hover:text-white transition-colors text-[11px] uppercase tracking-wider font-semibold"
              >
                <span className="w-4 h-3 bg-blue-600 inline-block align-middle mr-1 relative rounded-[1px] overflow-hidden">
                  <span className="absolute top-0 left-0 w-2 h-1.5 bg-red-600"></span>
                  <span className="absolute top-0 right-0 w-2 h-1.5 bg-white"></span>
                </span>
                English
                <ChevronDown size={11} />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 mt-1 bg-[#071625] border border-gray-800 rounded-md py-1 w-28 text-xs shadow-lg z-50">
                  <button onClick={() => setLangDropdownOpen(false)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-800 hover:text-white">English</button>
                  <button onClick={() => setLangDropdownOpen(false)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-800 hover:text-white">Español</button>
                  <button onClick={() => setLangDropdownOpen(false)} className="block w-full text-left px-3 py-1.5 hover:bg-gray-800 hover:text-white">Français</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <nav id="navbar" className="bg-white border-b border-gray-100 py-4.5 px-4 md:px-6 shadow-sm sticky top-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <button 
            onClick={() => handleNavClick('Home')}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            {/* Elegant Chibuike logo style */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00c2b2] to-[#041a31] flex items-center justify-center p-0.5 relative shadow-premium group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center relative">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#00c2b2] to-[#018073] flex items-center justify-center">
                  <span className="text-white text-xs font-bold font-mono">C</span>
                </div>
                {/* Visual orbital layout nodes match screenshot */}
                <div className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-[#00c2b2]"></div>
                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 rounded-full bg-[#041a31]"></div>
              </div>
            </div>
            <div>
              <span className="text-xl md:text-2xl font-black tracking-tight text-[#071625] font-display flex items-center gap-0.5">
                Chib<span className="text-[#00c2b2]">uike</span><span className="text-xs text-slate-400 font-normal">.com</span>
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = currentPage === item.view && !item.elementId;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.view, item.elementId)}
                  className={`text-sm font-semibold tracking-wide transition-colors relative py-1.5 cursor-pointer hover:text-[#00c2b2] ${
                    isActive ? 'text-[#00c2b2]' : 'text-[#334155]'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00c2b2]"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user.isLoggedIn ? (
              <div className="flex items-center gap-1.5">

                <button 
                  onClick={() => onPageChange('Dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-100 uppercase tracking-wider transition-all"
                >
                  <User size={14} className="text-[#00c2b2]" />
                  <span>{user.username} (Dashboard)</span>
                </button>
                <button 
                  onClick={onLogout}
                  className="p-2 border border-slate-200 rounded-md hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onPageChange('Register')}
                className="flex items-center gap-1.5 px-4 py-2 hover:text-[#00c2b2] text-sm font-semibold text-[#334155] transition-colors"
              >
                <User size={15} className="text-[#00c2b2]" />
                <span>Register / Login</span>
              </button>
            )}

            <button 
              onClick={() => {
                if (user.isLoggedIn) {
                  onPageChange('Dashboard');
                } else {
                  onPageChange('Register');
                }
              }}
              className="flex items-center gap-1.5 bg-[#00c2b2] hover:bg-[#00a093] active:scale-[0.98] text-white px-5 py-2.5 rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-premium"
            >
              <span>{user.isLoggedIn ? 'Go to Account' : 'GET STARTED'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
