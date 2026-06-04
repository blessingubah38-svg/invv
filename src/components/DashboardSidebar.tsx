import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowUpRight, 
  ListOrdered, 
  History, 
  TrendingUp, 
  Users, 
  ArrowDownLeft, 
  FileSpreadsheet, 
  Link as LinkIcon, 
  Share2, 
  ShieldCheck, 
  UserCog, 
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  username: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({ 
  activeSection, 
  onSectionChange, 
  onLogout, 
  username, 
  isOpen = false, 
  onClose
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'make-deposit', label: 'Make Deposit', icon: <Wallet size={16} /> },
    { id: 'deposit-to-account', label: 'Deposit To Account', icon: <ArrowUpRight size={16} /> },
    { id: 'deposit-list', label: 'Deposit List', icon: <ListOrdered size={16} /> },
    { id: 'deposit-history', label: 'Deposit History', icon: <History size={16} /> },
    { id: 'earnings-history', label: 'Earnings History', icon: <TrendingUp size={16} /> },
    { id: 'referrals-history', label: 'Referrals History', icon: <Users size={16} /> },
    { id: 'withdraw', label: 'Withdraw', icon: <ArrowDownLeft size={16} /> },
    { id: 'withdrawals-history', label: 'Withdrawals History', icon: <FileSpreadsheet size={16} /> },
    { id: 'referrals', label: 'Referrals', icon: <Users size={16} /> },
    { id: 'ref-links', label: 'Ref Links', icon: <LinkIcon size={16} /> },
    { id: 'tell-a-friend', label: 'Tell A Friend', icon: <Share2 size={16} /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck size={16} /> },
    { id: 'edit-profile', label: 'Edit Profile', icon: <UserCog size={16} /> },
  ];

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden cursor-pointer"
        />
      )}

      <aside className={`w-64 bg-[#0a1626] border-r border-[#10253f] flex flex-col h-full text-slate-300 fixed md:relative inset-y-0 left-0 z-50 md:z-auto transition-transform duration-300 shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      {/* Brand logo block in matching style to screenshots */}
      <div className="p-6 border-b border-[#10253f] bg-[#07101c] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00c2b2] to-[#041a31] flex items-center justify-center p-0.5 shrink-0">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center relative">
            <div className="w-5 h-5 rounded-full bg-[#00c2b2] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold font-mono">C</span>
            </div>
          </div>
        </div>
        <div className="overflow-hidden">
          <span className="text-lg font-black text-white tracking-tight font-display flex items-baseline gap-0.5">
            Chib<span className="text-[#00c2b2]">uike</span><span className="text-[10px] text-slate-500 font-normal">.com</span>
          </span>
          <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">SECURE PORTAL</div>
        </div>
      </div>

      {/* User Info Segment */}
      <div className="p-4 bg-[#091423] border-b border-[#122845] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#00c2b2]/10 border border-[#00c2b2]/25 flex items-center justify-center text-[#00c2b2] font-black text-sm">
          {username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">WELCOME BACK</div>
          <div className="text-sm font-bold text-white leading-tight font-display">{username}</div>
        </div>
      </div>

      {/* Nav links scrollable segment */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-[#9333ea] text-white shadow-lg shadow-purple-900/10 scale-[1.01]' // Distinct purple highlight from screenshot 5
                  : 'text-slate-400 hover:text-white hover:bg-[#0c1a2d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-[#00c2b2]'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              
              {isActive && <ChevronRight size={14} className="opacity-85" />}
            </button>
          )
        })}
      </nav>

      {/* Logout button at footer of sidebar */}
      <div className="p-4 border-t border-[#10253f] bg-[#07101c] flex flex-col gap-2">

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-white hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          <span>Exit Wallet</span>
        </button>
      </div>
    </aside>
    </>
  );
}
