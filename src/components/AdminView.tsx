import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Wallet, 
  ArrowLeft, 
  Search, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2, 
  Edit, 
  Activity, 
  TrendingUp, 
  Percent, 
  Info,
  Gift,
  Coins,
  Globe,
  BellRing,
  Lock,
  Mail,
  Menu,
  X
} from 'lucide-react';
import { UserState, Transaction, InvestmentPlan, Page } from '../types';
import { 
  subscribeToAllUsers, 
  subscribeToAllTransactions, 
  saveUserProfile, 
  updateTransactionStatus, 
  updateWithdrawalStatus,
  addTransactionRecord,
  addInvestmentPlan,
  deleteInvestmentPlan,
  getInvestmentPlans,
  saveSystemSettings,
  getSystemSettings,
  isFirebaseReady,
  getDefaultUserMetrics,
  fetchUserProfile,
  deleteUserProfile
} from '../services/db';
import { authLogin } from '../services/firebaseService';

interface AdminViewProps {
  onPageChange: (page: Page) => void;
  currentUser: UserState;
  onLoginSuccess?: (adminUser: UserState) => void;
}

export default function AdminView({ onPageChange, currentUser, onLoginSuccess }: AdminViewProps) {
  // Admin Login States
  const [adminEmail, setAdminEmail] = useState('blessingubah38@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Authorization Check
  const isAuthorized = currentUser.email === 'blessingubah38@gmail.com';

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthenticating(true);

    if (!adminEmail || !adminPassword) {
      setAuthError('Please enter both your Admin Email and Password.');
      setIsAuthenticating(false);
      return;
    }

    try {
      let uid = `user_${adminEmail.split('@')[0]}`;
      if (isFirebaseReady) {
        uid = await authLogin(adminEmail, adminPassword);
      } else {
        // Fallback for simulation testing
        if (adminPassword !== 'admin123' && adminPassword !== '12345678') {
          throw new Error("Invalid admin password. Default demo passwords are 'admin123' or '12345678'.");
        }
      }

      let adminProfile = await fetchUserProfile(uid);
      if (!adminProfile) {
        adminProfile = getDefaultUserMetrics(adminEmail, 'admin', 'System Administrator');
        await saveUserProfile(uid, adminProfile);
      }

      setAuthSuccess('Access Granted! Opening Admin Operations Dashboard...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess({
            ...adminProfile!,
            uid,
            isLoggedIn: true
          });
        }
        setIsAuthenticating(false);
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Authentication failed. Please verify your credentials.');
      setIsAuthenticating(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'plans' | 'settings'>('users');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real-time Database state
  const [users, setUsers] = useState<UserState[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [settings, setSettings] = useState<any>({
    id: 'site',
    announcement: '',
    usdt_trc20_address: '',
    btc_address: '',
    eth_address: '',
    usdt_erc20_address: '',
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filtering States
  const [userQuery, setUserQuery] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('All');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('All');
  const [txQuery, setTxQuery] = useState('');

  // Modals & Form States
  const [editingUser, setEditingUser] = useState<UserState | null>(null);
  const [editedBalance, setEditedBalance] = useState<number>(0);
  const [editedEarned, setEditedEarned] = useState<number>(0);
  const [editedPendingWithdrawal, setEditedPendingWithdrawal] = useState<number>(0);
  const [editedWithdrew, setEditedWithdrew] = useState<number>(0);
  const [editedActiveDeposit, setEditedActiveDeposit] = useState<number>(0);
  const [editedTotalDeposit, setEditedTotalDeposit] = useState<number>(0);

  // Bonus form
  const [bonusUser, setBonusUser] = useState<string>('');
  const [bonusAmount, setBonusAmount] = useState<string>('');
  const [bonusProcessor, setBonusProcessor] = useState<'USDT TRC20' | 'Bitcoin' | 'Ethereum' | 'USDT ERC20'>('USDT TRC20');
  const [bonusModalOpen, setBonusModalOpen] = useState(false);

  // Add Money form
  const [addMoneyUser, setAddMoneyUser] = useState<string>('');
  const [addMoneyAmount, setAddMoneyAmount] = useState<string>('');
  const [addMoneyProcessor, setAddMoneyProcessor] = useState<'USDT TRC20' | 'Bitcoin' | 'Ethereum' | 'USDT ERC20'>('USDT TRC20');
  const [addMoneyModalOpen, setAddMoneyModalOpen] = useState(false);
  const [addMoneyType, setAddMoneyType] = useState<'Deposit' | 'Profit' | 'Reduce'>('Deposit');

  // Unified User Management states
  const [manageUserModalOpen, setManageUserModalOpen] = useState(false);
  const [selectedManageUser, setSelectedManageUser] = useState<UserState | null>(null);
  
  // Fields for editing selected user
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserFullName, setEditUserFullName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserUSDT, setEditUserUSDT] = useState('');
  const [editUserBTC, setEditUserBTC] = useState('');
  const [editUserETH, setEditUserETH] = useState('');
  const [editUserUSDT_ERC20, setEditUserUSDT_ERC20] = useState('');
  const [editUserSuspended, setEditUserSuspended] = useState(false);

  // States for Adding New User manually
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [addUserName, setAddUserName] = useState('');
  const [addUserFullName, setAddUserFullName] = useState('');
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addUserInitialBalance, setAddUserInitialBalance] = useState('0');

  // Plan Form
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planMin, setPlanMin] = useState(10);
  const [planMax, setPlanMax] = useState(1000);
  const [planRoi, setPlanRoi] = useState(100);
  const [planTerm, setPlanTerm] = useState(1);
  const [planRateText, setPlanRateText] = useState('');

  // Subscriptions setup
  useEffect(() => {
    if (!isAuthorized) return;

    setLoading(true);
    setErrorMessage(null);

    // 1. Subscribe to User profiles
    const unsubUsers = subscribeToAllUsers(
      (userList) => {
        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to users:", error);
        setErrorMessage("Access denied or connection issue listening to users.");
        setLoading(false);
      }
    );

    // 2. Subscribe to Transactions
    const unsubTransactions = subscribeToAllTransactions(
      (txList) => {
        setTransactions(txList);
      },
      (error) => {
        console.error("Error subscribing to transactions:", error);
      }
    );

    // 3. Load plans
    getInvestmentPlans().then(setPlans).catch(console.error);

    // 4. Load site configurations
    getSystemSettings().then((res) => {
      if (res) setSettings(res);
    }).catch(console.error);

    return () => {
      unsubUsers();
      unsubTransactions();
    };
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#07101c] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden font-sans">
        {/* Sleek background flares */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="bg-[#0b1b30] border border-teal-500/20 p-8 md:p-10 rounded-2xl max-w-md w-full shadow-2xl relative z-10 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <ShieldAlert size={36} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display tracking-wider text-white uppercase">Admin Portal</h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                This gateway is reserved strictly for authorized administrator credentials. Enter your account details below to gain admin privileges.
              </p>
            </div>
          </div>

          <form onSubmit={handleAdminSignIn} className="flex flex-col gap-4">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-xs text-red-400 font-semibold text-center leading-relaxed">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="bg-teal-500/10 border border-teal-500/30 p-3 rounded-lg text-xs text-teal-400 font-semibold text-center leading-relaxed">
                {authSuccess}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Admin Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                  <Mail size={16} />
                </span>
                <input 
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@chibuike.com"
                  required
                  className="w-full bg-[#07101c] border border-slate-700/60 focus:border-[#00c2b2] rounded-lg py-3 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Administrator Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input 
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#07101c] border border-slate-700/60 focus:border-[#00c2b2] rounded-lg py-3 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            {!isFirebaseReady && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-lg text-left text-[11px] text-yellow-400 font-medium leading-normal flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>
                  Demo Mode is active. For local simulation, feel free to use password <strong className="underline text-yellow-300">admin123</strong>.
                </span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-2 bg-[#00c2b2] hover:bg-[#00a093] disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-white shadow-lg active:scale-[0.99] mt-2 text-center"
            >
              {isAuthenticating ? (
                <>
                  <Activity size={14} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock size={14} />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>

          <div className="h-px bg-slate-800/60"></div>

          <button 
            type="button"
            onClick={() => onPageChange('Dashboard')}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
          >
            <ArrowLeft size={14} />
            <span>Return to Wallet Account</span>
          </button>
        </div>
      </div>
    );
  }

  // Handle User Edit Save
  const handleSaveUserMetrics = async () => {
    if (!editingUser || !editingUser.uid) return;
    
    const updatedProfile: UserState = {
      ...editingUser,
      accountBalance: Number(editedBalance),
      earnedTotal: Number(editedEarned),
      pendingWithdrawal: Number(editedPendingWithdrawal),
      totalWithdrew: Number(editedWithdrew),
      activeDeposit: Number(editedActiveDeposit),
      totalDeposit: Number(editedTotalDeposit)
    };

    try {
      await saveUserProfile(editingUser.uid, updatedProfile);
      setEditingUser(null);
    } catch (e) {
      alert("Error saving user metrics: " + e);
    }
  };

  // Handle Request Approval
  const handleApproveWithdrawal = async (tx: Transaction) => {
    if (confirm(`Approve withdrawal of $${tx.amount} to ${tx.username}?`)) {
      try {
        // 1. Update the master transaction status to Approved
        await updateTransactionStatus(tx.id, 'Approved');

        // 2. Update the user specific withdrawal subcollection record if userId exists
        if (tx.userId) {
          await updateWithdrawalStatus(tx.userId, tx.id, 'Approved');

          // 3. Subtract from pendingWithdrawal and add to totalWithdrew in their user profile state
          const u = users.find(user => user.uid === tx.userId);
          if (u) {
            const nextPending = Math.max(0, u.pendingWithdrawal - tx.amount);
            const nextWithdrew = u.totalWithdrew + tx.amount;
            await saveUserProfile(tx.userId, {
              ...u,
              pendingWithdrawal: nextPending,
              totalWithdrew: nextWithdrew
            });
          }
        }
      } catch (err) {
        console.error("Approval error:", err);
        alert("Failed approving withdrawal: " + err);
      }
    }
  };

  // Handle Request Rejection
  const handleRejectWithdrawal = async (tx: Transaction) => {
    if (confirm(`Reject withdrawal request of $${tx.amount} from ${tx.username}? The funds will be credited back to their account balance.`)) {
      try {
        // 1. Update master trans log
        await updateTransactionStatus(tx.id, 'Rejected');

        // 2. Update subcollection status
        if (tx.userId) {
          await updateWithdrawalStatus(tx.userId, tx.id, 'Rejected');

          // 3. Refund amount back to accountBalance & deduct from pendingWithdrawal
          const u = users.find(user => user.uid === tx.userId);
          if (u) {
            const nextBalance = u.accountBalance + tx.amount;
            const nextPending = Math.max(0, u.pendingWithdrawal - tx.amount);
            await saveUserProfile(tx.userId, {
              ...u,
              accountBalance: nextBalance,
              pendingWithdrawal: nextPending
            });
          }
        }
      } catch (err) {
        console.error("Rejection error:", err);
        alert("Failed rejecting withdrawal: " + err);
      }
    }
  };

  // Handle Deposit Approval (if pending)
  const handleApproveDeposit = async (tx: Transaction) => {
    if (confirm(`Approve deposit of $${tx.amount} for ${tx.username}? This will add the sum to their account balance & total deposits.`)) {
      try {
        await updateTransactionStatus(tx.id, 'Approved');
        if (tx.userId) {
          const u = users.find(user => user.uid === tx.userId);
          if (u) {
            await saveUserProfile(tx.userId, {
              ...u,
              accountBalance: u.accountBalance + tx.amount,
              totalDeposit: u.totalDeposit + tx.amount,
              lastDeposit: tx.amount
            });
          }
        }
      } catch (err) {
        alert("Error approving deposit: " + err);
      }
    }
  };

  // Handle Dispensing Admin Bonus
  const handleDispenseBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusUser) {
      alert("Please select a target user.");
      return;
    }
    const val = Number(bonusAmount);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid bonus amount.");
      return;
    }

    const target = users.find(u => u.uid === bonusUser || u.username === bonusUser);
    if (!target || !target.uid) {
      alert("Selected user metrics not found matches.");
      return;
    }

    try {
      // 1. Log a Bonus Transaction
      const txId = `tx_bonus_${Date.now()}`;
      await addTransactionRecord(target.uid, {
        id: txId,
        userId: target.uid,
        username: target.username,
        type: 'Bonus',
        amount: val,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        status: 'Approved',
        processor: bonusProcessor,
        createdAt: Date.now(),
        approvedAt: Date.now()
      });

      // 2. Increment targeted username's accountBalance & earnedTotal
      await saveUserProfile(target.uid, {
        ...target,
        accountBalance: target.accountBalance + val,
        earnedTotal: target.earnedTotal + val
      });

      setBonusAmount('');
      setBonusModalOpen(false);
      alert(`Successfully dispensed $${val} bonus to ${target.username}!`);
    } catch (err) {
      alert("Dispensing error: " + err);
    }
  };

  // Handle Dispensing Admin Add Money
  const handleDispenseMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMoneyUser) {
      alert("Please select a target user.");
      return;
    }
    const val = Number(addMoneyAmount);
    if (isNaN(val) || val <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const target = users.find(u => u.uid === addMoneyUser || u.username === addMoneyUser);
    if (!target || !target.uid) {
      alert("Selected user metrics not found matches.");
      return;
    }

    try {
      if (addMoneyType === 'Deposit') {
        const txId = `tx_deposit_admin_${Date.now()}`;
        await addTransactionRecord(target.uid, {
          id: txId,
          userId: target.uid,
          username: target.username,
          type: 'Deposit',
          amount: val,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          status: 'Approved',
          processor: addMoneyProcessor,
          createdAt: Date.now(),
          approvedAt: Date.now()
        });

        const nextBalance = Number(target.accountBalance) + val;
        const nextTotalDeposit = Number(target.totalDeposit) + val;
        await saveUserProfile(target.uid, {
          ...target,
          accountBalance: nextBalance,
          totalDeposit: nextTotalDeposit,
          lastDeposit: val
        });
        alert(`Successfully added $${val} Deposit balance directly for ${target.username}!`);
      } else if (addMoneyType === 'Profit') {
        const txId = `tx_profit_admin_${Date.now()}`;
        await addTransactionRecord(target.uid, {
          id: txId,
          userId: target.uid,
          username: target.username,
          type: 'Profit',
          amount: val,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          status: 'Approved',
          processor: addMoneyProcessor,
          createdAt: Date.now(),
          approvedAt: Date.now()
        });

        const nextBalance = Number(target.accountBalance) + val;
        const nextEarnedTotal = Number(target.earnedTotal) + val;
        await saveUserProfile(target.uid, {
          ...target,
          accountBalance: nextBalance,
          earnedTotal: nextEarnedTotal
        });
        alert(`Successfully added $${val} Profits directly for ${target.username}!`);
      } else if (addMoneyType === 'Reduce') {
        const txId = `tx_reduction_admin_${Date.now()}`;
        await addTransactionRecord(target.uid, {
          id: txId,
          userId: target.uid,
          username: target.username,
          type: 'Withdrawal',
          amount: val,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          status: 'Approved',
          processor: addMoneyProcessor,
          createdAt: Date.now(),
          approvedAt: Date.now()
        });

        const nextBalance = Math.max(0, Number(target.accountBalance) - val);
        await saveUserProfile(target.uid, {
          ...target,
          accountBalance: nextBalance
        });
        alert(`Successfully reduced ${target.username}'s balance by $${val}!`);
      }

      setAddMoneyAmount('');
      setAddMoneyModalOpen(false);
    } catch (err) {
      alert("Error adjusting client money parameters: " + err);
    }
  };

  // Manage User: Add new user profile
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserName || !addUserEmail) {
      alert("Please enter a username and email.");
      return;
    }
    const cleanEmail = addUserEmail.trim().toLowerCase();
    const cleanUsername = addUserName.trim().toLowerCase();

    if (users.some(u => u.username === cleanUsername || u.email === cleanEmail)) {
      alert("Username or email already exists in our records.");
      return;
    }

    const customUid = `user_admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initBalance = Number(addUserInitialBalance) || 0;

    const newUser: UserState = {
      uid: customUid,
      isLoggedIn: true,
      username: cleanUsername,
      fullName: addUserFullName.trim() || cleanUsername,
      email: cleanEmail,
      wallets: {
        usdtTrc20: '',
        bitcoin: '',
        ethereum: '',
        usdtErc20: ''
      },
      accountBalance: initBalance,
      earnedTotal: 0,
      pendingWithdrawal: 0,
      totalWithdrew: 0,
      activeDeposit: 0,
      lastDeposit: initBalance,
      totalDeposit: initBalance,
      lastWithdrawal: '0',
      profilePhoto: '',
      suspended: false
    };

    try {
      await saveUserProfile(customUid, newUser);
      if (initBalance > 0) {
        await addTransactionRecord(customUid, {
          id: `tx_init_${Date.now()}`,
          userId: customUid,
          username: newUser.username,
          type: 'Deposit',
          amount: initBalance,
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          status: 'Approved',
          processor: 'USDT TRC20',
          createdAt: Date.now(),
          approvedAt: Date.now()
        });
      }

      setAddUserName('');
      setAddUserFullName('');
      setAddUserEmail('');
      setAddUserInitialBalance('0');
      setAddUserModalOpen(false);
      alert(`User profile for @${cleanUsername} successfully created!`);
    } catch (err) {
      alert("Error creating user: " + err);
    }
  };

  // Manage User: Update edited user profile
  const handleUpdateManagedProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManageUser || !selectedManageUser.uid) return;

    try {
      const updatedUser: UserState = {
        ...selectedManageUser,
        username: editUserUsername.trim().toLowerCase() || selectedManageUser.username,
        fullName: editUserFullName.trim() || selectedManageUser.fullName,
        email: editUserEmail.trim().toLowerCase() || selectedManageUser.email,
        wallets: {
          usdtTrc20: editUserUSDT,
          bitcoin: editUserBTC,
          ethereum: editUserETH,
          usdtErc20: editUserUSDT_ERC20
        },
        suspended: editUserSuspended
      };

      await saveUserProfile(selectedManageUser.uid, updatedUser);
      setManageUserModalOpen(false);
      setSelectedManageUser(null);
      alert(`Successfully saved managed profile fields for @${updatedUser.username}!`);
    } catch (err) {
      alert("Failed updating user settings: " + err);
    }
  };

  // Manage User: Delete user profile
  const handleRemoveUser = async (uid: string) => {
    const confirmDelete = window.confirm("Are you absolutely sure you want to permanently delete this user profile? All wallet settings and transaction metrics will be deleted. This action cannot be undone!");
    if (!confirmDelete) return;

    try {
      await deleteUserProfile(uid);
      setManageUserModalOpen(false);
      setSelectedManageUser(null);
      alert("User profile successfully deleted.");
    } catch (err) {
      alert("Error deleting user: " + err);
    }
  };

  // Handle Plan Edit or Create
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName) {
      alert("Please fill in the package title.");
      return;
    }

    const newPlan: InvestmentPlan = {
      id: editingPlan?.id || `plan_${Date.now()}`,
      name: planName,
      min: Number(planMin),
      max: Number(planMax),
      roi: Number(planRoi),
      term: Number(planTerm),
      dailyRateText: planRateText || `${((planRoi - 100) / (planTerm * 24)).toFixed(3)}% HOURLY`,
      hourlyRateText: 'Every Hour'
    };

    try {
      await addInvestmentPlan(newPlan);
      setPlans(prev => [...prev.filter(p => p.id !== newPlan.id), newPlan]);
      setPlanFormOpen(false);
      setEditingPlan(null);
      // Reset
      setPlanName('');
      setPlanRateText('');
    } catch (err) {
      alert("Error saving package: " + err);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (id: string) => {
    if (confirm("Are you absolutely sure you want to remove this investment plan?")) {
      try {
        await deleteInvestmentPlan(id);
        setPlans(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert("Delete failed: " + err);
      }
    }
  };

  // Handle Settings Save
  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSystemSettings(settings);
      alert("Platform settings successfully synchronized!");
    } catch (err) {
      alert("Error updating database properties: " + err);
    }
  };

  // Filtered Lists
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(userQuery.toLowerCase()) ||
    u.fullName.toLowerCase().includes(userQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => {
    const matchesUser = t.username.toLowerCase().includes(txQuery.toLowerCase()) || 
                        t.id.toLowerCase().includes(txQuery.toLowerCase());
    const matchesType = txTypeFilter === 'All' || t.type === txTypeFilter;
    const matchesStatus = txStatusFilter === 'All' || t.status === txStatusFilter;
    return matchesUser && matchesType && matchesStatus;
  });

  // Calculate Metrics
  const totalBalances = users.reduce((sum, u) => sum + u.accountBalance, 0);
  const totalDeposited = users.reduce((sum, u) => sum + u.totalDeposit, 0);
  const totalWithdrawn = users.reduce((sum, u) => sum + u.totalWithdrew, 0);
  const activeDepositsTotal = users.reduce((sum, u) => sum + u.activeDeposit, 0);
  const pendingWithdrawalsTotal = users.reduce((sum, u) => sum + u.pendingWithdrawal, 0);

  return (
    <div className="min-h-screen bg-[#07111e] font-sans text-slate-100 flex flex-col md:flex-row relative">
      
      {/* Mobile Sticky Navigation Banner */}
      <div className="md:hidden sticky top-0 left-0 right-0 bg-[#091526] border-b border-[#152e4f] p-4 flex items-center justify-between z-40 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#9333ea] to-[#041a31] flex items-center justify-center text-[10px] font-black">
            A
          </div>
          <span className="text-sm font-black text-white tracking-wider font-display uppercase">
            Admin <span className="text-[#00c2b2]">Panel</span>
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#0b1b30] border border-[#183556] px-2.5 py-1 rounded-full text-[9px] font-bold text-[#00c2b2] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c2b2] animate-pulse"></span>
            LIVE
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-500 transition-all bg-slate-900/40 border border-[#163050]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 md:hidden transition-all duration-300"
        />
      )}

      {/* Admin Sidebar (Desktop & Mobile Slideout Drawer) */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-[#091526] border-r border-[#152e4f] p-6 flex flex-col gap-6 shrink-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center md:block">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#9333ea] to-[#041a31] flex items-center justify-center text-xs font-black">
                A
              </div>
              <span className="text-lg font-black text-white tracking-wider font-display uppercase">
                Admin <span className="text-[#00c2b2]">Panel</span>
              </span>
            </div>
            <div className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">REAL-TIME CONSOLES</div>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white md:hidden hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Current User Status info */}
        <div className="p-3.5 bg-slate-900/40 rounded-xl border border-[#173357] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400 font-bold text-xs uppercase">
            AD
          </div>
          <div className="overflow-hidden">
            <div className="text-[10px] text-slate-500 font-bold uppercase leading-none">AUTHORIZED ADMIN</div>
            <div className="text-xs font-black text-white truncate leading-normal mt-1">{currentUser.username}</div>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="flex flex-col gap-1.5 flex-1 select-none">
          <button 
            onClick={() => {
              setActiveTab('users');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === 'users' ? 'bg-[#9333ea] text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white hover:bg-slate-900/30 font-medium'
            }`}
          >
            <Users size={15} />
            <span>Users Performance</span>
          </button>
          
          <button 
            onClick={() => {
              setActiveTab('transactions');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === 'transactions' ? 'bg-[#9333ea] text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white hover:bg-slate-900/30 font-medium'
            }`}
          >
            <Activity size={15} />
            <span>Financial Logs</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('plans');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === 'plans' ? 'bg-[#9333ea] text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white hover:bg-slate-900/30 font-medium'
            }`}
          >
            <Percent size={15} />
            <span>Investment Plans</span>
          </button>

          <button 
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 cursor-pointer ${
              activeTab === 'settings' ? 'bg-[#9333ea] text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white hover:bg-slate-900/30 font-medium'
            }`}
          >
            <Settings size={15} />
            <span>System Settings</span>
          </button>
        </nav>

        {/* Foot exit link */}
        <div className="pt-4 border-t border-[#152e4f]">
          <button 
            onClick={() => {
              onPageChange('Dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg text-teal-400 hover:text-white hover:bg-teal-500/10 transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace Container */}
      <main className="flex-1 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto">
        
        {/* Dynamic header row with real-time status banner */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#142d4a]">
          <div>
            <h1 className="text-2xl font-black font-display tracking-tight text-white uppercase">
              {activeTab === 'users' && "User Performance Dashboard"}
              {activeTab === 'transactions' && "Real-Time Ledger & Requests"}
              {activeTab === 'plans' && "Dynamic Investment Packages"}
              {activeTab === 'settings' && "Global Platform Configuration"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active Session sync connected safely via Web SDK. Real-time updates active.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'users' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setAddMoneyUser('');
                    setAddMoneyAmount('');
                    setAddMoneyModalOpen(true);
                  }}
                  className="bg-teal-600 hover:bg-teal-700 text-slate-100 font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Coins size={14} />
                  <span>Add Money</span>
                </button>
                <button 
                  onClick={() => {
                    setBonusUser('');
                    setBonusAmount('');
                    setBonusModalOpen(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Gift size={14} />
                  <span>Award Bonus</span>
                </button>
              </div>
            )}

            {activeTab === 'plans' && (
              <button 
                onClick={() => {
                  setEditingPlan(null);
                  setPlanName('');
                  setPlanMin(10);
                  setPlanMax(5000);
                  setPlanRoi(102);
                  setPlanTerm(3);
                  setPlanRateText('');
                  setPlanFormOpen(true);
                }}
                className="bg-teal-500 hover:bg-teal-600 text-slate-900 font-black py-2.5 px-4 rounded-lg text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Package</span>
              </button>
            )}
            
            <div className="flex items-center gap-1.5 bg-[#0b1b30] border border-[#183556] px-3 py-1.5 rounded-full text-[10px] font-bold text-[#00c2b2] uppercase tracking-widest animate-pulse leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c2b2]"></span>
              LIVE RECORD ACTIVE
            </div>
          </div>
        </header>

        {/* Global connection error warning, if any */}
        {errorMessage && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs flex gap-2.5 items-center">
            <ShieldAlert size={16} className="shrink-0 text-red-400" />
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Real-time stats grid for users/transactions sections */}
        {(activeTab === 'users' || activeTab === 'transactions') && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-[#091527] border border-[#132c4b] p-4 rounded-xl">
              <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Total User Balances</div>
              <div className="text-lg font-black text-white mt-1.5 font-mono">${totalBalances.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div className="text-[9px] text-slate-500 font-semibold mt-1">Aggregate liability holding</div>
            </div>

            <div className="bg-[#091527] border border-[#132c4b] p-4 rounded-xl">
              <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Total Deposited</div>
              <div className="text-lg font-black text-white mt-1.5 font-mono">${totalDeposited.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div className="text-[9px] text-slate-500 font-semibold mt-1">Accumulated cash volume</div>
            </div>

            <div className="bg-[#091527] border border-[#132c4b] p-4 rounded-xl">
              <div className="text-[10px] text-[#00c2b2] font-bold uppercase tracking-wider">Active Deposits</div>
              <div className="text-lg font-black text-white mt-1.5 font-mono">${activeDepositsTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div className="text-[9px] text-slate-500 font-semibold mt-1">Sum active packages yielding</div>
            </div>

            <div className="bg-[#091527] border border-[#132c4b] p-4 rounded-xl">
              <div className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Pending Withdrawals</div>
              <div className="text-lg font-black text-white mt-1.5 font-mono">${pendingWithdrawalsTotal.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 2})}</div>
              <div className="text-[9px] text-slate-500 font-semibold mt-1">Pending approval processing</div>
            </div>

            <div className="bg-[#091527] border border-[#132c4b] p-4 rounded-xl sm:col-span-2 lg:col-span-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Withdrawn</div>
              <div className="text-lg font-black text-white mt-1.5 font-mono">${totalWithdrawn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <div className="text-[9px] text-slate-500 font-semibold mt-1">Total completed payouts</div>
            </div>

          </section>
        )}

        {/* Tab content renderer */}
        {loading ? (
          <div className="flex-grow flex flex-col justify-center items-center py-24 gap-4 text-slate-400 text-xs font-semibold">
            <div className="w-10 h-10 border-4 border-[#00c2b2] border-t-transparent rounded-full animate-spin"></div>
            <div>Syncing with live performance streams...</div>
          </div>
        ) : (
          <div className="flex-1">
            
            {/* 1. USERS LIST TAB */}
            {activeTab === 'users' && (
              <div className="bg-[#091527] border border-[#112a47] rounded-xl flex flex-col">
                {/* Search Bar section */}
                <div className="p-4 border-b border-[#142f50] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                    <input 
                      type="text" 
                      placeholder="Search accounts by username, email, full name..." 
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      className="w-full bg-[#06101c] text-xs py-3 pl-10 pr-4 rounded-lg text-slate-100 placeholder-slate-500 border border-[#163356] focus:border-[#00c2b2] hover:border-[#1e436f] focus:outline-hidden transition-all font-semibold"
                    />
                  </div>
                  <div className="flex gap-2.5 items-center justify-between md:justify-end">
                    <button
                      onClick={() => setAddUserModalOpen(true)}
                      className="bg-[#00c2b2] hover:bg-[#00e0cf] text-slate-950 text-[10px] font-black uppercase tracking-wider px-4 py-3 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 whitespace-nowrap"
                    >
                      <Plus size={13} />
                      <span>Add New User</span>
                    </button>
                    <div className="text-xs font-semibold text-slate-400 whitespace-nowrap font-mono px-1">
                      Found {filteredUsers.length} profiles
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#142f50] text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/15">
                        <th className="p-4">Username / Identity</th>
                        <th className="p-4">Balance</th>
                        <th className="p-4 text-[#00c2b2]">Active Deposit</th>
                        <th className="p-4 text-orange-400">Pending Withdraw</th>
                        <th className="p-4 text-green-400 font-semibold">Earned Total</th>
                        <th className="p-4 text-slate-400">Total Deposit</th>
                        <th className="p-4 text-right">Perform Tasks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#122b49] text-xs font-medium">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-505 text-xs italic">
                            No user matches matching "{userQuery}" found.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.uid || u.email} className="hover:bg-slate-900/10 transition-colors">
                            <td className="p-4">
                              <div>
                                <span className="font-bold text-white text-sm">{u.username}</span>
                                <span className="text-[10px] text-[#00c2b2] font-bold ml-1.5 bg-[#00c2b2]/10 px-1.5 py-0.5 rounded">User</span>
                                {u.suspended && (
                                  <span className="text-[10px] text-red-400 font-bold ml-1.5 bg-red-950/70 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse">SUSPENDED</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5 font-mono">{u.email}</div>
                              <div className="text-[10px] text-slate-400 max-w-xs mt-0.5 capitalize">{u.fullName}</div>
                            </td>
                            <td className="p-4 font-mono font-bold text-yellow-500">${u.accountBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="p-4 font-mono text-[#00c2b2]">${u.activeDeposit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="p-4 font-mono text-orange-400">${u.pendingWithdrawal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="p-4 font-mono text-green-400 font-bold">${u.earnedTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="p-4 font-mono font-medium text-slate-400">${u.totalDeposit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button 
                                  onClick={() => {
                                    setAddMoneyUser(u.uid || '');
                                    setAddMoneyAmount('');
                                    setAddMoneyType('Deposit');
                                    setAddMoneyModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-[#092c28] hover:bg-[#0c3e38] text-[#00c2b2] px-2 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                                >
                                  <Coins size={11} />
                                  <span>Add Money</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setBonusUser(u.uid || '');
                                    setBonusAmount('');
                                    setBonusModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-purple-950/70 hover:bg-purple-900 text-purple-300 px-2 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                                >
                                  <Gift size={11} />
                                  <span>Add Bonus</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedManageUser(u);
                                    setEditUserUsername(u.username);
                                    setEditUserFullName(u.fullName);
                                    setEditUserEmail(u.email);
                                    setEditUserUSDT(u.wallets?.usdtTrc20 || '');
                                    setEditUserBTC(u.wallets?.bitcoin || '');
                                    setEditUserETH(u.wallets?.ethereum || '');
                                    setEditUserUSDT_ERC20(u.wallets?.usdtErc20 || '');
                                    setEditUserSuspended(!!u.suspended);
                                    setManageUserModalOpen(true);
                                  }}
                                  className={`inline-flex items-center gap-1 ${u.suspended ? 'bg-red-950/70 border-red-800/40 text-red-300' : 'bg-slate-800 border-slate-700/40 text-slate-200'} hover:opacity-90 px-2 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer border`}
                                >
                                  <Settings size={11} className={u.suspended ? "text-red-400 animate-pulse" : ""} />
                                  <span>{u.suspended ? "Suspended (Manage)" : "Manage User"}</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingUser(u);
                                    setEditedBalance(u.accountBalance);
                                    setEditedEarned(u.earnedTotal);
                                    setEditedPendingWithdrawal(u.pendingWithdrawal);
                                    setEditedWithdrew(u.totalWithdrew);
                                    setEditedActiveDeposit(u.activeDeposit);
                                    setEditedTotalDeposit(u.totalDeposit);
                                  }}
                                  className="inline-flex items-center gap-1 bg-[#10243b] hover:bg-[#15304f] text-[#00c2b2] px-2.5 py-1.5 rounded-md font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                                >
                                  <Edit size={11} />
                                  <span>Correct Performance</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Users Mobile Card-based view */}
                <div className="block md:hidden divide-y divide-[#122b49] bg-[#091527] rounded-b-xl overflow-hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs italic">
                      No user matches matching "{userQuery}" found.
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div key={u.uid || u.email} className="p-4 hover:bg-slate-900/10 transition-colors flex flex-col gap-3.5">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="font-bold text-white text-md block truncate">{u.username}</span>
                            <span className="text-[10px] text-[#00c2b2] font-bold bg-[#00c2b2]/10 px-1.5 py-0.5 rounded leading-none inline-block mt-1">User</span>
                            {u.suspended && (
                              <span className="text-[9px] text-red-400 font-bold bg-red-950/70 border border-red-500/20 px-1.5 py-0.5 rounded leading-none inline-block mt-1 ml-1.5 animate-pulse uppercase">SUSPENDED</span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono block mt-1.5 truncate">{u.email}</span>
                            <span className="text-[10px] text-slate-400 block capitalize mt-0.5 truncate">{u.fullName}</span>
                          </div>
                          {/* Main Balance Highlight */}
                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-500 uppercase font-black block tracking-wider">Balance</span>
                            <span className="text-sm font-mono font-black text-yellow-500">${u.accountBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>

                        {/* Stats Dashboard for each user card */}
                        <div className="grid grid-cols-2 gap-2 bg-[#06101c]/55 p-3 rounded-lg border border-[#112a4a] text-[11px] font-semibold text-slate-300">
                          <div>
                            <span className="text-slate-500 text-[9px] uppercase font-bold block tracking-wide">Active Deposit</span>
                            <span className="text-[#00c2b2] font-mono font-bold">${u.activeDeposit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[9px] uppercase font-bold block tracking-wide">Pending Withdraw</span>
                            <span className="text-orange-400 font-mono font-bold">${u.pendingWithdrawal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-500 text-[9px] uppercase font-bold block tracking-wide">Earned Total</span>
                            <span className="text-green-400 font-mono font-bold">${u.earnedTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-slate-500 text-[9px] uppercase font-bold block tracking-wide">Total Deposit</span>
                            <span className="text-slate-400 font-mono font-bold">${u.totalDeposit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>

                        {/* Actions block with proper touch sizes */}
                        <div className="flex flex-col gap-2 pt-1 font-semibold">
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => {
                                setAddMoneyUser(u.uid || '');
                                setAddMoneyAmount('');
                                setAddMoneyType('Deposit');
                                setAddMoneyModalOpen(true);
                              }}
                              className="min-h-[44px] inline-flex items-center justify-center gap-1 bg-[#092c28] hover:bg-[#0c3e38] text-[#00c2b2] px-2.5 py-2 rounded-lg font-black uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                            >
                              <Coins size={12} />
                              <span>Add Money</span>
                            </button>
                            <button 
                              onClick={() => {
                                setBonusUser(u.uid || '');
                                setBonusAmount('');
                                setBonusModalOpen(true);
                              }}
                              className="min-h-[44px] inline-flex items-center justify-center gap-1 bg-purple-950/70 hover:bg-purple-900 text-purple-300 px-2.5 py-2 rounded-lg font-black uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                            >
                              <Gift size={12} />
                              <span>Add Bonus</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => {
                                setSelectedManageUser(u);
                                setEditUserUsername(u.username);
                                setEditUserFullName(u.fullName);
                                setEditUserEmail(u.email);
                                setEditUserUSDT(u.wallets?.usdtTrc20 || '');
                                setEditUserBTC(u.wallets?.bitcoin || '');
                                setEditUserETH(u.wallets?.ethereum || '');
                                setEditUserUSDT_ERC20(u.wallets?.usdtErc20 || '');
                                setEditUserSuspended(!!u.suspended);
                                setManageUserModalOpen(true);
                              }}
                              className={`min-h-[44px] inline-flex items-center justify-center gap-1 ${u.suspended ? 'bg-red-950/70 border-red-800/40 text-red-300' : 'bg-slate-800 border-slate-700/40 text-slate-200'} hover:opacity-90 px-2.5 py-2 rounded-lg font-black uppercase tracking-wider text-[10px] transition-all cursor-pointer border`}
                            >
                              <Settings size={12} className={u.suspended ? "text-red-400 animate-pulse" : ""} />
                              <span>{u.suspended ? "Suspended (Manage)" : "Manage User"}</span>
                            </button>
                            <button 
                              onClick={() => {
                                setEditingUser(u);
                                setEditedBalance(u.accountBalance);
                                setEditedEarned(u.earnedTotal);
                                setEditedPendingWithdrawal(u.pendingWithdrawal);
                                setEditedWithdrew(u.totalWithdrew);
                                setEditedActiveDeposit(u.activeDeposit);
                                setEditedTotalDeposit(u.totalDeposit);
                              }}
                              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 bg-[#10243b] hover:bg-[#15304f] text-[#00c2b2] px-3 py-2 rounded-lg font-black uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                            >
                              <Edit size={12} />
                              <span>Correct Perf</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. TRANSACTION LOG TAB */}
            {activeTab === 'transactions' && (
              <div className="bg-[#091527] border border-[#112a47] rounded-xl flex flex-col">
                <div className="p-4 border-b border-[#142f50] flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                    <input 
                      type="text" 
                      placeholder="Filter transactions by user or ID details..." 
                      value={txQuery}
                      onChange={(e) => setTxQuery(e.target.value)}
                      className="w-full bg-[#06101c] text-xs py-2.5 pl-9 pr-4 rounded-lg text-slate-100 placeholder-slate-500 border border-[#163356] focus:border-[#00c2b2] focus:outline-hidden transition-all"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <select 
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="bg-[#06101c] text-xs px-3 py-2.5 rounded-lg border border-[#163356] text-slate-300 focus:outline-hidden"
                  >
                    <option value="All">All Types</option>
                    <option value="Deposit">Deposits Only</option>
                    <option value="Withdrawal">Withdrawals Only</option>
                    <option value="Investment">Investments</option>
                    <option value="Profit">Profits</option>
                    <option value="Bonus">Bonuses</option>
                  </select>

                  {/* Status Filter */}
                  <select 
                    value={txStatusFilter}
                    onChange={(e) => setTxStatusFilter(e.target.value)}
                    className="bg-[#06101c] text-xs px-3 py-2.5 rounded-lg border border-[#163356] text-slate-300 focus:outline-hidden"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                        {/* Transactions Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#142f50] text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/15">
                        <th className="p-4">Date & Stamp</th>
                        <th className="p-4">Log Details</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Processor</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Approval Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#122b49] text-xs font-semibold">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-505 text-xs italic">
                            No ledger documents matched current search configurations.
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((tx) => {
                          const isWithdrawal = tx.type === 'Withdrawal';
                          const isDeposit = tx.type === 'Deposit';
                          const isPending = tx.status === 'Pending';
                          
                          return (
                            <tr key={tx.id} className="hover:bg-slate-900/10 transition-colors">
                              <td className="p-4 text-slate-400 font-mono text-[10px]">
                                <div>{tx.date}</div>
                                <div className="text-[10px] text-slate-600 mt-0.5">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-white text-xs">{tx.username}</div>
                                <div className="text-[9px] text-slate-500 font-mono mt-0.5 selection:bg-purple-900/50">ID: {tx.id}</div>
                                {tx.paymentProof && (
                                  <div className="mt-1">
                                    <a 
                                      href={tx.paymentProof} 
                                      target="_blank" 
                                      referrerPolicy="no-referrer" 
                                      className="text-teal-400 hover:underline text-[10px] inline-flex items-center gap-1 font-semibold"
                                    >
                                      <Info size={11} />
                                      View Payment Proof Image
                                    </a>
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                  tx.type === 'Deposit' ? 'bg-green-500/10 text-green-400' :
                                  tx.type === 'Withdrawal' ? 'bg-orange-500/10 text-orange-400' :
                                  tx.type === 'Investment' ? 'bg-blue-500/10 text-blue-400' :
                                  tx.type === 'Profit' ? 'bg-teal-500/10 text-teal-400' :
                                  'bg-purple-500/10 text-purple-400'
                                }}`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-bold text-white">${tx.amount.toFixed(2)}</td>
                              <td className="p-4 font-mono text-xs">{tx.processor}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold ${
                                  tx.status === 'Approved' || tx.status === 'Completed' ? 'bg-green-500/15 text-green-400' :
                                  tx.status === 'Pending' ? 'bg-amber-500/15 text-amber-400 animate-pulse' :
                                  'bg-red-500/15 text-red-500'
                                }}`}>
                                  <span>{tx.status}</span>
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {isPending && isWithdrawal && (
                                  <div className="inline-flex gap-1.5">
                                    <button 
                                      onClick={() => handleApproveWithdrawal(tx)}
                                      className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-sm cursor-pointer"
                                      title="Approve Payout"
                                    >
                                      <CheckCircle size={15} />
                                    </button>
                                    <button 
                                      onClick={() => handleRejectWithdrawal(tx)}
                                      className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-sm cursor-pointer"
                                      title="Reject/Refund Request"
                                    >
                                      <XCircle size={15} />
                                    </button>
                                  </div>
                                )}
                                {isPending && isDeposit && (
                                  <button 
                                    onClick={() => handleApproveDeposit(tx)}
                                    className="bg-green-600 hover:bg-green-700 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider cursor-pointer"
                                  >
                                    Approve Deposit
                                  </button>
                                )}
                                {!isPending && (
                                  <span className="text-[10px] text-slate-500 italic font-semibold">Audited</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Transactions Mobile Card-based view */}
                <div className="block md:hidden divide-y divide-[#122b49] bg-[#091527] rounded-b-xl overflow-hidden">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-505 text-xs italic">
                      No ledger documents matched current search configurations.
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isWithdrawal = tx.type === 'Withdrawal';
                      const isDeposit = tx.type === 'Deposit';
                      const isPending = tx.status === 'Pending';
                      
                      return (
                        <div key={tx.id} className="p-4 hover:bg-slate-900/10 transition-colors flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-white text-xs block">{tx.username}</span>
                              <span className="text-[9px] text-slate-500 font-mono block mt-0.5 truncate max-w-[150px]">ID: {tx.id}</span>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider block ${
                              tx.type === 'Deposit' ? 'bg-green-500/10 text-green-400' :
                              tx.type === 'Withdrawal' ? 'bg-orange-500/10 text-orange-400' :
                              tx.type === 'Investment' ? 'bg-blue-500/10 text-blue-400' :
                              tx.type === 'Profit' ? 'bg-teal-500/10 text-teal-400' :
                              'bg-purple-500/10 text-purple-400'
                            }`}>
                              {tx.type}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs bg-[#06101c]/55 p-2.5 rounded-lg border border-[#112a4a]">
                            <div>
                              <span className="text-slate-500 text-[9px] uppercase font-bold block">Asset Amount</span>
                              <span className="font-mono font-black text-white text-sm">${tx.amount.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">via {tx.processor}</span></span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 text-[9px] uppercase font-bold block">Log Status</span>
                              <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-black tracking-wide ${
                                tx.status === 'Approved' || tx.status === 'Completed' ? 'bg-green-500/15 text-green-400' :
                                tx.status === 'Pending' ? 'bg-amber-500/15 text-amber-400 animate-pulse' :
                                'bg-red-500/15 text-red-500'
                              }`}>
                                {tx.status}
                              </span>
                            </div>
                          </div>

                          {/* Timestamp & Payment Proof */}
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <div>
                              <span className="font-mono block font-semibold">{tx.date}</span>
                              <span className="text-slate-600 block mt-0.5 font-semibold">{new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            {tx.paymentProof && (
                              <div>
                                <a 
                                  href={tx.paymentProof} 
                                  target="_blank" 
                                  referrerPolicy="no-referrer" 
                                  className="text-teal-400 hover:underline min-h-[32px] inline-flex items-center gap-1 font-bold bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded-md transition-colors hover:bg-teal-500/20"
                                >
                                  <Info size={11} />
                                  <span>View Proof</span>
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Actions Panel on mobile */}
                          {isPending && (isWithdrawal || isDeposit) && (
                            <div className="pt-1 flex gap-2">
                              {isWithdrawal && (
                                <>
                                  <button 
                                    onClick={() => handleApproveWithdrawal(tx)}
                                    className="flex-grow bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[38px]"
                                  >
                                    <CheckCircle size={13} />
                                    <span>Approve</span>
                                  </button>
                                  <button 
                                    onClick={() => handleRejectWithdrawal(tx)}
                                    className="flex-grow bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer min-h-[38px]"
                                  >
                                    <XCircle size={13} />
                                    <span>Reject</span>
                                  </button>
                                </>
                              )}
                              {isDeposit && (
                                <button 
                                  onClick={() => handleApproveDeposit(tx)}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
                                >
                                  <CheckCircle size={13} />
                                  <span>Approve Deposit</span>
                                </button>
                              )}
                            </div>
                          )}
                          {!isPending && (
                            <div className="text-right text-[10px] text-slate-500 italic font-semibold">
                              Audited and finalized
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>          </div>
              </div>
            )}

            {/* 3. INVESTMENT PLANS CRUD TAB */}
            {activeTab === 'plans' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((p) => (
                  <div key={p.id} className="bg-[#091527] border border-[#132d4b] p-5 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-[#00c2b2] tracking-wider uppercase font-mono">{p.dailyRateText}</span>
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setEditingPlan(p);
                              setPlanName(p.name);
                              setPlanMin(p.min);
                              setPlanMax(p.max);
                              setPlanRoi(p.roi);
                              setPlanTerm(p.term);
                              setPlanRateText(p.dailyRateText);
                              setPlanFormOpen(true);
                            }}
                            className="p-1.5 hover:bg-slate-800 text-blue-400 rounded-sm cursor-pointer"
                          >
                            <Edit size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeletePlan(p.id)}
                            className="p-1.5 hover:bg-slate-800 text-red-500 rounded-sm cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-md font-black text-white uppercase tracking-tight mt-2 font-display">{p.name}</h3>
                      <div className="text-[10px] text-slate-500 mt-1 font-semibold selection:bg-purple-900/50">Plan ID: {p.id}</div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4 py-3 border-y border-[#122842] text-xs font-semibold">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Min Principal</div>
                          <div className="text-white font-bold font-mono mt-0.5">${p.min.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase">Max Principal</div>
                          <div className="text-white font-bold font-mono mt-0.5">${p.max.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold font-mono">Term: <strong className="text-white font-bold">{p.term} Days</strong></span>
                        <span className="text-purple-400 font-black text-sm">{p.roi}% ROI</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. PLATFORM SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="bg-[#091527] border border-[#112a47] rounded-xl p-6 md:p-8 max-w-2xl">
                <form onSubmit={handleSaveGlobalSettings} className="space-y-6">
                  
                  {/* Announcement Banner */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <BellRing size={14} className="text-purple-400" />
                      <span>Welcome Banner & News Announcement</span>
                    </label>
                    <textarea 
                      rows={3}
                      value={settings.announcement}
                      onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                      className="bg-[#06101c] text-xs p-3.5 rounded-lg text-slate-100 placeholder-slate-500 border border-[#163356] focus:border-[#00c2b2] focus:outline-hidden font-medium"
                      placeholder="Enter the announcement string displayed on accounts page..."
                    />
                  </div>

                  <div className="border-t border-[#142d4a] pt-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-teal-400 mb-4 flex items-center gap-1.5">
                      <Globe size={14} />
                      <span>Cryptocurrency Administrative Receiving Wallets</span>
                    </h3>
                    
                    <div className="space-y-4">
                      {/* USDT TRC20 Wallet */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">USDT TRC20 Wallet Address</label>
                        <input 
                          type="text" 
                          value={settings.usdt_trc20_address || ''}
                          onChange={(e) => setSettings({ ...settings, usdt_trc20_address: e.target.value })}
                          className="bg-[#06101c] font-mono text-xs p-3 rounded-lg text-slate-100 border border-[#163356] focus:border-[#00c2b2] focus:outline-hidden"
                        />
                      </div>

                      {/* Bitcoin Wallet */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bitcoin Address</label>
                        <input 
                          type="text" 
                          value={settings.btc_address || ''}
                          onChange={(e) => setSettings({ ...settings, btc_address: e.target.value })}
                          className="bg-[#06101c] font-mono text-xs p-3 rounded-lg text-slate-100 border border-[#163356] focus:border-[#00c2b2] focus:outline-hidden"
                        />
                      </div>

                      {/* Ethereum Wallet */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ethereum / ERC-20 Address</label>
                        <input 
                          type="text" 
                          value={settings.eth_address || ''}
                          onChange={(e) => setSettings({ ...settings, eth_address: e.target.value })}
                          className="bg-[#06101c] font-mono text-xs p-3 rounded-lg text-slate-100 border border-[#163356] focus:border-[#00c2b2] focus:outline-hidden"
                        />
                      </div>

                      {/* USDT ERC20 Wallet */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">USDT ERC20 Wallet Address</label>
                        <input 
                          type="text" 
                          value={settings.usdt_erc20_address || ''}
                          onChange={(e) => setSettings({ ...settings, usdt_erc20_address: e.target.value })}
                          className="bg-[#06101c] font-mono text-xs p-3 rounded-lg text-slate-100 border border-[#163356] focus:border-[#00c2b2] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Settings Commit */}
                  <div className="pt-4 flex justify-end">
                    <button 
                      type="submit"
                      className="bg-[#00c2b2] hover:bg-[#00a093] text-white font-bold py-3 px-6 rounded-lg text-xs uppercase tracking-wider shadow-lg transition-transform cursor-pointer"
                    >
                      Synchronize Settings
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}
      </main>

      {/* MODAL 1: EDIT USER BALANCE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#091527] border border-[#1a385e] rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
            
            <div className="flex justify-between items-center pb-2.5 border-b border-[#142d4a] shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase font-display tracking-wide">Adjust User Performance</h3>
                <span className="text-[10px] font-bold text-slate-400 block mt-0.5 truncate max-w-[250px]">Target Profile: {editingUser.username}</span>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Adjustments */}
            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar text-xs font-semibold">
              
              {/* Account Balance */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Account Balance ($)</label>
                <input 
                  type="number" 
                  step="any"
                  value={editedBalance}
                  onChange={(e) => setEditedBalance(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2 rounded-lg text-slate-200 border border-[#153457]"
                />
              </div>

              {/* Active Deposit */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#00c2b2] uppercase tracking-wide font-bold">Active Deposit ($)</label>
                <input 
                  type="number" 
                  step="any"
                  value={editedActiveDeposit}
                  onChange={(e) => setEditedActiveDeposit(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2 rounded-lg text-slate-200 border border-[#153457]"
                />
              </div>

              {/* Total Earned */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-green-400 uppercase tracking-wide font-bold">Earned Total ($)</label>
                <input 
                  type="number" 
                  step="any"
                  value={editedEarned}
                  onChange={(e) => setEditedEarned(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2 rounded-lg text-slate-200 border border-[#153457]"
                />
              </div>

              {/* Pending Withdrawals */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-orange-400 uppercase tracking-wide font-bold">Pending Withdrawal ($)</label>
                <input 
                  type="number" 
                  step="any"
                  value={editedPendingWithdrawal}
                  onChange={(e) => setEditedPendingWithdrawal(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2 rounded-lg text-slate-200 border border-[#153457]"
                />
              </div>

              {/* Total Deposit */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total Deposit ($)</label>
                <input 
                  type="number" 
                  step="any"
                  value={editedTotalDeposit}
                  onChange={(e) => setEditedTotalDeposit(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2 rounded-lg text-slate-200 border border-[#153457]"
                />
              </div>

              {/* Total Withdrawn */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Total Withdrew ($)</label>
                <input 
                  type="number" 
                  step="any"
                  value={editedWithdrew}
                  onChange={(e) => setEditedWithdrew(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2 rounded-lg text-slate-200 border border-[#153457]"
                />
              </div>

            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2 border-t border-[#142d4a]">
              <button 
                onClick={() => setEditingUser(null)}
                className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveUserMetrics}
                className="bg-[#00c2b2] hover:bg-[#00a093] text-xs text-white font-bold px-4 py-2.5 rounded-lg cursor-pointer"
              >
                Apply Adjustments
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: AWARD ADMINISTRATIVE BONUS MODAL */}
      {bonusModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#091527] border border-[#1a385e] rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[95vh]">
            
            <div className="flex justify-between items-center pb-2.5 border-b border-[#142d4a] shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase font-display tracking-widest">Award Bonus Dividend</h3>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Increments account balance & logs activity.</span>
              </div>
              <button 
                onClick={() => setBonusModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleDispenseBonus} className="space-y-4 overflow-y-auto pr-1 max-h-[70vh] text-xs font-semibold">
              
              {/* Select User */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Recipient</label>
                {bonusUser ? (
                  <div className="bg-[#06101c] text-xs p-2.5 rounded-lg text-sky-400 font-semibold border border-[#153457] flex justify-between items-center">
                    <span>{users.find(u => u.uid === bonusUser)?.username || bonusUser}</span>
                    <button 
                      type="button" 
                      onClick={() => setBonusUser('')}
                      className="text-[10px] hover:text-red-400 underline font-bold"
                    >
                      Reset / Select Another
                    </button>
                  </div>
                ) : (
                  <select 
                    value={bonusUser}
                    onChange={(e) => setBonusUser(e.target.value)}
                    className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457] font-semibold text-sky-400 font-semibold"
                    required
                  >
                    <option value="">-- Choose Account --</option>
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>{u.username} (${u.accountBalance.toFixed(2)})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Bonus Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Dividend Sum ($)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 150"
                  step="any"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  className="bg-[#06101c] text-xs font-mono p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                  required
                />
              </div>

              {/* Processor Wallet type */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Processor Ledger Key</label>
                <select 
                  value={bonusProcessor}
                  onChange={(e) => setBonusProcessor(e.target.value as any)}
                  className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                >
                  <option value="USDT TRC20">USDT TRC20</option>
                  <option value="Bitcoin">Bitcoin (BTC)</option>
                  <option value="Ethereum">Ethereum (ETH)</option>
                  <option value="USDT ERC20">USDT ERC20</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-[#142d4a]">
                <button 
                  type="button"
                  onClick={() => setBonusModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-xs text-white font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Commit Bonus Dividend
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2.5: ADD ADMINISTRATIVE MONEY MODAL */}
      {addMoneyModalOpen && (
        <div id="add-money-modal" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#091527] border border-[#1a385e] rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[95vh]">
            
            <div className="flex justify-between items-center pb-2.5 border-b border-[#142d4a] shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase font-display tracking-widest">Adjust Balance Ledger</h3>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Deposit, award profit, or reduce balance directly.</span>
              </div>
              <button 
                onClick={() => setAddMoneyModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleDispenseMoney} className="space-y-4 overflow-y-auto pr-1 max-h-[70vh] text-xs font-semibold">
              
              {/* Select User */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Recipient</label>
                {addMoneyUser ? (
                  <div className="bg-[#06101c] text-xs p-2.5 rounded-lg text-teal-400 font-semibold border border-[#153457] flex justify-between items-center">
                    <span>{users.find(u => u.uid === addMoneyUser)?.username || addMoneyUser}</span>
                    <button 
                      type="button" 
                      onClick={() => setAddMoneyUser('')}
                      className="text-[10px] hover:text-red-400 underline font-bold"
                    >
                      Reset / Select Another
                    </button>
                  </div>
                ) : (
                  <select 
                    value={addMoneyUser}
                    onChange={(e) => setAddMoneyUser(e.target.value)}
                    className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457] font-semibold"
                    required
                  >
                    <option value="">-- Choose Account --</option>
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>{u.username} (${u.accountBalance.toFixed(2)})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Operation type select toggles */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ledger Operation Type</label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#06101c] p-1.5 rounded-lg border border-[#153457]">
                  <button
                    type="button"
                    onClick={() => setAddMoneyType('Deposit')}
                    className={`py-2 px-1 text-[9px] uppercase font-black tracking-wider rounded-md transition-all cursor-pointer ${addMoneyType === 'Deposit' ? 'bg-[#00c2b2] text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    Add Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMoneyType('Profit')}
                    className={`py-2 px-1 text-[9px] uppercase font-black tracking-wider rounded-md transition-all cursor-pointer ${addMoneyType === 'Profit' ? 'bg-[#00c2b2] text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    Add Profit
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMoneyType('Reduce')}
                    className={`py-2 px-1 text-[9px] uppercase font-black tracking-wider rounded-md transition-all cursor-pointer ${addMoneyType === 'Reduce' ? 'bg-red-500 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'}`}
                  >
                    Reduce Bal
                  </button>
                </div>
              </div>

              {/* Money Amount */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {addMoneyType === 'Reduce' ? "Amount to Deduct ($)" : "Amount to Credit ($)"}
                </label>
                <input 
                  type="number" 
                  placeholder="e.g. 500"
                  step="any"
                  value={addMoneyAmount}
                  onChange={(e) => setAddMoneyAmount(e.target.value)}
                  className="bg-[#06101c] text-xs font-mono p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                  required
                />
              </div>

              {/* Processor Wallet type */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Processor Ledger Key & Network</label>
                <select 
                  value={addMoneyProcessor}
                  onChange={(e) => setAddMoneyProcessor(e.target.value as any)}
                  className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                >
                  <option value="USDT TRC20">USDT TRC20</option>
                  <option value="Bitcoin">Bitcoin (BTC)</option>
                  <option value="Ethereum">Ethereum (ETH)</option>
                  <option value="USDT ERC20">USDT ERC20</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-[#142d4a]">
                <button 
                  type="button"
                  onClick={() => setAddMoneyModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`text-xs text-slate-950 font-black uppercase tracking-wider px-4 py-2.5 rounded-lg cursor-pointer ${addMoneyType === 'Reduce' ? 'bg-red-400 hover:bg-red-500 text-slate-950' : 'bg-[#00c2b2] hover:bg-[#00e0cf]'}`}
                >
                  {addMoneyType === 'Reduce' ? "Execute Deduction" : "Confirm Ledger Credit"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2.6: ADD USER MODAL */}
      {addUserModalOpen && (
        <div id="add-user-modal" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#091527] border border-[#1a385e] rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[95vh]">
            
            <div className="flex justify-between items-center pb-2.5 border-b border-[#142d4a] shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase font-display tracking-widest">Create New User Profile</h3>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Creates a brand-new registered client directory.</span>
              </div>
              <button 
                onClick={() => setAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 overflow-y-auto pr-1 max-h-[70vh] text-xs font-semibold">
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client Username</label>
                <input 
                  type="text" 
                  placeholder="e.g. janesmith"
                  value={addUserName}
                  onChange={(e) => setAddUserName(e.target.value)}
                  className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Client Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Jane Smith"
                  value={addUserFullName}
                  onChange={(e) => setAddUserFullName(e.target.value)}
                  className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. jane@company.com"
                  value={addUserEmail}
                  onChange={(e) => setAddUserEmail(e.target.value)}
                  className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Initial Balance Credit ($)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1000"
                  value={addUserInitialBalance}
                  onChange={(e) => setAddUserInitialBalance(e.target.value)}
                  className="bg-[#06101c] text-xs font-mono p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                />
                <span className="text-[9px] text-slate-500 font-normal">If above 0, an initial Deposit ledger record will be created automatically.</span>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-[#142d4a]">
                <button 
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#00c2b2] hover:bg-[#00e0cf] text-slate-950 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Create Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2.7: UNIFIED MANAGE USER MODAL (Edit / Suspend / Delete Info) */}
      {manageUserModalOpen && selectedManageUser && (
        <div id="manage-user-modal" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#091527] border border-[#1a385e] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[95vh]">
            
            <div className="flex justify-between items-center pb-2.5 border-b border-[#142d4a] shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase font-display tracking-widest text-[#00c2b2]">Manage Client Account</h3>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Edit credentials, configure wallets, suspend or delete account.</span>
              </div>
              <button 
                onClick={() => {
                  setManageUserModalOpen(false);
                  setSelectedManageUser(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateManagedProfile} className="space-y-4 overflow-y-auto pr-1 max-h-[70vh] text-xs font-semibold">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Username</label>
                  <input 
                    type="text" 
                    value={editUserUsername}
                    onChange={(e) => setEditUserUsername(e.target.value)}
                    className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                  <input 
                    type="text" 
                    value={editUserFullName}
                    onChange={(e) => setEditUserFullName(e.target.value)}
                    className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                  required
                />
              </div>

              {/* Wallet fields configuration */}
              <div className="p-3 bg-[#06101c]/60 rounded-xl border border-[#142d4a]/80 space-y-3.5">
                <span className="text-[9px] uppercase font-black text-[#00c2b2] tracking-wider block border-b border-[#142d4a]/50 pb-1">Client Receiving Wallets</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">USDT TRC20 Address</label>
                    <input 
                      type="text" 
                      placeholder="TRC20 Wallet"
                      value={editUserUSDT}
                      onChange={(e) => setEditUserUSDT(e.target.value)}
                      className="bg-[#040c16] text-[11px] font-mono p-2 rounded-lg text-slate-200 border border-[#11263f]"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Bitcoin Address</label>
                    <input 
                      type="text" 
                      placeholder="Bitcoin Address"
                      value={editUserBTC}
                      onChange={(e) => setEditUserBTC(e.target.value)}
                      className="bg-[#040c16] text-[11px] font-mono p-2 rounded-lg text-slate-200 border border-[#11263f]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Ethereum Address</label>
                    <input 
                      type="text" 
                      placeholder="Ethereum Address"
                      value={editUserETH}
                      onChange={(e) => setEditUserETH(e.target.value)}
                      className="bg-[#040c16] text-[11px] font-mono p-2 rounded-lg text-slate-200 border border-[#11263f]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">USDT ERC20 Address</label>
                    <input 
                      type="text" 
                      placeholder="ERC20 Wallet"
                      value={editUserUSDT_ERC20}
                      onChange={(e) => setEditUserUSDT_ERC20(e.target.value)}
                      className="bg-[#040c16] text-[11px] font-mono p-2 rounded-lg text-slate-200 border border-[#11263f]"
                    />
                  </div>
                </div>
              </div>

              {/* Suspension Toggle */}
              <div className="p-3 rounded-xl border border-red-500/10 bg-red-950/15 flex items-center justify-between gap-3 animate-pulse">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-red-400 block tracking-wider">Administrative Session Lock</span>
                  <span className="text-[9px] text-slate-400 font-semibold block leading-tight">If active, this account is restricted from accessing backoffice widgets immediately.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditUserSuspended(!editUserSuspended)}
                  className={`px-3 py-2 text-[10px] uppercase font-black rounded-lg transition-all cursor-pointer border ${editUserSuspended ? 'bg-red-500 text-white border-red-400' : 'bg-transparent text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'}`}
                >
                  {editUserSuspended ? "SUSPENDED" : "ACTIVE"}
                </button>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-between pt-3 border-t border-[#142d4a]">
                <button 
                  type="button"
                  onClick={() => handleRemoveUser(selectedManageUser.uid || '')}
                  className="bg-red-950/70 text-red-400 hover:bg-red-900/60 text-xs font-bold px-4 py-2.5 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-500/20"
                >
                  <Trash2 size={13} />
                  <span>Delete Client Account</span>
                </button>

                <div className="flex gap-2 justify-end">
                  <button 
                    type="button"
                    onClick={() => {
                      setManageUserModalOpen(false);
                      setSelectedManageUser(null);
                    }}
                    className="bg-slate-850 text-slate-300 hover:bg-slate-850 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-500 text-slate-100 text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD/EDIT INVESTMENT PLAN MODAL */}
      {planFormOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#091527] border border-[#1a385e] rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
            
            <div className="flex justify-between items-center pb-2.5 border-b border-[#142d4a] shrink-0">
              <div>
                <h3 className="text-sm font-black text-white uppercase font-display tracking-widest">
                  {editingPlan ? "Amend Package Plan" : "Create New Plan"}
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Parameters list dynamic yielding rates.</span>
              </div>
              <button 
                onClick={() => {
                  setPlanFormOpen(false);
                  setEditingPlan(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3 overflow-y-auto pr-1 max-h-[60vh] text-xs font-semibold">
              
              {/* Plan Title */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Plan Name / Label</label>
                <input 
                  type="text" 
                  placeholder="e.g. ULTRA HOUR TO 84H"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457] font-semibold"
                  required
                />
              </div>

              {/* Min Principal */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Min Principal ($)</label>
                <input 
                  type="number" 
                  value={planMin}
                  onChange={(e) => setPlanMin(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                  required
                />
              </div>

              {/* Max Principal */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Max Principal ($)</label>
                <input 
                  type="number" 
                  value={planMax}
                  onChange={(e) => setPlanMax(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                  required
                />
              </div>

              {/* ROI percentage */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Total Return (ROI %)</label>
                <input 
                  type="number" 
                  value={planRoi}
                  onChange={(e) => setPlanRoi(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2.5 rounded-lg text-slate-100 border border-[#153457] font-bold text-yellow-500"
                  required
                />
              </div>

              {/* Term term in days */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Maturity Term (Days)</label>
                <input 
                  type="number" 
                  step="any"
                  value={planTerm}
                  onChange={(e) => setPlanTerm(Number(e.target.value))}
                  className="bg-[#06101c] text-xs font-mono p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                  required
                />
              </div>

              {/* Display text */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Rate subtitle text</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1.5% HOURLY (auto-computed if empty)"
                  value={planRateText}
                  onChange={(e) => setPlanRateText(e.target.value)}
                  className="bg-[#06101c] text-xs p-2.5 rounded-lg text-slate-100 border border-[#153457]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-[#142d4a]">
                <button 
                  type="button"
                  onClick={() => {
                    setPlanFormOpen(false);
                    setEditingPlan(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#00c2b2] hover:bg-[#00a093] text-xs text-white font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  {editingPlan ? "Amend Package" : "Publish Package"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
