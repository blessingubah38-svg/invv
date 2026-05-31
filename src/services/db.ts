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
  orderBy
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
  if (!isFirebaseReady) {
    localStorage.setItem(`user_profile_${uid}`, JSON.stringify(profile));
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
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

/**
 * Fetches a User Profile document from Firestore
 */
export async function fetchUserProfile(uid: string): Promise<UserState | null> {
  if (!isFirebaseReady) {
    const cached = localStorage.getItem(`user_profile_${uid}`);
    return cached ? JSON.parse(cached) : null;
  }

  const userPath = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
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
        profilePhoto: data.profilePhoto || ''
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
    return null;
  }
}

/**
 * Logs a new deposit record persistently
 */
export async function addDepositRecord(uid: string, d: Deposit): Promise<void> {
  const depositId = `dep_${Date.now()}`;
  if (!isFirebaseReady) {
    const list = JSON.parse(localStorage.getItem(`deposits_${uid}`) || '[]');
    list.push({ ...d, id: depositId, userId: uid });
    localStorage.setItem(`deposits_${uid}`, JSON.stringify(list));
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
    handleFirestoreError(error, OperationType.WRITE, path);
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

  if (!isFirebaseReady) {
    const list = JSON.parse(localStorage.getItem(`withdrawals_${uid}`) || '[]');
    list.push({ 
      ...w, 
      id: withdrawalId, 
      userId: uid, 
      status: w.status || 'Pending',
      createdAt: createdAtVal,
      approvedAt: approvedAtVal
    });
    localStorage.setItem(`withdrawals_${uid}`, JSON.stringify(list));
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
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Updates a withdrawal record's status in Firestore
 */
export async function updateWithdrawalStatus(uid: string, withdrawalId: string, status: 'Pending' | 'Approved' | 'Rejected'): Promise<void> {
  const now = Date.now();
  const approvedAtVal = status === 'Approved' ? now : null;

  if (!isFirebaseReady) {
    const key = `withdrawals_${uid}`;
    const listStr = localStorage.getItem(key);
    if (listStr) {
      const list = JSON.parse(listStr);
      const foundIdx = list.findIndex((w: any) => w.id === withdrawalId);
      if (foundIdx !== -1) {
        list[foundIdx].status = status;
        list[foundIdx].approvedAt = approvedAtVal;
        localStorage.setItem(key, JSON.stringify(list));
      }
    }
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
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches user's deposits history
 */
export async function getUserDeposits(uid: string): Promise<Deposit[]> {
  if (!isFirebaseReady) {
    return JSON.parse(localStorage.getItem(`deposits_${uid}`) || '[]');
  }

  const path = 'deposits';
  try {
    const q = query(collection(db, 'deposits'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const records: Deposit[] = [];
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
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Fetches user's withdrawals history
 */
export async function getUserWithdrawals(uid: string): Promise<Withdrawal[]> {
  if (!isFirebaseReady) {
    return JSON.parse(localStorage.getItem(`withdrawals_${uid}`) || '[]');
  }

  const path = `users/${uid}/withdrawals`;
  try {
    const q = query(collection(db, 'users', uid, 'withdrawals'));
    const snap = await getDocs(q);
    const records: Withdrawal[] = [];
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
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Add a transaction log record
 */
export async function addTransactionRecord(uid: string, t: Partial<Transaction>): Promise<void> {
  const transactionId = t.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const now = Date.now();
  const createdAtVal = t.createdAt || now;
  const approvedAtVal = t.status === 'Approved' ? (t.approvedAt || now) : (t.approvedAt || null);

  if (!isFirebaseReady) {
    const list = JSON.parse(localStorage.getItem(`transactions_${uid}`) || '[]');
    list.push({ 
      ...t, 
      id: transactionId, 
      userId: uid,
      createdAt: createdAtVal,
      approvedAt: approvedAtVal
    });
    localStorage.setItem(`transactions_${uid}`, JSON.stringify(list));
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
      ...(t.referenceId && { referenceId: t.referenceId })
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Retrieve transactions for a user
 */
export async function getUserTransactions(uid: string): Promise<Transaction[]> {
  if (!isFirebaseReady) {
    return JSON.parse(localStorage.getItem(`transactions_${uid}`) || '[]');
  }

  const path = 'transactions';
  try {
    const q = query(collection(db, 'transactions'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const records: Transaction[] = [];
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
        approvedAt: data.approvedAt || null
      });
    });
    return records.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Updates a transaction record's status in Firestore
 */
export async function updateTransactionStatus(transactionId: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'): Promise<void> {
  const now = Date.now();
  const approvedAtVal = (status === 'Approved' || status === 'Completed') ? now : null;

  if (!isFirebaseReady) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('transactions_')) {
        const listStr = localStorage.getItem(key);
        if (listStr) {
          const list = JSON.parse(listStr);
          const foundIdx = list.findIndex((t: any) => t.id === transactionId);
          if (foundIdx !== -1) {
            list[foundIdx].status = status;
            list[foundIdx].approvedAt = approvedAtVal;
            localStorage.setItem(key, JSON.stringify(list));
            break;
          }
        }
      }
    }
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
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Retrieve all transactions across the entire system (for admin dashboard)
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  if (!isFirebaseReady) {
    const all: Transaction[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('transactions_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          all.push(...list);
        } catch (e) {}
      }
    }
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }

  const path = 'transactions';
  try {
    const q = query(collection(db, 'transactions'));
    const snap = await getDocs(q);
    const records: Transaction[] = [];
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
        approvedAt: data.approvedAt || null
      });
    });
    return records.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
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
  if (!isFirebaseReady) {
    // Return current user or simulated ones
    return [
      {
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
      }
    ];
  }

  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    const result: UserState[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const uidVal = data.uid || docSnap.id;
      result.push({
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
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}


