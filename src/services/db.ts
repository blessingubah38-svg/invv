import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserState, Deposit, Withdrawal, Transaction, InvestmentPlan } from '../types';

// Let's determine if Firebase is configured with active credentials
export const isFirebaseReady = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'placeholder-api-key';

/**
 * Creates a default mockup state for new or fresh users
 */
export const getDefaultUserMetrics = (userEmail: string, username: string, fullName: string, customWallets?: any): UserState => ({
  isLoggedIn: true,
  username: username || userEmail.split('@')[0],
  fullName: fullName || username || userEmail.split('@')[0],
  email: userEmail,
  wallets: {
    usdtTrc20: customWallets?.usdtTrc20 || '',
    bitcoin: customWallets?.bitcoin || '',
    ethereum: customWallets?.ethereum || '',
    usdtErc20: customWallets?.usdtErc20 || ''
  },
  accountBalance: 0,
  earnedTotal: 0,
  pendingWithdrawal: 0,
  totalWithdrew: 0,
  activeDeposit: 0,
  lastDeposit: 0,
  totalDeposit: 0,
  lastWithdrawal: 0,
  profilePhoto: ''
});

/**
 * Saves or updates a User Profile document in Firestore
 */
export async function saveUserProfile(uid: string, profile: UserState): Promise<void> {
  // Always reserve/write in Local Storage as well for fast client-side performance and seamless live fallbacks
  localStorage.setItem(`user_profile_${uid}`, JSON.stringify(profile));

  if (!isFirebaseReady) {
    return;
  }

  const userPath = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    // Include security key check mapping with model format
    await setDoc(docRef, {
      uid,
      username: profile.username,
      fullName: profile.fullName,
      email: profile.email,
      accountBalance: Number(profile.accountBalance) || 0,
      earnedTotal: Number(profile.earnedTotal) || 0,
      pendingWithdrawal: Number(profile.pendingWithdrawal) || 0,
      totalWithdrew: Number(profile.totalWithdrew) || 0,
      activeDeposit: Number(profile.activeDeposit) || 0,
      lastDeposit: Number(profile.lastDeposit) || 0,
      totalDeposit: Number(profile.totalDeposit) || 0,
      lastWithdrawal: profile.lastWithdrawal !== undefined ? profile.lastWithdrawal : 0,
      usdtTrc20: profile.wallets.usdtTrc20 || '',
      bitcoin: profile.wallets.bitcoin || '',
      ethereum: profile.wallets.ethereum || '',
      usdtErc20: profile.wallets.usdtErc20 || '',
      profilePhoto: profile.profilePhoto || ''
    });
  } catch (error) {
    console.error("Firestore user write error:", error);
  }
}

/**
 * Fetches a User Profile document from Firestore
 */
export async function fetchUserProfile(uid: string): Promise<UserState | null> {
  let profile: UserState | null = null;

  // 1. First, try reading from Firestore if active
  if (isFirebaseReady) {
    const userPath = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        profile = {
          isLoggedIn: true,
          username: data.username || '',
          fullName: data.fullName || '',
          email: data.email || '',
          wallets: {
            usdtTrc20: data.usdtTrc20 || '',
            bitcoin: data.bitcoin || '',
            ethereum: data.ethereum || '',
            usdtErc20: data.usdtErc20 || ''
          },
          accountBalance: Number(data.accountBalance) || 0,
          earnedTotal: Number(data.earnedTotal) || 0,
          pendingWithdrawal: Number(data.pendingWithdrawal) || 0,
          totalWithdrew: Number(data.totalWithdrew) || 0,
          activeDeposit: Number(data.activeDeposit) || 0,
          lastDeposit: Number(data.lastDeposit) || 0,
          totalDeposit: Number(data.totalDeposit) || 0,
          lastWithdrawal: data.lastWithdrawal !== undefined ? data.lastWithdrawal : 0,
          profilePhoto: data.profilePhoto || '',
          uid: uid
        };
      }
    } catch (error) {
      console.warn("Firestore fetchUserProfile error:", error);
    }
  }

  // 2. Try recovering/syncing with standard local storage configuration cache
  const cached = localStorage.getItem(`user_profile_${uid}`);
  if (cached) {
    try {
      const cachedProfile = JSON.parse(cached);
      if (cachedProfile) {
        if (!profile) {
          profile = { ...cachedProfile, uid };
        } else {
          // Sync wallets if missing in Firestore but present locally
          profile.wallets = {
            usdtTrc20: profile.wallets.usdtTrc20 || cachedProfile.wallets?.usdtTrc20 || '',
            bitcoin: profile.wallets.bitcoin || cachedProfile.wallets?.bitcoin || '',
            ethereum: profile.wallets.ethereum || cachedProfile.wallets?.ethereum || '',
            usdtErc20: profile.wallets.usdtErc20 || cachedProfile.wallets?.usdtErc20 || ''
          };
          profile.profilePhoto = profile.profilePhoto || cachedProfile.profilePhoto || '';
        }
      }
    } catch (e) {}
  }

  // Keep local system coordinates in sync
  if (profile) {
    localStorage.setItem(`user_profile_${uid}`, JSON.stringify(profile));
  }

  return profile;
}

/**
 * Logs a new deposit record persistently
 */
export async function addDepositRecord(uid: string, d: Deposit): Promise<void> {
  const depositId = d.id || `dep_${Date.now()}`;
  
  // Standard local storage synchronization
  const list = JSON.parse(localStorage.getItem(`deposits_${uid}`) || '[]');
  if (!list.some((existing: any) => existing.id === depositId)) {
    list.push({ ...d, id: depositId, userId: uid });
    localStorage.setItem(`deposits_${uid}`, JSON.stringify(list));
  }

  if (!isFirebaseReady) {
    return;
  }

  const path = `deposits/${depositId}`;
  try {
    await setDoc(doc(db, 'deposits', depositId), {
      id: depositId,
      userId: uid,
      username: d.username,
      amount: Number(d.amount),
      date: d.date,
      processor: d.processor,
      planId: d.planId || 'p1',
      planName: d.planName || '10 DAYS 6% DAILY',
      timestamp: d.timestamp || Date.now(),
      roi: d.roi || 160,
      term: d.term || 10
    });
  } catch (error) {
    console.error("Firestore deposit write error:", error);
  }
}

/**
 * Logs a new withdrawal record persistently
 */
export async function addWithdrawalRecord(uid: string, w: Withdrawal): Promise<void> {
  const withdrawalId = w.id || `with_${Date.now()}`;
  const now = Date.now();
  const createdAtVal = w.createdAt || now;
  const approvedAtVal = w.status === 'Approved' ? (w.approvedAt || now) : (w.approvedAt || null);

  // Standard local storage synchronization
  const list = JSON.parse(localStorage.getItem(`withdrawals_${uid}`) || '[]');
  if (!list.some((existing: any) => existing.id === withdrawalId)) {
    list.push({ 
      ...w, 
      id: withdrawalId, 
      userId: uid, 
      status: w.status || 'Pending',
      createdAt: createdAtVal,
      approvedAt: approvedAtVal
    });
    localStorage.setItem(`withdrawals_${uid}`, JSON.stringify(list));
  }

  if (!isFirebaseReady) {
    return;
  }

  const path = `users/${uid}/withdrawals/${withdrawalId}`;
  try {
    const docRef = doc(db, 'users', uid, 'withdrawals', withdrawalId);
    await setDoc(docRef, {
      id: withdrawalId,
      userId: uid,
      username: w.username,
      amount: Number(w.amount),
      date: w.date,
      processor: w.processor,
      status: w.status || 'Pending',
      timestamp: w.timestamp || now,
      createdAt: createdAtVal,
      approvedAt: approvedAtVal
    });
  } catch (error) {
    console.error("Firestore withdrawal write error:", error);
  }
}

/**
 * Updates a withdrawal record's status in Firestore
 */
export async function updateWithdrawalStatus(uid: string, withdrawalId: string, status: 'Pending' | 'Approved' | 'Rejected'): Promise<void> {
  const now = Date.now();
  const approvedAtVal = status === 'Approved' ? now : null;

  // Standard local storage synchronization
  const key = `withdrawals_${uid}`;
  const listStr = localStorage.getItem(key);
  if (listStr) {
    try {
      const list = JSON.parse(listStr);
      const foundIdx = list.findIndex((w: any) => w.id === withdrawalId);
      if (foundIdx !== -1) {
        list[foundIdx].status = status;
        list[foundIdx].approvedAt = approvedAtVal;
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch (e) {}
  }

  if (!isFirebaseReady) {
    return;
  }

  const path = `users/${uid}/withdrawals/${withdrawalId}`;
  try {
    const docRef = doc(db, 'users', uid, 'withdrawals', withdrawalId);
    await setDoc(docRef, { 
      status, 
      approvedAt: approvedAtVal 
    }, { merge: true });
  } catch (error) {
    console.error("Firestore updateWithdrawalStatus error:", error);
  }
}

/**
 * Fetches user's deposits history
 */
export async function getUserDeposits(uid: string): Promise<Deposit[]> {
  const localList = JSON.parse(localStorage.getItem(`deposits_${uid}`) || '[]');
  const records: Deposit[] = [];

  if (isFirebaseReady) {
    try {
      const q = query(collection(db, 'deposits'), where('userId', '==', uid));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: data.id || docSnap.id,
          userId: data.userId || uid,
          username: data.username || '',
          amount: Number(data.amount) || 0,
          date: data.date || '',
          processor: data.processor || 'USDT TRC20',
          planId: data.planId || 'p1',
          planName: data.planName || '10 DAYS 6% DAILY',
          timestamp: data.timestamp || Date.now(),
          roi: Number(data.roi) || 160,
          term: Number(data.term) || 10
        });
      });
    } catch (error) {
      console.warn("Firestore getUserDeposits error:", error);
    }
  }

  const mergedMap = new Map<string, Deposit>();
  localList.forEach((d: Deposit) => {
    if (d && d.id) mergedMap.set(d.id, d);
  });
  records.forEach((d: Deposit) => {
    if (d && d.id) mergedMap.set(d.id, d);
  });

  return Array.from(mergedMap.values());
}

/**
 * Fetches user's withdrawals history
 */
export async function getUserWithdrawals(uid: string): Promise<Withdrawal[]> {
  const localList = JSON.parse(localStorage.getItem(`withdrawals_${uid}`) || '[]');
  const records: Withdrawal[] = [];

  if (isFirebaseReady) {
    try {
      const q = query(collection(db, 'users', uid, 'withdrawals'));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: data.id || docSnap.id,
          userId: data.userId || uid,
          username: data.username || '',
          amount: Number(data.amount) || 0,
          date: data.date || '',
          processor: data.processor || 'USDT TRC20',
          status: data.status || 'Pending',
          timestamp: data.timestamp || Date.now(),
          createdAt: data.createdAt || data.timestamp || Date.now(),
          approvedAt: data.approvedAt || null
        });
      });
    } catch (error) {
      console.warn("Firestore getUserWithdrawals error:", error);
    }
  }

  const mergedMap = new Map<string, Withdrawal>();
  localList.forEach((w: Withdrawal) => {
    if (w && w.id) mergedMap.set(w.id, w);
  });
  records.forEach((w: Withdrawal) => {
    if (w && w.id) mergedMap.set(w.id, w);
  });

  return Array.from(mergedMap.values());
}

/**
 * Add a transaction log record
 */
export async function addTransactionRecord(uid: string, t: Partial<Transaction>): Promise<void> {
  const transactionId = t.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const now = Date.now();
  const createdAtVal = t.createdAt || now;
  const approvedAtVal = t.status === 'Approved' ? (t.approvedAt || now) : (t.approvedAt || null);

  // Standard local storage synchronization
  const list = JSON.parse(localStorage.getItem(`transactions_${uid}`) || '[]');
  if (!list.some((existing: any) => existing.id === transactionId)) {
    list.push({ 
      ...t, 
      id: transactionId, 
      userId: uid,
      createdAt: createdAtVal,
      approvedAt: approvedAtVal,
      timestamp: t.timestamp || now,
      status: t.status || 'Approved'
    });
    localStorage.setItem(`transactions_${uid}`, JSON.stringify(list));
  }

  if (!isFirebaseReady) {
    return;
  }

  const path = `transactions/${transactionId}`;
  try {
    await setDoc(doc(db, 'transactions', transactionId), {
      id: transactionId,
      userId: uid,
      username: t.username || '',
      type: t.type || 'Deposit',
      amount: Number(t.amount) || 0,
      date: t.date || new Date().toISOString(),
      timestamp: t.timestamp || now,
      status: t.status || 'Approved',
      processor: t.processor || 'USDT TRC20',
      createdAt: createdAtVal,
      approvedAt: approvedAtVal,
      ...(t.planId && { planId: t.planId }),
      ...(t.planName && { planName: t.planName }),
      ...(t.term && { term: Number(t.term) }),
      ...(t.roi && { roi: Number(t.roi) }),
      ...(t.referenceId && { referenceId: t.referenceId }),
      ...(t.txHash && { txHash: t.txHash }),
      ...(t.paymentProof && { paymentProof: t.paymentProof })
    });
  } catch (error) {
    console.error("Firestore transaction write error:", error);
  }
}

/**
 * Retrieve transactions for a user
 */
export async function getUserTransactions(uid: string): Promise<Transaction[]> {
  const localList = JSON.parse(localStorage.getItem(`transactions_${uid}`) || '[]');
  const records: Transaction[] = [];

  if (isFirebaseReady) {
    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', uid));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: data.id || docSnap.id,
          userId: data.userId || uid,
          username: data.username || '',
          type: data.type || 'Deposit',
          amount: Number(data.amount) || 0,
          date: data.date || '',
          timestamp: Number(data.timestamp) || Date.now(),
          status: data.status || 'Approved',
          processor: data.processor || 'USDT TRC20',
          planId: data.planId,
          planName: data.planName,
          term: data.term ? Number(data.term) : undefined,
          roi: data.roi ? Number(data.roi) : undefined,
          referenceId: data.referenceId,
          createdAt: data.createdAt || Number(data.timestamp) || Date.now(),
          approvedAt: data.approvedAt || null,
          txHash: data.txHash,
          paymentProof: data.paymentProof
        });
      });
    } catch (error) {
      console.warn("Firestore getUserTransactions error:", error);
    }
  }

  const mergedMap = new Map<string, Transaction>();
  localList.forEach((tx: Transaction) => {
    if (tx && tx.id) mergedMap.set(tx.id, tx);
  });
  records.forEach((tx: Transaction) => {
    if (tx && tx.id) mergedMap.set(tx.id, tx);
  });

  return Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Updates a transaction record's status in Firestore
 */
export async function updateTransactionStatus(transactionId: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'): Promise<void> {
  const now = Date.now();
  const approvedAtVal = (status === 'Approved' || status === 'Completed') ? now : null;

  // Always sync status within local storage to keep dashboards aligned instantly
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('transactions_')) {
      const listStr = localStorage.getItem(key);
      if (listStr) {
        try {
          const list = JSON.parse(listStr);
          const foundIdx = list.findIndex((t: any) => t.id === transactionId);
          if (foundIdx !== -1) {
            list[foundIdx].status = status;
            list[foundIdx].approvedAt = approvedAtVal;
            localStorage.setItem(key, JSON.stringify(list));
            break;
          }
        } catch (e) {}
      }
    }
  }

  if (!isFirebaseReady) {
    return;
  }

  const path = `transactions/${transactionId}`;
  try {
    const docRef = doc(db, 'transactions', transactionId);
    await setDoc(docRef, { 
      status, 
      approvedAt: approvedAtVal 
    }, { merge: true });
  } catch (error) {
    console.error("Firestore updateTransactionStatus error:", error);
  }
}

/**
 * Retrieve all transactions across the entire system (for admin dashboard)
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  const records: Transaction[] = [];

  if (isFirebaseReady) {
    try {
      const q = query(collection(db, 'transactions'));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: data.id || docSnap.id,
          userId: data.userId || '',
          username: data.username || '',
          type: data.type || 'Deposit',
          amount: Number(data.amount) || 0,
          date: data.date || '',
          timestamp: Number(data.timestamp) || Date.now(),
          status: data.status || 'Approved',
          processor: data.processor || 'USDT TRC20',
          planId: data.planId,
          planName: data.planName,
          term: data.term ? Number(data.term) : undefined,
          roi: data.roi ? Number(data.roi) : undefined,
          referenceId: data.referenceId,
          createdAt: data.createdAt || Number(data.timestamp) || Date.now(),
          approvedAt: data.approvedAt || null,
          txHash: data.txHash,
          paymentProof: data.paymentProof
        });
      });
    } catch (error) {
      console.warn("Firestore getAllTransactions error:", error);
    }
  }

  // Aggregate matches from all users' local storages
  const localTransactions: Transaction[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('transactions_')) {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(list)) {
          localTransactions.push(...list);
        }
      } catch (e) {}
    }
  }

  const mergedMap = new Map<string, Transaction>();
  localTransactions.forEach(tx => {
    if (tx && tx.id) mergedMap.set(tx.id, tx);
  });
  records.forEach(tx => {
    if (tx && tx.id) mergedMap.set(tx.id, tx);
  });

  return Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Add a dynamic investment plan (Admin feature)
 */
export async function addInvestmentPlan(plan: InvestmentPlan): Promise<void> {
  if (!isFirebaseReady) {
    const list = JSON.parse(localStorage.getItem('investment_plans') || '[]');
    list.push(plan);
    localStorage.setItem('investment_plans', JSON.stringify(list));
    return;
  }

  const path = `plans/${plan.id}`;
  try {
    await setDoc(doc(db, 'plans', plan.id), {
      id: plan.id,
      name: plan.name,
      min: Number(plan.min),
      max: Number(plan.max),
      roi: Number(plan.roi),
      term: Number(plan.term),
      dailyRateText: plan.dailyRateText || '',
      hourlyRateText: plan.hourlyRateText || ''
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch all investment plans (User/Admin)
 */
export async function getInvestmentPlans(): Promise<InvestmentPlan[]> {
  const defaultPlans: InvestmentPlan[] = [
    {
      id: 'plan_84h',
      name: 'EVERY HOUR FOR 84H',
      min: 10,
      max: 500,
      roi: 101.2,
      term: 3.5,
      dailyRateText: '1.2% HOURLY',
      hourlyRateText: 'Every Hour'
    },
    {
      id: 'plan_66h',
      name: 'EVERY HOUR FOR 66H',
      min: 100,
      max: 500,
      roi: 102.2,
      term: 2.75,
      dailyRateText: '2.2% HOURLY',
      hourlyRateText: 'Every Hour'
    },
    {
      id: 'plan_44h',
      name: 'EVERY HOUR FOR 44H',
      min: 100,
      max: 1000,
      roi: 104.2,
      term: 1.83,
      dailyRateText: '4.2% HOURLY',
      hourlyRateText: 'Every Hour'
    }
  ];

  if (!isFirebaseReady) {
    const list = JSON.parse(localStorage.getItem('investment_plans') || '[]');
    return list.length > 0 ? list : defaultPlans;
  }

  const path = 'plans';
  try {
    const q = query(collection(db, 'plans'));
    const snap = await getDocs(q);
    const records: InvestmentPlan[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      records.push({
        id: data.id || docSnap.id,
        name: data.name || '',
        min: Number(data.min) || 0,
        max: Number(data.max) || 0,
        roi: Number(data.roi) || 0,
        term: Number(data.term) || 0,
        dailyRateText: data.dailyRateText || '',
        hourlyRateText: data.hourlyRateText || ''
      });
    });
    return records.length > 0 ? records : defaultPlans;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return defaultPlans;
  }
}

/**
 * Fetch all registered users across the system (for admin dashboard user targeting)
 */
export async function getAllUsers(): Promise<UserState[]> {
  const records: UserState[] = [];

  if (isFirebaseReady) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const uidVal = data.uid || docSnap.id;
        records.push({
          uid: uidVal,
          isLoggedIn: true,
          username: data.username || data.email?.split('@')[0] || '',
          fullName: data.fullName || '',
          email: data.email || '',
          wallets: {
            usdtTrc20: data.usdtTrc20 || '',
            bitcoin: data.bitcoin || '',
            ethereum: data.ethereum || '',
            usdtErc20: data.usdtErc20 || ''
          },
          accountBalance: Number(data.accountBalance) || 0,
          earnedTotal: Number(data.earnedTotal) || 0,
          pendingWithdrawal: Number(data.pendingWithdrawal) || 0,
          totalWithdrew: Number(data.totalWithdrew) || 0,
          activeDeposit: Number(data.activeDeposit) || 0,
          lastDeposit: Number(data.lastDeposit) || 0,
          totalDeposit: Number(data.totalDeposit) || 0,
          lastWithdrawal: data.lastWithdrawal !== undefined ? data.lastWithdrawal : 0,
          profilePhoto: data.profilePhoto || ''
        });
      });
    } catch (error) {
      console.warn("Firestore getAllUsers error:", error);
    }
  }

  // Also read from local storage to merge/fallback
  const localUsers: UserState[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('user_profile_')) {
      try {
        const profile = JSON.parse(localStorage.getItem(key) || '');
        if (profile) {
          const loadedUid = key.replace('user_profile_', '');
          localUsers.push({
            ...profile,
            uid: loadedUid
          });
        }
      } catch (e) {}
    }
  }

  // Merge & Deduplicate by email or username (or uid)
  const mergedMap = new Map<string, UserState>();
  
  // Start with default/generic/simulated ones from requirement if empty
  const defaultUser = {
    uid: 'demo_user',
    isLoggedIn: true,
    username: 'demo_test',
    fullName: 'Demo investor',
    email: 'demo@invest.com',
    wallets: { usdtTrc20: '', bitcoin: '', ethereum: '', usdtErc20: '' },
    accountBalance: 1250,
    earnedTotal: 450,
    pendingWithdrawal: 0,
    totalWithdrew: 100,
    activeDeposit: 300,
    lastDeposit: 100,
    totalDeposit: 1100,
    lastWithdrawal: 0
  };
  mergedMap.set('demo_user', defaultUser);

  localUsers.forEach(u => {
    if (u && u.uid) {
      mergedMap.set(u.uid, u);
    }
  });

  records.forEach(u => {
    if (u && u.uid) {
      mergedMap.set(u.uid, u);
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Delete an investment plan (Admin feature)
 */
export async function deleteInvestmentPlan(planId: string): Promise<void> {
  if (!isFirebaseReady) {
    const list = JSON.parse(localStorage.getItem('investment_plans') || '[]');
    const filtered = list.filter((p: any) => p.id !== planId);
    localStorage.setItem('investment_plans', JSON.stringify(filtered));
    return;
  }

  const path = `plans/${planId}`;
  try {
    await deleteDoc(doc(db, 'plans', planId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Get dynamic global system settings
 */
export async function getSystemSettings(): Promise<any> {
  const defaultSettings = {
    id: 'site',
    announcement: 'Welcome to Chibuike.com Crypto Audit and Investment Platform! Check out our new 84H passive packages.',
    usdt_trc20_address: 'TXtF7rG8p9WKmQz6SJy8L7pG4bXnQwE9Tr',
    btc_address: '1ChibuikeBtcReceiveAddressGzN6SZy8L7',
    eth_address: '0x32165eChibuikeReceiveEthab88b098defB5',
    usdt_erc20_address: '0x32165eChibuikeReceiveEthab88b098defB5',
    updatedAt: Date.now()
  };

  if (!isFirebaseReady) {
    const cached = localStorage.getItem('system_settings');
    return cached ? JSON.parse(cached) : defaultSettings;
  }

  const path = 'settings/site';
  try {
    const docRef = doc(db, 'settings', 'site');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return {
        ...defaultSettings,
        ...snap.data()
      };
    }
    return defaultSettings;
  } catch (error) {
    console.error("Error reading settings: ", error);
    return defaultSettings;
  }
}

/**
 * Save dynamic global system settings (Admin feature)
 */
export async function saveSystemSettings(settings: any): Promise<void> {
  if (!isFirebaseReady) {
    localStorage.setItem('system_settings', JSON.stringify(settings));
    return;
  }

  const path = 'settings/site';
  try {
    const docRef = doc(db, 'settings', 'site');
    await setDoc(docRef, {
      ...settings,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Automatically uploads local storage data to Firestore when Firebase becomes ready and user is signed in
 */
export async function syncLocalDataToFirebase(uid: string, username: string): Promise<void> {
  if (!isFirebaseReady) return;

  try {
    // 1. Sync User Profile
    const localProfileStr = localStorage.getItem(`user_profile_${uid}`);
    if (localProfileStr) {
      const localProfile = JSON.parse(localProfileStr);
      if (localProfile) {
        const remoteProfile = await getDoc(doc(db, 'users', uid));
        if (!remoteProfile.exists()) {
          console.log(`Syncing profile for ${username} to Firestore...`);
          await setDoc(doc(db, 'users', uid), {
            uid,
            username: localProfile.username || username,
            fullName: localProfile.fullName || username,
            email: localProfile.email || '',
            accountBalance: Number(localProfile.accountBalance) || 0,
            earnedTotal: Number(localProfile.earnedTotal) || 0,
            pendingWithdrawal: Number(localProfile.pendingWithdrawal) || 0,
            totalWithdrew: Number(localProfile.totalWithdrew) || 0,
            activeDeposit: Number(localProfile.activeDeposit) || 0,
            lastDeposit: Number(localProfile.lastDeposit) || 0,
            totalDeposit: Number(localProfile.totalDeposit) || 0,
            lastWithdrawal: Number(localProfile.lastWithdrawal) || 0,
            profilePhoto: localProfile.profilePhoto || ''
          });
        }
      }
    }

    // 2. Sync Deposits
    const localDepsStr = localStorage.getItem(`deposits_${uid}`);
    if (localDepsStr) {
      const localDeps = JSON.parse(localDepsStr);
      if (Array.isArray(localDeps)) {
        for (const dep of localDeps) {
          const depId = dep.id || `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const remoteDep = await getDoc(doc(db, 'deposits', depId));
          if (!remoteDep.exists()) {
            console.log(`Syncing deposit ${depId} to Firestore...`);
            await setDoc(doc(db, 'deposits', depId), {
              id: depId,
              userId: uid,
              username: dep.username || username,
              amount: Number(dep.amount) || 0,
              date: dep.date || new Date().toISOString(),
              processor: dep.processor || 'USDT TRC20',
              planId: dep.planId || 'p1',
              planName: dep.planName || '10 DAYS 6% DAILY',
              timestamp: dep.timestamp || Date.now(),
              roi: dep.roi || 160,
              term: dep.term || 10
            });
          }
        }
      }
    }

    // 3. Sync Withdrawals
    const localWithsStr = localStorage.getItem(`withdrawals_${uid}`);
    if (localWithsStr) {
      const localWiths = JSON.parse(localWithsStr);
      if (Array.isArray(localWiths)) {
        for (const wit of localWiths) {
          const witId = wit.id || `with_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const remoteWit = await getDoc(doc(db, 'users', uid, 'withdrawals', witId));
          if (!remoteWit.exists()) {
            console.log(`Syncing withdrawal ${witId} to Firestore...`);
            await setDoc(doc(db, 'users', uid, 'withdrawals', witId), {
              id: witId,
              userId: uid,
              username: wit.username || username,
              amount: Number(wit.amount) || 0,
              date: wit.date || new Date().toISOString(),
              processor: wit.processor || 'USDT TRC20',
              status: wit.status || 'Pending',
              timestamp: wit.timestamp || Date.now(),
              createdAt: wit.createdAt || wit.timestamp || Date.now(),
              approvedAt: wit.approvedAt || null
            });
          }
        }
      }
    }

    // 4. Sync Transactions
    const localTxsStr = localStorage.getItem(`transactions_${uid}`);
    if (localTxsStr) {
      const localTxs = JSON.parse(localTxsStr);
      if (Array.isArray(localTxs)) {
        for (const tx of localTxs) {
          const txId = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const remoteTx = await getDoc(doc(db, 'transactions', txId));
          if (!remoteTx.exists()) {
            console.log(`Syncing transaction ${txId} to Firestore...`);
            await setDoc(doc(db, 'transactions', txId), {
              id: txId,
              userId: uid,
              username: tx.username || username,
              type: tx.type || 'Deposit',
              amount: Number(tx.amount) || 0,
              date: tx.date || new Date().toISOString(),
              timestamp: tx.timestamp || Date.now(),
              status: tx.status || 'Approved',
              processor: tx.processor || 'USDT TRC20',
              createdAt: tx.createdAt || tx.timestamp || Date.now(),
              approvedAt: tx.approvedAt || null,
              ...(tx.planId && { planId: tx.planId }),
              ...(tx.planName && { planName: tx.planName }),
              ...(tx.term && { term: Number(tx.term) }),
              ...(tx.roi && { roi: Number(tx.roi) }),
              ...(tx.referenceId && { referenceId: tx.referenceId }),
              ...(tx.txHash && { txHash: tx.txHash }),
              ...(tx.paymentProof && { paymentProof: tx.paymentProof })
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Background local-to-cloud sync error:", err);
  }
}



