import { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PieChart, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  Clock, 
  Coins, 
  Building2, 
  Smartphone, 
  ChevronRight,
  Layers,
  Percent,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { 
  FinancialPosition, 
  DebtRecord, 
  InvestmentRecord, 
  RecurringCashflow 
} from '../types';

interface WealthBalanceSheetManagerProps {
  onBack?: () => void;
  monthlyExpenseAverage?: number;
}

export default function WealthBalanceSheetManager({ onBack, monthlyExpenseAverage = 0 }: WealthBalanceSheetManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'balances' | 'debts' | 'rnit_investments' | 'recurring'>('overview');

  // Firestore real-time state
  const [position, setPosition] = useState<FinancialPosition | null>(null);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [investments, setInvestments] = useState<InvestmentRecord[]>([]);
  const [cashflows, setCashflows] = useState<RecurringCashflow[]>([]);

  // Starting Liquid Balance Editor modal
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [momoInput, setMomoInput] = useState('');
  const [bankInput, setBankInput] = useState('');
  const [balanceNotes, setBalanceNotes] = useState('');

  // Debt modal states
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [debtType, setDebtType] = useState<'owed_by_me' | 'owed_to_me'>('owed_by_me');
  const [debtCounterparty, setDebtCounterparty] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // Repayment record modal
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);
  const [repayAmount, setRepayAmount] = useState('');

  // Investment modal states
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [invType, setInvType] = useState<'rnit_nav' | 'shares' | 'savings' | 'asset'>('rnit_nav');
  const [invName, setInvName] = useState('RNIT Iterambere Fund');
  const [invUnits, setInvUnits] = useState('');
  const [invBuyPrice, setInvBuyPrice] = useState('');
  const [invCurrentPrice, setInvCurrentPrice] = useState('');
  const [invNotes, setInvNotes] = useState('');

  // RNIT NAV Quick Update & Withdrawal Simulator modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<InvestmentRecord | null>(null);
  const [withdrawUnits, setWithdrawUnits] = useState('');
  const [withdrawNavPrice, setWithdrawNavPrice] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState<'momo' | 'bank' | 'cash'>('momo');

  // Quick NAV update inline modal
  const [showNavUpdateModal, setShowNavUpdateModal] = useState(false);
  const [newNavPrice, setNewNavPrice] = useState('');

  // Recurring Cashflow modal
  const [showCashflowModal, setShowCashflowModal] = useState(false);
  const [cfType, setCfType] = useState<'recurring_income' | 'expected_receivable' | 'recurring_obligation'>('recurring_income');
  const [cfName, setCfName] = useState('');
  const [cfAmount, setCfAmount] = useState('');
  const [cfFrequency, setCfFrequency] = useState<'monthly' | 'weekly' | 'one_time' | 'biweekly'>('monthly');
  const [cfDate, setCfDate] = useState('');
  const [cfNotes, setCfNotes] = useState('');

  // Submitting flags
  const [isSaving, setIsSaving] = useState(false);

  // Firestore Listeners
  useEffect(() => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    // 1. Financial Position (Liquid Balances)
    const qPos = query(collection(db, 'financial_positions'), where('userId', '==', userId));
    const unsubPos = onSnapshot(qPos, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = { id: d.id, ...d.data() } as FinancialPosition;
        setPosition(data);
        setCashInput(String(data.cashOnHand || 0));
        setMomoInput(String(data.mobileMoney || 0));
        setBankInput(String(data.bankBalance || 0));
        setBalanceNotes(data.notes || '');
      } else {
        // Initialize default position
        setPosition({
          id: 'primary',
          userId,
          cashOnHand: 0,
          mobileMoney: 0,
          bankBalance: 0,
          updatedAt: new Date().toISOString()
        });
      }
    });

    // 2. Debts
    const qDebts = query(collection(db, 'debts'), where('userId', '==', userId));
    const unsubDebts = onSnapshot(qDebts, (snap) => {
      setDebts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as DebtRecord[]);
    });

    // 3. Investments (RNIT NAV, Shares, Savings)
    const qInv = query(collection(db, 'investments'), where('userId', '==', userId));
    const unsubInv = onSnapshot(qInv, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as InvestmentRecord[];
      setInvestments(items);
    });

    // 4. Recurring Cashflows & Expected Money
    const qCf = query(collection(db, 'recurring_cashflows'), where('userId', '==', userId));
    const unsubCf = onSnapshot(qCf, (snap) => {
      setCashflows(snap.docs.map(d => ({ id: d.id, ...d.data() })) as RecurringCashflow[]);
    });

    return () => {
      unsubPos();
      unsubDebts();
      unsubInv();
      unsubCf();
    };
  }, []);

  // Compute Wealth Metrics
  const liquidCash = (position?.cashOnHand || 0) + (position?.mobileMoney || 0) + (position?.bankBalance || 0);

  // Investments breakdown
  const rnitInvestments = investments.filter(i => i.type === 'rnit_nav');
  const totalRnitValue = rnitInvestments.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);
  const totalRnitInvested = rnitInvestments.reduce((acc, i) => acc + (Number(i.totalInvested) || 0), 0);
  const rnitProfit = totalRnitValue - totalRnitInvested;

  const sharesInvestments = investments.filter(i => i.type === 'shares');
  const totalSharesValue = sharesInvestments.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);

  const savingsInvestments = investments.filter(i => i.type === 'savings');
  const totalSavingsValue = savingsInvestments.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);

  const physicalAssets = investments.filter(i => i.type === 'asset');
  const totalPhysicalAssetsValue = physicalAssets.reduce((acc, i) => acc + (Number(i.currentValue) || 0), 0);

  const totalInvestmentsAndSavings = totalRnitValue + totalSharesValue + totalSavingsValue + totalPhysicalAssetsValue;

  // Debts breakdown
  const debtsIOwe = debts.filter(d => d.type === 'owed_by_me' && d.status !== 'settled');
  const totalDebtsIOwe = debtsIOwe.reduce((acc, d) => acc + Math.max(0, (Number(d.amount) || 0) - (Number(d.amountPaid) || 0)), 0);

  const debtsOwedToMe = debts.filter(d => d.type === 'owed_to_me' && d.status !== 'settled');
  const totalDebtsOwedToMe = debtsOwedToMe.reduce((acc, d) => acc + Math.max(0, (Number(d.amount) || 0) - (Number(d.amountPaid) || 0)), 0);

  // Total Assets & Net Worth
  const totalAssets = liquidCash + totalInvestmentsAndSavings + totalDebtsOwedToMe;
  const totalLiabilities = totalDebtsIOwe;
  const netWorth = totalAssets - totalLiabilities;

  // Expected Money
  const monthlyRecurringIn = cashflows
    .filter(c => c.type === 'recurring_income')
    .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  const expectedReceivables = cashflows
    .filter(c => c.type === 'expected_receivable' && c.status === 'pending')
    .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // Save Starting Liquid Balances
  const handleSaveBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const posData: Partial<FinancialPosition> = {
        userId: auth.currentUser.uid,
        cashOnHand: parseFloat(cashInput) || 0,
        mobileMoney: parseFloat(momoInput) || 0,
        bankBalance: parseFloat(bankInput) || 0,
        notes: balanceNotes,
        updatedAt: new Date().toISOString()
      };

      if (position?.id && position.id !== 'primary') {
        await updateDoc(doc(db, 'financial_positions', position.id), posData);
      } else {
        await addDoc(collection(db, 'financial_positions'), posData);
      }
      setShowBalanceModal(false);
    } catch (err) {
      console.error('Error saving position:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Debt Record
  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !debtCounterparty.trim() || !debtAmount) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'debts'), {
        userId: auth.currentUser.uid,
        type: debtType,
        counterparty: debtCounterparty.trim(),
        amount: parseFloat(debtAmount) || 0,
        amountPaid: 0,
        dueDate: debtDueDate || null,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: debtNotes.trim()
      });
      setDebtCounterparty('');
      setDebtAmount('');
      setDebtDueDate('');
      setDebtNotes('');
      setShowDebtModal(false);
    } catch (err) {
      console.error('Error creating debt:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Record Repayment on Debt
  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !repayAmount) return;
    const addAmt = parseFloat(repayAmount) || 0;
    const newPaid = (selectedDebt.amountPaid || 0) + addAmt;
    const isFullyPaid = newPaid >= selectedDebt.amount;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'debts', selectedDebt.id), {
        amountPaid: newPaid,
        status: isFullyPaid ? 'settled' : 'partially_paid'
      });
      setShowRepayModal(false);
      setRepayAmount('');
      setSelectedDebt(null);
    } catch (err) {
      console.error('Error updating debt repayment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Debt
  const handleDeleteDebt = async (id: string) => {
    if (!window.confirm('Delete this debt record?')) return;
    try {
      await deleteDoc(doc(db, 'debts', id));
    } catch (err) {
      console.error('Delete debt error:', err);
    }
  };

  // Add Investment / RNIT NAV Fund
  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !invName.trim()) return;
    setIsSaving(true);
    try {
      const units = parseFloat(invUnits) || 1;
      const buyPrice = parseFloat(invBuyPrice) || 0;
      const currPrice = parseFloat(invCurrentPrice) || buyPrice;
      const totalInvested = units * buyPrice;
      const currentValue = units * currPrice;

      await addDoc(collection(db, 'investments'), {
        userId: auth.currentUser.uid,
        type: invType,
        name: invName.trim(),
        units,
        purchasePrice: buyPrice,
        currentPrice: currPrice,
        totalInvested,
        currentValue,
        notes: invNotes.trim()
      });

      setShowInvestmentModal(false);
      setInvUnits('');
      setInvBuyPrice('');
      setInvCurrentPrice('');
      setInvNotes('');
    } catch (err) {
      console.error('Error adding investment:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update Current NAV Price for RNIT
  const handleUpdateCurrentNav = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment || !newNavPrice) return;
    const parsedNav = parseFloat(newNavPrice) || 0;
    if (parsedNav <= 0) return;
    setIsSaving(true);
    try {
      const newCurrentVal = (selectedInvestment.units || 0) * parsedNav;
      await updateDoc(doc(db, 'investments', selectedInvestment.id), {
        currentPrice: parsedNav,
        currentValue: newCurrentVal
      });
      setShowNavUpdateModal(false);
      setSelectedInvestment(null);
      setNewNavPrice('');
    } catch (err) {
      console.error('Error updating NAV:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Execute Withdrawal / Redemption of RNIT Units
  const handleExecuteWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestment || !withdrawUnits) return;
    const unitsToRedeem = parseFloat(withdrawUnits) || 0;
    if (unitsToRedeem <= 0 || unitsToRedeem > selectedInvestment.units) {
      alert('Withdrawal units must be greater than 0 and less than or equal to current units held.');
      return;
    }
    const navPrice = parseFloat(withdrawNavPrice) || selectedInvestment.currentPrice || 0;
    const payoutAmount = unitsToRedeem * navPrice;

    setIsSaving(true);
    try {
      const remainingUnits = selectedInvestment.units - unitsToRedeem;
      const remainingValue = remainingUnits * navPrice;
      // Pro-rated remaining invested capital
      const costPerUnit = selectedInvestment.purchasePrice || 0;
      const remainingInvested = remainingUnits * costPerUnit;

      const withdrawalRecord = {
        date: new Date().toISOString().split('T')[0],
        unitsWithdrawn: unitsToRedeem,
        navPrice,
        amountReceived: payoutAmount,
        note: `Redeemed to ${withdrawDestination.toUpperCase()}`
      };

      const updatedHistory = [...(selectedInvestment.withdrawals || []), withdrawalRecord];

      // Update investment record
      await updateDoc(doc(db, 'investments', selectedInvestment.id), {
        units: remainingUnits,
        currentValue: remainingValue,
        totalInvested: remainingInvested,
        withdrawals: updatedHistory
      });

      // Credit the payout into the selected liquid balance
      if (position) {
        const updatedPos = { ...position };
        if (withdrawDestination === 'momo') {
          updatedPos.mobileMoney = (updatedPos.mobileMoney || 0) + payoutAmount;
        } else if (withdrawDestination === 'bank') {
          updatedPos.bankBalance = (updatedPos.bankBalance || 0) + payoutAmount;
        } else {
          updatedPos.cashOnHand = (updatedPos.cashOnHand || 0) + payoutAmount;
        }
        updatedPos.updatedAt = new Date().toISOString();

        if (position.id && position.id !== 'primary') {
          await updateDoc(doc(db, 'financial_positions', position.id), updatedPos);
        }
      }

      setShowWithdrawModal(false);
      setSelectedInvestment(null);
      setWithdrawUnits('');
      setWithdrawNavPrice('');
      alert(`Successfully withdrew ${unitsToRedeem.toLocaleString()} RNIT units! ${payoutAmount.toLocaleString()} RWF added to your ${withdrawDestination.toUpperCase()} balance.`);
    } catch (err) {
      console.error('Withdrawal execution error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Investment
  const handleDeleteInvestment = async (id: string) => {
    if (!window.confirm('Delete this investment record?')) return;
    try {
      await deleteDoc(doc(db, 'investments', id));
    } catch (err) {
      console.error('Delete investment error:', err);
    }
  };

  // Create Recurring Cashflow
  const handleCreateCashflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !cfName.trim() || !cfAmount) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'recurring_cashflows'), {
        userId: auth.currentUser.uid,
        type: cfType,
        name: cfName.trim(),
        amount: parseFloat(cfAmount) || 0,
        frequency: cfFrequency,
        expectedDate: cfDate || null,
        status: 'pending',
        notes: cfNotes.trim()
      });
      setShowCashflowModal(false);
      setCfName('');
      setCfAmount('');
      setCfDate('');
      setCfNotes('');
    } catch (err) {
      console.error('Error adding cashflow:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Cashflow
  const handleDeleteCashflow = async (id: string) => {
    if (!window.confirm('Delete this cashflow entry?')) return;
    try {
      await deleteDoc(doc(db, 'recurring_cashflows', id));
    } catch (err) {
      console.error('Delete cashflow error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-[#121A2E] p-6 rounded-3xl border border-[#1E293B] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#34D399] shadow-lg shadow-[#10B981]/10">
            <Wallet size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
                Wealth, Debts &amp; RNIT NAV Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30">
                Live Net Worth
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Complete balance sheet: liquid cash, RNIT Iterambere Fund units, debts owed/lent, shares &amp; runway
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBalanceModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#18223A] hover:bg-[#1E293B] text-[#34D399] border border-[#34D399]/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Set starting cash, Mobile Money, and bank account balances"
          >
            <Coins size={14} />
            <span>Update Liquid Balances</span>
          </button>

          <button
            onClick={() => setShowDebtModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#FB7185]/20 hover:bg-[#FB7185]/30 text-[#FB7185] border border-[#FB7185]/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Record a debt you owe or money someone owes you"
          >
            <CreditCard size={14} />
            <span>Log Debt</span>
          </button>

          <button
            onClick={() => {
              setInvType('rnit_nav');
              setInvName('RNIT Iterambere Fund');
              setShowInvestmentModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-[#7C5CFC]/20"
            title="Add RNIT fund units, stocks, or savings"
          >
            <TrendingUp size={14} />
            <span>Add RNIT / Investment</span>
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 rounded-xl bg-[#18223A] hover:bg-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] border border-[#1E293B] transition cursor-pointer"
            >
              Dashboard
            </button>
          )}
        </div>
      </div>

      {/* EXECUTIVE NET WORTH BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Worth */}
        <div className="bg-[#121A2E] p-5 rounded-2xl border border-[#34D399]/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1 font-medium">
            <span>Estimated Net Worth</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] font-mono">
              Assets - Liabilities
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#34D399] tracking-tight">
            {netWorth.toLocaleString()} <span className="text-xs font-semibold text-[#94A3B8]">RWF</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-[#1E293B]">
            <span>Assets: <strong className="text-[#F8FAFC]">{totalAssets.toLocaleString()}</strong></span>
            <span>Debts: <strong className="text-[#FB7185]">{totalLiabilities.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Card 2: Liquid Balances */}
        <div className="bg-[#121A2E] p-5 rounded-2xl border border-[#22D3EE]/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1 font-medium">
            <span>Liquid Cash &amp; MoMo</span>
            <button 
              onClick={() => setShowBalanceModal(true)}
              className="text-[#22D3EE] hover:underline text-[10px] flex items-center gap-0.5 cursor-pointer"
            >
              Edit <Edit3 size={10} />
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#22D3EE] tracking-tight">
            {liquidCash.toLocaleString()} <span className="text-xs font-semibold text-[#94A3B8]">RWF</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-[#1E293B] flex items-center justify-between">
            <span>MoMo: {(position?.mobileMoney || 0).toLocaleString()}</span>
            <span>Bank: {(position?.bankBalance || 0).toLocaleString()}</span>
            <span>Cash: {(position?.cashOnHand || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: RNIT Iterambere Fund & Shares */}
        <div className="bg-[#121A2E] p-5 rounded-2xl border border-[#7C5CFC]/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1 font-medium">
            <span>RNIT &amp; Investments Value</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C5CFC]/20 text-[#A78BFA] font-mono">
              {investments.length} Holdings
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#A78BFA] tracking-tight">
            {totalInvestmentsAndSavings.toLocaleString()} <span className="text-xs font-semibold text-[#94A3B8]">RWF</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-[#1E293B] flex items-center justify-between">
            <span>RNIT: {totalRnitValue.toLocaleString()} RWF</span>
            <span className={rnitProfit >= 0 ? 'text-[#34D399] font-semibold' : 'text-[#FB7185] font-semibold'}>
              {rnitProfit >= 0 ? '+' : ''}{rnitProfit.toLocaleString()} RWF
            </span>
          </div>
        </div>

        {/* Card 4: Debts Ledger Net */}
        <div className="bg-[#121A2E] p-5 rounded-2xl border border-[#FB7185]/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1 font-medium">
            <span>Two-Way Debt Position</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FB7185]/20 text-[#FB7185] font-mono">
              {debtsIOwe.length} Owed / {debtsOwedToMe.length} Lent
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#FB7185] tracking-tight">
            {totalDebtsIOwe.toLocaleString()} <span className="text-xs font-semibold text-[#94A3B8]">RWF Owed</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-2 pt-2 border-t border-[#1E293B] flex items-center justify-between">
            <span className="text-[#34D399]">Owed to me: {totalDebtsOwedToMe.toLocaleString()} RWF</span>
            <button
              onClick={() => {
                setActiveTab('debts');
              }}
              className="text-[#FB7185] hover:underline cursor-pointer"
            >
              View ledger →
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#1E293B]">
        {[
          { id: 'overview', label: 'Financial Balance Sheet', icon: PieChart },
          { id: 'rnit_investments', label: 'RNIT Iterambere Fund & NAV', icon: TrendingUp, badge: rnitInvestments.length },
          { id: 'debts', label: 'Debts Ledger (Owed & Lent)', icon: CreditCard, badge: debts.length },
          { id: 'balances', label: 'Liquid Cash & Accounts', icon: Coins },
          { id: 'recurring', label: 'Expected Money & Receivables', icon: Clock, badge: cashflows.length },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap border ${
                active 
                  ? 'bg-[#7C5CFC] text-white border-[#7C5CFC] shadow-lg shadow-[#7C5CFC]/20' 
                  : 'bg-[#121A2E] text-[#94A3B8] hover:text-[#F8FAFC] border-[#1E293B]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  active ? 'bg-white/20 text-white' : 'bg-[#18223A] text-[#94A3B8]'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: RNIT ITERAMBERE FUND & NAV TRACKER (SPECIALIZED MODULE) */}
      {/* ============================================================== */}
      {(activeTab === 'rnit_investments' || activeTab === 'overview') && (
        <div className="bg-[#121A2E] p-6 rounded-3xl border border-[#1E293B] shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#7C5CFC]/20 text-[#A78BFA] flex items-center justify-center font-bold text-xs">
                  RNIT
                </div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  Rwanda National Investment Trust (RNIT) &amp; Units
                </h3>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Track your Iterambere Fund units, daily NAV price fluctuations, capital appreciation, and withdraw/redeem cash anytime.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setInvType('rnit_nav');
                  setInvName('RNIT Iterambere Fund');
                  setShowInvestmentModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#7C5CFC]/20 hover:bg-[#7C5CFC]/30 text-[#A78BFA] border border-[#7C5CFC]/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Units / Fund</span>
              </button>
            </div>
          </div>

          {rnitInvestments.length === 0 ? (
            <div className="text-center py-8 bg-[#0B1020]/40 rounded-2xl border border-dashed border-[#1E293B] p-6 space-y-3">
              <TrendingUp size={36} className="mx-auto text-[#7C5CFC]/60" />
              <h4 className="text-sm font-bold text-[#F8FAFC]">No RNIT Iterambere Fund Units Registered Yet</h4>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Add how many units you bought in RNIT Iterambere Fund along with the purchase NAV. The assistant will calculate your live portfolio value and let you simulate or record redemptions/withdrawals!
              </p>
              <button
                onClick={() => {
                  setInvType('rnit_nav');
                  setInvName('RNIT Iterambere Fund');
                  setShowInvestmentModal(true);
                }}
                className="px-4 py-2 bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-md"
              >
                Enter My RNIT Holdings
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rnitInvestments.map(item => {
                const profit = (item.currentValue || 0) - (item.totalInvested || 0);
                const returnPct = item.totalInvested > 0 ? ((profit / item.totalInvested) * 100).toFixed(2) : '0';

                return (
                  <div 
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#18223A] border border-[#7C5CFC]/30 space-y-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#F8FAFC]">{item.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7C5CFC]/20 text-[#A78BFA] border border-[#7C5CFC]/30 font-semibold">
                            Unit Trust / Mutual Fund
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          {item.units.toLocaleString()} Units @ Current NAV: <strong className="text-[#22D3EE]">{item.currentPrice.toLocaleString()} RWF</strong> (Purchased @ {item.purchasePrice.toLocaleString()} RWF)
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* Update NAV Price */}
                        <button
                          onClick={() => {
                            setSelectedInvestment(item);
                            setNewNavPrice(String(item.currentPrice));
                            setShowNavUpdateModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#0B1020] hover:bg-[#121A2E] text-[#22D3EE] border border-[#22D3EE]/40 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Update current daily NAV price"
                        >
                          <RefreshCw size={12} />
                          <span>Update Daily NAV</span>
                        </button>

                        {/* Withdraw / Redeem Units */}
                        <button
                          onClick={() => {
                            setSelectedInvestment(item);
                            setWithdrawUnits('');
                            setWithdrawNavPrice(String(item.currentPrice));
                            setShowWithdrawModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#34D399] border border-[#34D399]/40 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                          title="Simulate or record a withdrawal / redemption of units"
                        >
                          <ArrowDownLeft size={13} />
                          <span>Withdraw / Redeem Units</span>
                        </button>

                        <button
                          onClick={() => handleDeleteInvestment(item.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#FB7185] transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Financial Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0B1020]/60 p-4 rounded-xl border border-[#1E293B]">
                      <div>
                        <span className="text-[11px] text-[#94A3B8] block">Units Owned</span>
                        <span className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                          {item.units.toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">units</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-[#94A3B8] block">Invested Capital</span>
                        <span className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                          {item.totalInvested.toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">RWF</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-[#94A3B8] block">Current Valuation</span>
                        <span className="text-sm sm:text-base font-bold text-[#22D3EE]">
                          {item.currentValue.toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">RWF</span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-[#94A3B8] block">Total Gain / Profit</span>
                        <span className={`text-sm sm:text-base font-bold flex items-center gap-1 ${
                          profit >= 0 ? 'text-[#34D399]' : 'text-[#FB7185]'
                        }`}>
                          {profit >= 0 ? '+' : ''}{profit.toLocaleString()} RWF ({returnPct}%)
                        </span>
                      </div>
                    </div>

                    {/* Withdrawal / Redemption History */}
                    {item.withdrawals && item.withdrawals.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider block mb-2">
                          Redemption &amp; Withdrawal History
                        </span>
                        <div className="space-y-1.5">
                          {item.withdrawals.map((w, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center justify-between text-xs bg-[#0B1020] px-3 py-2 rounded-lg border border-[#1E293B]"
                            >
                              <div className="flex items-center gap-2">
                                <ArrowDownLeft size={13} className="text-[#34D399]" />
                                <span className="text-[#F8FAFC]">{w.date}: Redeemed {w.unitsWithdrawn.toLocaleString()} units</span>
                                <span className="text-[10px] text-[#94A3B8]">(@ {w.navPrice} RWF)</span>
                              </div>
                              <span className="font-bold text-[#34D399]">
                                +{w.amountReceived.toLocaleString()} RWF
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Other Shares, Stocks, SACCO Savings */}
          <div className="pt-4 border-t border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#F8FAFC]">Other Shares, Equities &amp; SACCO Savings</h4>
                <p className="text-xs text-[#94A3B8]">Rwanda Stock Exchange (BK, Bralirwa, MTN), fixed deposits &amp; assets</p>
              </div>

              <button
                onClick={() => {
                  setInvType('shares');
                  setInvName('');
                  setShowInvestmentModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#18223A] hover:bg-[#1E293B] text-xs font-medium text-[#F8FAFC] border border-[#1E293B] flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Add Share or Asset
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {investments.filter(i => i.type !== 'rnit_nav').map(item => (
                <div 
                  key={item.id}
                  className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] flex flex-col justify-between space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F8FAFC]">{item.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#7C5CFC]/20 text-[#A78BFA] font-mono">
                      {item.type}
                    </span>
                  </div>

                  <div className="text-lg font-extrabold text-[#22D3EE]">
                    {item.currentValue.toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">RWF</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-2 border-t border-[#1E293B]">
                    <span>Units/Qty: {item.units}</span>
                    <button
                      onClick={() => handleDeleteInvestment(item.id)}
                      className="text-[#94A3B8] hover:text-[#FB7185] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TWO-WAY DEBTS LEDGER (DEBTS I OWE & DEBTS OWED TO ME)    */}
      {/* ============================================================== */}
      {(activeTab === 'debts' || activeTab === 'overview') && (
        <div className="bg-[#121A2E] p-6 rounded-3xl border border-[#1E293B] shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#FB7185]" />
                <h3 className="text-lg font-bold text-[#F8FAFC]">Two-Way Debts Ledger</h3>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Keep an exact count of money you owe to others and money people owe you, with repayment tracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDebtType('owed_by_me');
                  setShowDebtModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#FB7185]/20 hover:bg-[#FB7185]/30 text-[#FB7185] border border-[#FB7185]/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={13} />
                <span>Debt I Owe</span>
              </button>

              <button
                onClick={() => {
                  setDebtType('owed_to_me');
                  setShowDebtModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#34D399] border border-[#34D399]/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={13} />
                <span>Debt Owed to Me</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* COLUMN 1: Debts I Owe (Liabilities) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FB7185] flex items-center gap-1.5">
                  <ArrowUpRight size={14} /> Debts I Owe (Liabilities)
                </span>
                <span className="text-xs font-mono font-bold text-[#FB7185]">
                  Total: {totalDebtsIOwe.toLocaleString()} RWF
                </span>
              </div>

              {debtsIOwe.length === 0 ? (
                <div className="p-5 text-center bg-[#0B1020]/40 rounded-2xl border border-[#1E293B]">
                  <p className="text-xs text-[#94A3B8]">You have zero active debts owed. Clean slate!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {debtsIOwe.map(d => {
                    const remaining = Math.max(0, d.amount - (d.amountPaid || 0));
                    const progressPct = Math.min(100, Math.round(((d.amountPaid || 0) / d.amount) * 100));

                    return (
                      <div 
                        key={d.id}
                        className="bg-[#18223A] p-4 rounded-xl border border-[#FB7185]/30 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-[#F8FAFC]">{d.counterparty}</span>
                            {d.dueDate && (
                              <span className="text-[10px] text-[#94A3B8] block">Due: {d.dueDate}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-[#FB7185] block">
                              {remaining.toLocaleString()} RWF
                            </span>
                            <span className="text-[10px] text-[#94A3B8]">
                              of {d.amount.toLocaleString()} RWF
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#0B1020] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#34D399] h-full rounded-full transition-all duration-300" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-[10px] text-[#94A3B8]">Paid: {(d.amountPaid || 0).toLocaleString()} RWF ({progressPct}%)</span>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedDebt(d);
                                setShowRepayModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#34D399] text-[11px] font-semibold transition cursor-pointer"
                            >
                              Pay Part
                            </button>
                            <button
                              onClick={() => handleDeleteDebt(d.id)}
                              className="text-[#94A3B8] hover:text-[#FB7185] p-1 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMN 2: Debts Owed to Me (Receivables / Lent Out) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#34D399] flex items-center gap-1.5">
                  <ArrowDownLeft size={14} /> Money People Owe Me (Receivables)
                </span>
                <span className="text-xs font-mono font-bold text-[#34D399]">
                  Total: {totalDebtsOwedToMe.toLocaleString()} RWF
                </span>
              </div>

              {debtsOwedToMe.length === 0 ? (
                <div className="p-5 text-center bg-[#0B1020]/40 rounded-2xl border border-[#1E293B]">
                  <p className="text-xs text-[#94A3B8]">No active loans or debts owed to you currently.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {debtsOwedToMe.map(d => {
                    const remaining = Math.max(0, d.amount - (d.amountPaid || 0));
                    const progressPct = Math.min(100, Math.round(((d.amountPaid || 0) / d.amount) * 100));

                    return (
                      <div 
                        key={d.id}
                        className="bg-[#18223A] p-4 rounded-xl border border-[#34D399]/30 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-bold text-[#F8FAFC]">{d.counterparty}</span>
                            {d.dueDate && (
                              <span className="text-[10px] text-[#94A3B8] block">Expected by: {d.dueDate}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-[#34D399] block">
                              {remaining.toLocaleString()} RWF
                            </span>
                            <span className="text-[10px] text-[#94A3B8]">
                              lent: {d.amount.toLocaleString()} RWF
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#0B1020] h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#34D399] h-full rounded-full transition-all duration-300" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-[10px] text-[#94A3B8]">Returned: {(d.amountPaid || 0).toLocaleString()} RWF ({progressPct}%)</span>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedDebt(d);
                                setShowRepayModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#34D399]/20 hover:bg-[#34D399]/30 text-[#34D399] text-[11px] font-semibold transition cursor-pointer"
                            >
                              Record Received
                            </button>
                            <button
                              onClick={() => handleDeleteDebt(d.id)}
                              className="text-[#94A3B8] hover:text-[#FB7185] p-1 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: LIQUID CASH & STARTING BALANCES                          */}
      {/* ============================================================== */}
      {(activeTab === 'balances' || activeTab === 'overview') && (
        <div className="bg-[#121A2E] p-6 rounded-3xl border border-[#1E293B] shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Current Liquid Accounts Breakdown</h3>
              <p className="text-xs text-[#94A3B8]">Cash in wallet, Mobile Money wallets &amp; checking bank accounts</p>
            </div>
            <button
              onClick={() => setShowBalanceModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#22D3EE]/20 hover:bg-[#22D3EE]/30 text-[#22D3EE] border border-[#22D3EE]/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Update Balances</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#18223A] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FBBF24]/20 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24]">
                <Coins size={18} />
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] font-medium block">Cash on Hand</span>
                <span className="text-lg font-bold text-[#F8FAFC]">
                  {(position?.cashOnHand || 0).toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">RWF</span>
                </span>
              </div>
            </div>

            <div className="bg-[#18223A] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/20 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
                <Smartphone size={18} />
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] font-medium block">Mobile Money (MoMo / Airtel)</span>
                <span className="text-lg font-bold text-[#F8FAFC]">
                  {(position?.mobileMoney || 0).toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">RWF</span>
                </span>
              </div>
            </div>

            <div className="bg-[#18223A] p-4 rounded-2xl border border-[#1E293B] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#34D399]/20 border border-[#34D399]/30 flex items-center justify-center text-[#34D399]">
                <Building2 size={18} />
              </div>
              <div>
                <span className="text-xs text-[#94A3B8] font-medium block">Bank Account(s)</span>
                <span className="text-lg font-bold text-[#F8FAFC]">
                  {(position?.bankBalance || 0).toLocaleString()} <span className="text-[10px] font-normal text-[#94A3B8]">RWF</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: EXPECTED MONEY & RECURRING INFLOWS                       */}
      {/* ============================================================== */}
      {(activeTab === 'recurring' || activeTab === 'overview') && (
        <div className="bg-[#121A2E] p-6 rounded-3xl border border-[#1E293B] shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Expected Money &amp; Recurring Cashflows</h3>
              <p className="text-xs text-[#94A3B8]">Monthly expected contracts, stipends, expected receivables &amp; recurring commitments</p>
            </div>
            <button
              onClick={() => setShowCashflowModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#7C5CFC]/20 hover:bg-[#7C5CFC]/30 text-[#A78BFA] border border-[#7C5CFC]/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Recurring / Expected</span>
            </button>
          </div>

          {cashflows.length === 0 ? (
            <div className="p-6 text-center bg-[#0B1020]/40 rounded-2xl border border-dashed border-[#1E293B]">
              <p className="text-xs text-[#94A3B8]">
                No recurring income streams or expected receivables registered yet. Click above to add!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cashflows.map(cf => (
                <div 
                  key={cf.id}
                  className="bg-[#18223A] p-4 rounded-xl border border-[#1E293B] space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#F8FAFC]">{cf.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      cf.type === 'recurring_income' ? 'bg-[#34D399]/20 text-[#34D399]' :
                      cf.type === 'expected_receivable' ? 'bg-[#22D3EE]/20 text-[#22D3EE]' :
                      'bg-[#FB7185]/20 text-[#FB7185]'
                    }`}>
                      {cf.frequency}
                    </span>
                  </div>

                  <div className="text-base font-extrabold text-[#34D399]">
                    {cf.amount.toLocaleString()} <span className="text-xs font-normal text-[#94A3B8]">RWF</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-2 border-t border-[#1E293B]">
                    <span>{cf.expectedDate ? `Date: ${cf.expectedDate}` : 'Continuous'}</span>
                    <button
                      onClick={() => handleDeleteCashflow(cf.id)}
                      className="text-[#94A3B8] hover:text-[#FB7185] opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: UPDATE STARTING LIQUID BALANCES                         */}
      {/* ============================================================== */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveBalances} className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Coins size={18} className="text-[#34D399]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Set Liquid Starting Balances</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowBalanceModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#94A3B8]">
              Input the balance you currently have in your wallet, MoMo, and bank account to start tracking accurate net worth.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Mobile Money (RWF)</label>
                <input 
                  type="number"
                  value={momoInput}
                  onChange={e => setMomoInput(e.target.value)}
                  placeholder="e.g. 150000"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Bank Account Balance (RWF)</label>
                <input 
                  type="number"
                  value={bankInput}
                  onChange={e => setBankInput(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Cash on Hand (RWF)</label>
                <input 
                  type="number"
                  value={cashInput}
                  onChange={e => setCashInput(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Notes / Accounts Breakdown</label>
                <input 
                  type="text"
                  value={balanceNotes}
                  onChange={e => setBalanceNotes(e.target.value)}
                  placeholder="e.g. MTN MoMo + BK account"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowBalanceModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18223A] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#34D399] hover:bg-[#2EB885] text-black font-bold text-xs shadow-lg transition cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Balances'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / LOG DEBT RECORD                                   */}
      {/* ============================================================== */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDebt} className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className={debtType === 'owed_by_me' ? 'text-[#FB7185]' : 'text-[#34D399]'} />
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  {debtType === 'owed_by_me' ? 'Log Debt I Owe (Liability)' : 'Log Money Owed to Me (Receivable)'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowDebtModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Type selector toggle */}
            <div className="flex rounded-xl bg-[#0B1020] p-1 border border-[#1E293B] text-xs">
              <button
                type="button"
                onClick={() => setDebtType('owed_by_me')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  debtType === 'owed_by_me' ? 'bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40' : 'text-[#94A3B8]'
                }`}
              >
                Debt I Owe (I must pay)
              </button>
              <button
                type="button"
                onClick={() => setDebtType('owed_to_me')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  debtType === 'owed_to_me' ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40' : 'text-[#94A3B8]'
                }`}
              >
                Owed to Me (I will receive)
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  {debtType === 'owed_by_me' ? 'Creditor / Person I Owe' : 'Debtor / Person Who Owes Me'}
                </label>
                <input 
                  type="text"
                  required
                  value={debtCounterparty}
                  onChange={e => setDebtCounterparty(e.target.value)}
                  placeholder="e.g. Bank of Kigali, Friend Jean, SACCO"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Total Amount (RWF)</label>
                <input 
                  type="number"
                  required
                  value={debtAmount}
                  onChange={e => setDebtAmount(e.target.value)}
                  placeholder="e.g. 75000"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Due Date / Promised Date</label>
                <input 
                  type="date"
                  value={debtDueDate}
                  onChange={e => setDebtDueDate(e.target.value)}
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Notes / Terms</label>
                <input 
                  type="text"
                  value={debtNotes}
                  onChange={e => setDebtNotes(e.target.value)}
                  placeholder="e.g. Emergency loan, repay end of month"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowDebtModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18223A] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                {isSaving ? 'Logging...' : 'Save Debt Record'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RECORD REPAYMENT                                        */}
      {/* ============================================================== */}
      {showRepayModal && selectedDebt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRecordRepayment} className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-bold text-[#F8FAFC]">Record Repayment</h3>
              <button 
                type="button" 
                onClick={() => setShowRepayModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-[#94A3B8]">
              <strong className="text-[#F8FAFC]">{selectedDebt.counterparty}</strong> — Total: {selectedDebt.amount.toLocaleString()} RWF.
              <div className="mt-1">Already paid: {(selectedDebt.amountPaid || 0).toLocaleString()} RWF.</div>
              <div>Remaining: {Math.max(0, selectedDebt.amount - (selectedDebt.amountPaid || 0)).toLocaleString()} RWF.</div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#34D399] mb-1">Repayment Amount (RWF)</label>
              <input 
                type="number"
                required
                autoFocus
                value={repayAmount}
                onChange={e => setRepayAmount(e.target.value)}
                placeholder="Amount being paid now..."
                className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#34D399] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowRepayModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18223A] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#34D399] hover:bg-[#2EB885] text-black font-bold text-xs shadow-lg transition cursor-pointer"
              >
                {isSaving ? 'Updating...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD INVESTMENT / RNIT FUND                              */}
      {/* ============================================================== */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvestment} className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#A78BFA]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Add Holding or RNIT Units</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowInvestmentModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Asset / Investment Category</label>
                <select
                  value={invType}
                  onChange={e => {
                    const t = e.target.value as any;
                    setInvType(t);
                    if (t === 'rnit_nav') setInvName('RNIT Iterambere Fund');
                  }}
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none cursor-pointer"
                >
                  <option value="rnit_nav">RNIT Iterambere Fund (Unit Trust NAV)</option>
                  <option value="shares">Shares &amp; Stocks (RSE / Equities)</option>
                  <option value="savings">SACCO &amp; Fixed Savings</option>
                  <option value="asset">Physical / Capital Asset</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Name / Fund Title</label>
                <input 
                  type="text"
                  required
                  value={invName}
                  onChange={e => setInvName(e.target.value)}
                  placeholder="e.g. RNIT Iterambere Fund, Bank of Kigali Shares"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    {invType === 'rnit_nav' ? 'Number of Units' : 'Quantity / Units'}
                  </label>
                  <input 
                    type="number"
                    step="any"
                    required
                    value={invUnits}
                    onChange={e => setInvUnits(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                    {invType === 'rnit_nav' ? 'Buy NAV Price (RWF)' : 'Purchase Price / Unit'}
                  </label>
                  <input 
                    type="number"
                    step="any"
                    required
                    value={invBuyPrice}
                    onChange={e => setInvBuyPrice(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#22D3EE] mb-1">
                  {invType === 'rnit_nav' ? 'Current NAV Price per Unit (RWF)' : 'Current Market Price (RWF)'}
                </label>
                <input 
                  type="number"
                  step="any"
                  value={invCurrentPrice}
                  onChange={e => setInvCurrentPrice(e.target.value)}
                  placeholder="Leave empty if same as buy price (e.g. 178.50)"
                  className="w-full p-2.5 bg-[#18223A] border border-[#22D3EE]/40 rounded-xl text-xs text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Notes / Certificate Number</label>
                <input 
                  type="text"
                  value={invNotes}
                  onChange={e => setInvNotes(e.target.value)}
                  placeholder="e.g. RNIT Account No. / Broker statement"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowInvestmentModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18223A] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                {isSaving ? 'Adding...' : 'Save Holding'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: QUICK UPDATE DAILY NAV PRICE                            */}
      {/* ============================================================== */}
      {showNavUpdateModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateCurrentNav} className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-bold text-[#F8FAFC]">Update Daily NAV Price</h3>
              <button 
                type="button" 
                onClick={() => setShowNavUpdateModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#94A3B8]">
              RNIT publishes daily Net Asset Value (NAV). Update it here to automatically recalculate your total portfolio valuation!
            </p>

            <div>
              <label className="block text-xs font-medium text-[#22D3EE] mb-1">New NAV Price (RWF per Unit)</label>
              <input 
                type="number"
                step="any"
                required
                autoFocus
                value={newNavPrice}
                onChange={e => setNewNavPrice(e.target.value)}
                placeholder="e.g. 182.40"
                className="w-full p-2.5 bg-[#18223A] border border-[#22D3EE]/40 rounded-xl text-xs text-[#F8FAFC] focus:border-[#22D3EE] focus:outline-none"
              />
            </div>

            <div className="text-xs text-[#94A3B8] bg-[#0B1020] p-3 rounded-xl border border-[#1E293B]">
              New Valuation: <strong className="text-[#34D399]">{((parseFloat(newNavPrice) || 0) * selectedInvestment.units).toLocaleString()} RWF</strong>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowNavUpdateModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18223A] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#22D3EE] hover:bg-[#1EBECE] text-black font-bold text-xs shadow-lg transition cursor-pointer"
              >
                {isSaving ? 'Updating...' : 'Update NAV'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: WITHDRAW / REDEEM RNIT UNITS                            */}
      {/* ============================================================== */}
      {showWithdrawModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExecuteWithdrawal} className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft size={18} className="text-[#34D399]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Withdraw / Redeem RNIT Units</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowWithdrawModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#94A3B8]">
              You currently hold <strong className="text-[#F8FAFC]">{selectedInvestment.units.toLocaleString()} units</strong> in {selectedInvestment.name}.
              Enter how many units you wish to redeem:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Units to Withdraw</label>
                <input 
                  type="number"
                  step="any"
                  max={selectedInvestment.units}
                  required
                  autoFocus
                  value={withdrawUnits}
                  onChange={e => setWithdrawUnits(e.target.value)}
                  placeholder={`Max: ${selectedInvestment.units}`}
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#34D399] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Redemption NAV Price (RWF)</label>
                <input 
                  type="number"
                  step="any"
                  required
                  value={withdrawNavPrice}
                  onChange={e => setWithdrawNavPrice(e.target.value)}
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#34D399] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Credit Payout To Liquid Balance</label>
                <select
                  value={withdrawDestination}
                  onChange={e => setWithdrawDestination(e.target.value as any)}
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#34D399] focus:outline-none cursor-pointer"
                >
                  <option value="momo">Mobile Money (MoMo)</option>
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash on Hand</option>
                </select>
              </div>

              {/* Payout Calculation Preview */}
              <div className="bg-[#0B1020] p-3.5 rounded-xl border border-[#34D399]/40 text-xs space-y-1">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span>Payout Amount:</span>
                  <span className="font-extrabold text-[#34D399] text-sm">
                    {((parseFloat(withdrawUnits) || 0) * (parseFloat(withdrawNavPrice) || 0)).toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                  <span>Remaining Units:</span>
                  <span>{Math.max(0, selectedInvestment.units - (parseFloat(withdrawUnits) || 0)).toLocaleString()} units</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18223A] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#34D399] hover:bg-[#2EB885] text-black font-bold text-xs shadow-lg transition cursor-pointer"
              >
                {isSaving ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD RECURRING CASHFLOW                                  */}
      {/* ============================================================== */}
      {showCashflowModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateCashflow} className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#A78BFA]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Add Recurring or Expected Money</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCashflowModal(false)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Type</label>
                <select
                  value={cfType}
                  onChange={e => setCfType(e.target.value as any)}
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none cursor-pointer"
                >
                  <option value="recurring_income">Monthly Recurring Income / Stipend / Contract</option>
                  <option value="expected_receivable">Expected Receivable (One-off incoming money)</option>
                  <option value="recurring_obligation">Recurring Obligation (Subscription, fixed cost)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Title / Source</label>
                <input 
                  type="text"
                  required
                  value={cfName}
                  onChange={e => setCfName(e.target.value)}
                  placeholder="e.g. Humanitarian Logistics Stipend, Client Contract"
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Amount (RWF)</label>
                  <input 
                    type="number"
                    required
                    value={cfAmount}
                    onChange={e => setCfAmount(e.target.value)}
                    placeholder="e.g. 250000"
                    className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1">Frequency</label>
                  <select
                    value={cfFrequency}
                    onChange={e => setCfFrequency(e.target.value as any)}
                    className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none cursor-pointer"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                    <option value="one_time">One-time Expected</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">Expected Date</label>
                <input 
                  type="date"
                  value={cfDate}
                  onChange={e => setCfDate(e.target.value)}
                  className="w-full p-2.5 bg-[#18223A] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:border-[#7C5CFC] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowCashflowModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18223A] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#7C5CFC] hover:bg-[#6D4AE6] text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Cashflow'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
