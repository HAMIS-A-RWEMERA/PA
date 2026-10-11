import React, { useState, useEffect, useMemo } from 'react';
import { 
  GitFork, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  MapPin, 
  Briefcase,
  BookOpen, 
  Sparkles, 
  Search, 
  ChevronRight, 
  UserPlus, 
  Check, 
  Copy,
  Lock,
  ShieldCheck,
  Star,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Eye,
  Heart,
  Share2,
  Printer,
  X,
  Compass,
  CornerDownRight,
  Info
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
  serverTimestamp 
} from 'firebase/firestore';
import { FamilyMember } from '../types';

const RELATIONSHIP_SUGGESTIONS = [
  "Self",
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "Grandpa (Mom's Father)",
  "Grandmother (Mom's Mother)",
  "Grandpa (Dad's Father)",
  "Grandmother (Dad's Mother)",
  "Mom's Grandpa (Root Patriarch)",
  "Mom's Grandma (Root Matriarch)",
  "Brother of Grandpa (Great-Uncle)",
  "Sister of Grandpa (Great-Aunt)",
  "Uncle (Mom's Brother)",
  "Aunt (Mom's Sister)",
  "Uncle (Dad's Brother)",
  "Aunt (Dad's Sister)",
  "First Cousin",
  "Son",
  "Daughter",
  "Nephew",
  "Niece",
  "Grandchild"
];

const GENERATION_TIER_NAMES: Record<number, { title: string; subtitle: string; icon: string }> = {
  1: { title: "Generation 1: Ancestral Roots & Great-Grandparents", subtitle: "Founding Patriarchs & Matriarchs (Root era)", icon: "🏛️" },
  2: { title: "Generation 2: Grandparents & Great-Aunts / Great-Uncles", subtitle: "Grandparents, great-uncles & elder branches", icon: "🌳" },
  3: { title: "Generation 3: Parents, Uncles & Aunts", subtitle: "Father, Mother, paternal & maternal elders", icon: "👨‍👩‍👧" },
  4: { title: "Generation 4: Current Generation (Me & Siblings)", subtitle: "Self, brothers, sisters, spouse & first cousins", icon: "⭐" },
  5: { title: "Generation 5: Children & Next Generation", subtitle: "Sons, daughters, nieces, nephews & future descendants", icon: "🌱" }
};

export default function FamilyTreeManager({ onBack }: { onBack?: () => void }) {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [viewMode, setViewMode] = useState<'organogram' | 'generations' | 'directory' | 'chronicle'>('organogram');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  
  // Selected member for detail drawer/modal
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('Self');
  const [generation, setGeneration] = useState(4);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [spouseName, setSpouseName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [passedYear, setPassedYear] = useState('');
  const [isAlive, setIsAlive] = useState(true);
  const [birthPlace, setBirthPlace] = useState('');
  const [occupation, setOccupation] = useState('');
  const [notesBio, setNotesBio] = useState('');
  const [branch, setBranch] = useState("Mom's Lineage");

  // Privacy banner toggle
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);

  // Quick builder modal state
  const [isQuickBuilderOpen, setIsQuickBuilderOpen] = useState(false);

  // AI Chronicle state
  const [chronicle, setChronicle] = useState<string>('');
  const [isGeneratingChronicle, setIsGeneratingChronicle] = useState(false);
  const [copiedChronicle, setCopiedChronicle] = useState(false);

  // Real-time Firestore sync with strict userId isolation
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'family_members'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: FamilyMember[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as FamilyMember));

      // Sort by generation ascending, then by birthYear or name
      items.sort((a, b) => {
        if (a.generation !== b.generation) {
          return a.generation - b.generation;
        }
        return (a.birthYear || '').localeCompare(b.birthYear || '');
      });

      setMembers(items);

      // Keep selectedMember in sync if open
      if (selectedMember) {
        const updated = items.find(m => m.id === selectedMember.id);
        if (updated) setSelectedMember(updated);
      }
    });

    return () => unsubscribe();
  }, [selectedMember?.id]);

  // Identify "Self" (Me)
  const selfMember = useMemo(() => {
    return members.find(m => 
      m.relationship.toLowerCase() === 'self' || 
      m.relationship.toLowerCase().includes('me') ||
      m.fullName.toLowerCase().includes('rwemera ally')
    ) || members.find(m => m.generation === 4);
  }, [members]);

  // All branches for filtering
  const allBranches = useMemo(() => {
    return Array.from(new Set(members.map(m => m.branch).filter(Boolean))) as string[];
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        m.fullName.toLowerCase().includes(q) ||
        m.relationship.toLowerCase().includes(q) ||
        (m.occupation || '').toLowerCase().includes(q) ||
        (m.birthPlace || '').toLowerCase().includes(q) ||
        (m.notesBio || '').toLowerCase().includes(q);
      const matchesBranch = selectedBranch === 'All' || m.branch === selectedBranch;
      return matchesSearch && matchesBranch;
    });
  }, [members, searchQuery, selectedBranch]);

  // Helper to open Add modal with smart relative presets
  const openAddRelativeModal = (
    relType: 'parent' | 'sibling' | 'child' | 'spouse' | 'custom',
    targetMember?: FamilyMember
  ) => {
    setEditingMemberId(null);
    setFullName('');
    setBirthYear('');
    setPassedYear('');
    setBirthPlace(targetMember?.birthPlace || '');
    setOccupation('');
    setNotesBio('');
    setBranch(targetMember?.branch || "Mom's Lineage");

    if (relType === 'parent' && targetMember) {
      // Parent is 1 generation up (e.g. Gen 3 if target is Gen 4)
      const targetGen = Math.max(1, targetMember.generation - 1);
      setGeneration(targetGen);
      setRelationship(targetGen === 3 ? 'Father' : `Parent of ${targetMember.fullName}`);
      setSelectedParentId('');
      setSpouseName('');
      setIsAlive(targetGen >= 3);
    } else if (relType === 'sibling' && targetMember) {
      // Sibling is on same generation and shares parents
      setGeneration(targetMember.generation);
      setRelationship('Brother');
      setSelectedParentId(targetMember.parentIds?.[0] || '');
      setSpouseName('');
      setIsAlive(true);
    } else if (relType === 'child' && targetMember) {
      // Child is 1 generation down
      const childGen = Math.min(5, targetMember.generation + 1);
      setGeneration(childGen);
      setRelationship(`Child of ${targetMember.fullName}`);
      setSelectedParentId(targetMember.id);
      setSpouseName('');
      setIsAlive(true);
    } else if (relType === 'spouse' && targetMember) {
      // Spouse on same generation
      setGeneration(targetMember.generation);
      setRelationship(`Spouse of ${targetMember.fullName}`);
      setSelectedParentId('');
      setSpouseName(targetMember.fullName);
      setIsAlive(true);
    } else {
      // Generic add
      setGeneration(4);
      setRelationship('Relative');
      setSelectedParentId('');
      setSpouseName('');
      setIsAlive(true);
    }

    setIsModalOpen(true);
  };

  const openEditModal = (m: FamilyMember) => {
    setEditingMemberId(m.id);
    setFullName(m.fullName);
    setRelationship(m.relationship);
    setGeneration(m.generation);
    setSelectedParentId(m.parentIds?.[0] || '');
    setSpouseName(m.spouseName || '');
    setBirthYear(m.birthYear || '');
    setPassedYear(m.passedYear || '');
    setIsAlive(m.isAlive ?? true);
    setBirthPlace(m.birthPlace || '');
    setOccupation(m.occupation || '');
    setNotesBio(m.notesBio || '');
    setBranch(m.branch || "Mom's Lineage");
    setIsModalOpen(true);
  };

  const handleSaveMember = async () => {
    if (!auth.currentUser || !fullName.trim()) return;

    const data: Partial<FamilyMember> = {
      userId: auth.currentUser.uid,
      fullName: fullName.trim(),
      relationship: relationship.trim(),
      generation: Number(generation),
      parentIds: selectedParentId ? [selectedParentId] : [],
      spouseName: spouseName.trim() || undefined,
      birthYear: birthYear.trim() || undefined,
      passedYear: isAlive ? undefined : (passedYear.trim() || undefined),
      isAlive: isAlive,
      birthPlace: birthPlace.trim() || undefined,
      occupation: occupation.trim() || undefined,
      notesBio: notesBio.trim() || undefined,
      branch: branch.trim() || "Mom's Lineage",
    };

    try {
      if (editingMemberId) {
        await updateDoc(doc(db, 'family_members', editingMemberId), data);
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'family_members'), data);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save family member:', err);
    }
  };

  const handleDeleteMember = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to remove this family member from your tree?')) return;
    try {
      await deleteDoc(doc(db, 'family_members', id));
      if (selectedMember?.id === id) {
        setSelectedMember(null);
      }
    } catch (err) {
      console.error('Failed to delete member:', err);
    }
  };

  // 1-Click Starter Lineage Seed (Mom's Grandpa Downward)
  const handleSeedStarterTree = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const rootAncestor = {
      userId: uid,
      fullName: "Mom's Great-Grandfather",
      relationship: "Mom's Grandpa (Root Patriarch)",
      generation: 1,
      parentIds: [],
      spouseName: "Mom's Great-Grandmother",
      birthYear: "1910",
      passedYear: "1988",
      isAlive: false,
      birthPlace: "Ancestral Homestead",
      occupation: "Respected Elder, Community Leader & Farmer",
      notesBio: "The foundational ancestor who established our family compound and values of integrity, education, and generosity.",
      branch: "Mom's Lineage (Founding)",
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'family_members'), rootAncestor);
    const rootId = docRef.id;

    // Add Brother of Grandpa
    await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: "Great-Uncle (Brother of Grandpa)",
      relationship: "Brother of Grandpa (Great-Uncle)",
      generation: 2,
      parentIds: [rootId],
      spouseName: "",
      birthYear: "1936",
      passedYear: "2010",
      isAlive: false,
      birthPlace: "Ancestral Homestead",
      occupation: "Teacher & Historian",
      notesBio: "Elder brother who kept the oral traditions and guided the family.",
      branch: "Brother of Grandpa Branch",
      createdAt: serverTimestamp()
    });

    // Add Grandpa (Mom's Father)
    const grandpaRef = await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: "Grandpa (Mom's Father)",
      relationship: "Grandpa (Mom's Father)",
      generation: 2,
      parentIds: [rootId],
      spouseName: "Grandmother",
      birthYear: "1940",
      passedYear: "2018",
      isAlive: false,
      birthPlace: "Ancestral Homestead",
      occupation: "Civil Servant & Agronomist",
      notesBio: "Valued education above all, ensuring all his children went to university.",
      branch: "Mom's Lineage",
      createdAt: serverTimestamp()
    });

    // Add Mother
    const momRef = await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: "Murebwayire Aisha",
      relationship: "Mother",
      generation: 3,
      parentIds: [grandpaRef.id],
      spouseName: "Rwemera Iddi",
      birthYear: "1972",
      isAlive: true,
      birthPlace: "Ngoma, Rwanda",
      occupation: "Family Matriarch & Community Pillar",
      notesBio: "Mother of Rwemera Ally Hamis. Pillar of family resilience, wisdom, and core values.",
      branch: "Mom's Lineage",
      createdAt: serverTimestamp()
    });

    // Add Father
    const dadRef = await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: "Rwemera Iddi",
      relationship: "Father",
      generation: 3,
      parentIds: [],
      spouseName: "Murebwayire Aisha",
      birthYear: "1968",
      isAlive: true,
      birthPlace: "Ngoma, Rwanda",
      occupation: "Respected Elder & Family Leader",
      notesBio: "Father of Rwemera Ally Hamis.",
      branch: "Rwemera Lineage",
      createdAt: serverTimestamp()
    });

    // Add Self
    await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: "RWEMERA Ally Hamis",
      relationship: "Self",
      generation: 4,
      parentIds: [momRef.id, dadRef.id],
      birthYear: "2002",
      isAlive: true,
      birthPlace: "Ngoma, Rwanda",
      occupation: "Social Work & Humanitarian Operations Specialist | High Performance Advocate",
      notesBio: "Born 01/01/2002. Social Work Scholar at University of Rwanda, certified in UN Peace Operations, Mine Action (UNMAS), Cultural Property (UNESCO), CSM 100%, and custodian of ancestral genealogical archives.",
      branch: "Mom's Lineage",
      createdAt: serverTimestamp()
    });

    setIsQuickBuilderOpen(false);
  };

  // Quick Starter: "Start with Me"
  const handleStartWithMe = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const userEmail = auth.currentUser.email || '';
    const defaultName = auth.currentUser.displayName || (userEmail.includes('rwemera') ? 'RWEMERA Ally Hamis' : 'Me');

    await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: defaultName,
      relationship: "Self",
      generation: 4,
      parentIds: [],
      birthYear: "2002",
      isAlive: true,
      birthPlace: "Rwanda",
      occupation: "Professional",
      notesBio: "Center of the family tree diagram. From here, click + Parent above, + Sibling to the side, or + Child below to expand your full lineage.",
      branch: "My Direct Lineage",
      createdAt: serverTimestamp()
    });

    setIsQuickBuilderOpen(false);
  };

  // Quick Starter: "Start with Parents"
  const handleStartWithParents = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const dadRef = await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: "Father",
      relationship: "Father",
      generation: 3,
      parentIds: [],
      spouseName: "Mother",
      isAlive: true,
      birthPlace: "Rwanda",
      occupation: "Elder",
      notesBio: "Father. The branch continues upwards to his parents (Grandparents) and downwards to children.",
      branch: "Paternal Lineage",
      createdAt: serverTimestamp()
    });

    const momRef = await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: "Mother",
      relationship: "Mother",
      generation: 3,
      parentIds: [],
      spouseName: "Father",
      isAlive: true,
      birthPlace: "Rwanda",
      occupation: "Matriarch",
      notesBio: "Mother. Connected to Mom's father (Grandpa) and Mom's grandpa (Root Patriarch).",
      branch: "Mom's Lineage",
      createdAt: serverTimestamp()
    });

    // And add Self connected to both
    await addDoc(collection(db, 'family_members'), {
      userId: uid,
      fullName: auth.currentUser.displayName || "Me (Self)",
      relationship: "Self",
      generation: 4,
      parentIds: [dadRef.id, momRef.id],
      isAlive: true,
      notesBio: "Child of Father and Mother. Ready to add siblings beside me and children below.",
      branch: "Mom's Lineage",
      createdAt: serverTimestamp()
    });

    setIsQuickBuilderOpen(false);
  };

  const handleGenerateChronicle = async () => {
    if (members.length === 0) return;
    setIsGeneratingChronicle(true);
    try {
      const res = await fetch('/api/family/chronicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members })
      });
      const data = await res.json();
      setChronicle(data.chronicle || '');
    } catch (err) {
      console.error('Chronicle error:', err);
    } finally {
      setIsGeneratingChronicle(false);
    }
  };

  // Get relatives of a specific person for their profile drawer
  const getPersonConnections = (person: FamilyMember) => {
    const parents = members.filter(m => person.parentIds?.includes(m.id));
    const children = members.filter(m => m.parentIds?.includes(person.id));
    const siblings = members.filter(m => {
      if (m.id === person.id) return false;
      // Share at least one parent, or same generation and branch
      if (person.parentIds?.length && m.parentIds?.length) {
        return m.parentIds.some(pid => person.parentIds?.includes(pid));
      }
      return m.generation === person.generation && (m.relationship.toLowerCase().includes('brother') || m.relationship.toLowerCase().includes('sister') || m.relationship.toLowerCase() === 'self');
    });
    const spouse = members.find(m => m.spouseName === person.fullName || person.spouseName === m.fullName);

    return { parents, children, siblings, spouse };
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER & CONTROLS */}
      <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition mr-2 flex items-center gap-1 cursor-pointer"
              >
                ← Dashboard
              </button>
            )}
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 flex items-center gap-1.5">
              <GitFork size={12} /> Interactive Organogram &amp; Heritage Diagram
            </span>

            {/* Privacy Badge */}
            <button
              onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
              className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center gap-1 hover:bg-[#38BDF8]/25 transition cursor-pointer"
              title="Click to check account privacy & isolation details"
            >
              <ShieldCheck size={12} />
              <span>100% Private to Your Account</span>
              <Info size={11} className="opacity-70" />
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] flex items-center gap-2.5 tracking-tight">
            <GitFork className="text-[#10B981]" size={28} />
            Family Tree &amp; Ancestral Organogram
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
            Visual hierarchy diagram starting from <strong className="text-[#F8FAFC]">Me</strong>, branching horizontally to <strong className="text-[#F8FAFC]">Siblings</strong>, upwards to <strong className="text-[#F8FAFC]">Parents &amp; Grandparents</strong>, and downwards to <strong className="text-[#F8FAFC]">Children &amp; Descendants</strong>.
          </p>
        </div>

        {/* View Switchers & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#0B1020] p-1 rounded-xl border border-[#1E293B] flex items-center text-xs">
            <button
              onClick={() => setViewMode('organogram')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'organogram' ? 'bg-[#10B981] text-slate-950 font-bold shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
              title="Visual Tree Organogram (Parents Up, Siblings Aside, Children Down)"
            >
              <GitFork size={14} /> Organogram
            </button>
            <button
              onClick={() => setViewMode('generations')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'generations' ? 'bg-[#10B981] text-slate-950 font-bold shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Compass size={14} /> Generations
            </button>
            <button
              onClick={() => setViewMode('directory')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'directory' ? 'bg-[#10B981] text-slate-950 font-bold shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Users size={14} /> Directory ({members.length})
            </button>
            <button
              onClick={() => {
                setViewMode('chronicle');
                if (!chronicle && members.length > 0) handleGenerateChronicle();
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'chronicle' ? 'bg-[#10B981] text-slate-950 font-bold shadow-md' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <BookOpen size={14} /> AI Chronicle
            </button>
          </div>

          <button
            onClick={() => setIsQuickBuilderOpen(true)}
            className="px-3.5 py-2 bg-[#18223A] hover:bg-[#1E293B] text-xs font-semibold text-[#F8FAFC] border border-[#1E293B] hover:border-[#10B981]/50 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            title="Choose a starting point: Me, Parents, or Full Heritage"
          >
            <Sparkles size={14} className="text-[#10B981]" /> Quick Setup
          </button>

          <button
            onClick={() => openAddRelativeModal('custom')}
            className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#10B981]/20 transition cursor-pointer"
          >
            <Plus size={16} /> Add Member
          </button>
        </div>
      </div>

      {/* PRIVACY & ACCOUNT ISOLATION CALLOUT (Answers user query) */}
      {showPrivacyInfo && (
        <div className="bg-[#102336] border border-[#38BDF8]/40 p-4 rounded-2xl text-xs text-[#CBD5E1] space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-[#38BDF8]">
              <Lock size={15} /> Strict Privacy &amp; Multi-User Account Isolation
            </div>
            <button 
              onClick={() => setShowPrivacyInfo(false)}
              className="text-[#94A3B8] hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="leading-relaxed">
            <strong>Answers your question:</strong> If you share the link to this app with someone else and they log in with their own email:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1 text-[#94A3B8]">
            <li><strong className="text-[#F8FAFC]">They will NEVER see your family tree</strong>. Every family record is tagged with your unique user ID (<code className="text-[#38BDF8]">{auth.currentUser?.email}</code>).</li>
            <li><strong className="text-[#F8FAFC]">Your CV, certificates, bank/MOMO balances, debts, and RNIT investments</strong> are equally private. Firestore database rules reject any attempt by other users to query or read your records.</li>
            <li>When the new person logs in, they will have their own empty, private canvas to build their own family tree and finance tracker.</li>
          </ul>
        </div>
      )}

      {/* EMPTY STATE / QUICK STARTER WIZARD */}
      {members.length === 0 && (
        <div className="bg-[#121A2E] p-8 sm:p-12 rounded-3xl border border-dashed border-[#1E293B] text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mx-auto border border-[#10B981]/30">
            <GitFork size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-[#F8FAFC]">Build Your Family Organogram</h3>
            <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
              Choose how you'd like to begin your tree. You can start with yourself, with your parents, or load the foundational ancestral lineage starting from Mom's grandpa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-2 text-left">
            <button
              onClick={handleStartWithMe}
              className="bg-[#18223A] hover:bg-[#1E293B] p-5 rounded-2xl border border-[#1E293B] hover:border-[#10B981] transition group cursor-pointer space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold text-sm mb-2">
                  ⭐
                </div>
                <h4 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#10B981] transition">
                  1. Start with Me (Self)
                </h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                  Creates you in the center. Then click + Parent above, + Sibling beside, or + Child below!
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#10B981] flex items-center gap-1 pt-2">
                Start with Me →
              </span>
            </button>

            <button
              onClick={handleStartWithParents}
              className="bg-[#18223A] hover:bg-[#1E293B] p-5 rounded-2xl border border-[#1E293B] hover:border-[#38BDF8] transition group cursor-pointer space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center font-bold text-sm mb-2">
                  👨‍👩‍👦
                </div>
                <h4 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition">
                  2. Start with Both Parents
                </h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                  Creates Father &amp; Mother side-by-side with Me connected below.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#38BDF8] flex items-center gap-1 pt-2">
                Start with Parents →
              </span>
            </button>

            <button
              onClick={handleSeedStarterTree}
              className="bg-[#18223A] hover:bg-[#1E293B] p-5 rounded-2xl border border-[#1E293B] hover:border-[#FBBF24] transition group cursor-pointer space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#FBBF24]/20 text-[#FBBF24] flex items-center justify-center font-bold text-sm mb-2">
                  🏛️
                </div>
                <h4 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition">
                  3. Load Ancestral Lineage
                </h4>
                <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">
                  Seeds 4 complete generations: Mom's Grandpa down to Grandparents, Parents &amp; RWEMERA Ally Hamis.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#FBBF24] flex items-center gap-1 pt-2">
                Load Full Lineage →
              </span>
            </button>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      {members.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121A2E] p-3 rounded-2xl border border-[#1E293B]">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search relatives by name, role, town, bio..."
              className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F8FAFC] focus:border-[#10B981] focus:outline-none placeholder-[#64748B]"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs py-0.5">
            <span className="text-[#94A3B8] text-[11px] whitespace-nowrap pl-1 font-medium">Branch:</span>
            <button
              onClick={() => setSelectedBranch('All')}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                selectedBranch === 'All' ? 'bg-[#10B981] text-slate-950 font-bold' : 'bg-[#18223A] text-[#94A3B8] hover:text-white'
              }`}
            >
              All Branches ({members.length})
            </button>
            {allBranches.map(b => (
              <button
                key={b}
                onClick={() => setSelectedBranch(b)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedBranch === b ? 'bg-[#10B981] text-slate-950 font-bold' : 'bg-[#18223A] text-[#94A3B8] hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 1: INTERACTIVE ORGANOGRAM / HIERARCHY DIAGRAM */}
      {viewMode === 'organogram' && members.length > 0 && (
        <div className="space-y-10 bg-[#0B1020]/60 p-4 sm:p-8 rounded-3xl border border-[#1E293B] shadow-inner relative overflow-hidden">
          
          {/* Subtle lineage background watermark */}
          <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

          {/* Quick Anchor jump to Me */}
          {selfMember && (
            <div className="relative z-10 flex items-center justify-between bg-[#121A2E]/90 backdrop-blur p-3 rounded-2xl border border-[#1E293B] text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                <span className="text-[#94A3B8]">Organogram Focal Anchor:</span>
                <strong className="text-[#F8FAFC]">{selfMember.fullName}</strong>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] font-mono">
                  {selfMember.relationship}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMember(selfMember)}
                  className="text-[11px] text-[#10B981] hover:text-[#34D399] flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Eye size={13} /> View My Profile &amp; Memories
                </button>
              </div>
            </div>
          )}

          {/* ORGANOGRAM TIERS (1 = Ancestors, 2 = Grandparents, 3 = Parents, 4 = Me & Siblings, 5 = Children) */}
          {[1, 2, 3, 4, 5].map((tier, tierIdx) => {
            const tierMembers = filteredMembers.filter(m => m.generation === tier);
            const tierInfo = GENERATION_TIER_NAMES[tier];

            // If empty and search query active, hide
            if (tierMembers.length === 0 && searchQuery) return null;

            return (
              <div key={tier} className="relative z-10 space-y-4">
                {/* Visual Connector Stem between tiers */}
                {tierIdx > 0 && (
                  <div className="flex flex-col items-center justify-center -my-3">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-[#1E293B] via-[#10B981]/50 to-[#1E293B]" />
                    <div className="w-2 h-2 rounded-full bg-[#10B981]/70 ring-2 ring-[#10B981]/20" />
                  </div>
                )}

                {/* Tier Header Banner */}
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{tierInfo?.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-[#F8FAFC]">
                        {tierInfo?.title}
                      </h3>
                      <p className="text-[11px] text-[#94A3B8]">
                        {tierInfo?.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setGeneration(tier);
                      setEditingMemberId(null);
                      setFullName('');
                      setRelationship(tier === 4 ? 'Sibling' : tier === 3 ? 'Parent' : 'Relative');
                      setSelectedParentId('');
                      setIsModalOpen(true);
                    }}
                    className="text-[11px] text-[#10B981] hover:text-[#34D399] flex items-center gap-1 font-semibold bg-[#18223A] hover:bg-[#1E293B] px-2.5 py-1 rounded-lg border border-[#1E293B] transition cursor-pointer"
                  >
                    <Plus size={13} /> Add to Tier {tier}
                  </button>
                </div>

                {/* Tier Nodes Row */}
                {tierMembers.length === 0 ? (
                  <div className="text-[11px] text-[#94A3B8] py-4 text-center bg-[#121A2E]/40 rounded-2xl border border-dashed border-[#1E293B]">
                    No relatives recorded in {tierInfo?.title}. Click "+ Add to Tier {tier}" to record members.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {tierMembers.map(member => {
                      const isSelf = member.id === selfMember?.id || member.relationship.toLowerCase() === 'self';
                      const { parents, children, siblings } = getPersonConnections(member);

                      return (
                        <div
                          key={member.id}
                          onClick={() => setSelectedMember(member)}
                          className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 relative group shadow-lg ${
                            isSelf
                              ? 'bg-gradient-to-b from-[#142838] to-[#121A2E] border-2 border-[#10B981] shadow-[#10B981]/15 ring-2 ring-[#10B981]/20'
                              : 'bg-[#121A2E] border border-[#1E293B] hover:border-[#10B981]/50'
                          }`}
                        >
                          {/* Self badge */}
                          {isSelf && (
                            <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-[#10B981] text-slate-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                              <Star size={11} fill="currentColor" /> Focal Center (Me)
                            </div>
                          )}

                          <div className="space-y-2.5">
                            {/* Card Top: Avatar, Name & Quick Actions */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                                  isSelf 
                                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                                    : member.isAlive 
                                      ? 'bg-[#18223A] text-[#38BDF8] border-[#1E293B]'
                                      : 'bg-[#291C0E] text-[#FBBF24] border-[#FBBF24]/30'
                                }`}>
                                  {member.fullName.substring(0, 2).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-[#F8FAFC] truncate group-hover:text-[#10B981] transition">
                                    {member.fullName}
                                  </h4>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#18223A] text-[#10B981] border border-[#1E293B]">
                                      {member.relationship}
                                    </span>
                                    {member.branch && (
                                      <span className="text-[10px] text-[#94A3B8] truncate max-w-[100px]">
                                        • {member.branch}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => openEditModal(member)}
                                  className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#18223A]"
                                  title="Edit details"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteMember(member.id, e)}
                                  className="p-1 rounded-lg text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#18223A]"
                                  title="Remove from tree"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Lifespan & Status */}
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                                {member.isAlive ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                                    <span>
                                      {member.birthYear ? `b. ${member.birthYear}` : 'Living'}
                                      {member.birthYear && (
                                        <span className="text-[#94A3B8] ml-1">
                                          ({new Date().getFullYear() - Number(member.birthYear)} yrs)
                                        </span>
                                      )}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span title="In Loving Memory (Ancestor)">🕯️</span>
                                    <span className="text-[#FBBF24]">
                                      {member.birthYear || '?'} – {member.passedYear || 'Passed'}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#291C0E] text-[#FBBF24] border border-[#FBBF24]/30">
                                      Ancestor
                                    </span>
                                  </>
                                )}
                              </div>

                              {member.birthPlace && (
                                <span className="text-[10px] text-[#94A3B8] truncate max-w-[110px]" title={member.birthPlace}>
                                  📍 {member.birthPlace}
                                </span>
                              )}
                            </div>

                            {/* Occupation / Calling */}
                            {member.occupation && (
                              <div className="text-[11px] text-[#94A3B8] truncate">
                                💼 {member.occupation}
                              </div>
                            )}

                            {/* Bio / Anecdote Snippet */}
                            {member.notesBio && (
                              <p className="text-[11px] text-[#CBD5E1] line-clamp-2 leading-relaxed bg-[#18223A]/70 p-2 rounded-xl border border-[#1E293B]">
                                "{member.notesBio}"
                              </p>
                            )}

                            {/* Lineage Connections summary */}
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#94A3B8] pt-1">
                              {parents.length > 0 && (
                                <span className="truncate max-w-[140px]" title={`Parent: ${parents.map(p => p.fullName).join(', ')}`}>
                                  ⬆️ Child of: <strong className="text-[#F8FAFC]">{parents[0].fullName}</strong>
                                </span>
                              )}
                              {member.spouseName && (
                                <span className="truncate max-w-[120px]" title={`Spouse: ${member.spouseName}`}>
                                  💍 {member.spouseName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* DIRECT BUILDER ACTIONS ON EVERY CARD */}
                          <div 
                            className="pt-2.5 border-t border-[#1E293B] flex items-center justify-between text-[11px] gap-1 flex-wrap" 
                            onClick={e => e.stopPropagation()}
                          >
                            {/* Upwards: + Parent */}
                            <button
                              onClick={() => openAddRelativeModal('parent', member)}
                              className="px-2 py-1 rounded-lg bg-[#18223A] hover:bg-[#1E293B] text-[#38BDF8] hover:text-white font-medium flex items-center gap-1 transition text-[10px] border border-[#1E293B] cursor-pointer"
                              title={`Add a parent (Father or Mother) above ${member.fullName}`}
                            >
                              <ArrowUp size={11} /> + Parent
                            </button>

                            {/* Sideways: + Sibling */}
                            <button
                              onClick={() => openAddRelativeModal('sibling', member)}
                              className="px-2 py-1 rounded-lg bg-[#18223A] hover:bg-[#1E293B] text-[#FBBF24] hover:text-white font-medium flex items-center gap-1 transition text-[10px] border border-[#1E293B] cursor-pointer"
                              title={`Add a brother or sister on the side of ${member.fullName}`}
                            >
                              <ArrowRight size={11} /> + Sibling
                            </button>

                            {/* Downwards: + Child */}
                            <button
                              onClick={() => openAddRelativeModal('child', member)}
                              className="px-2 py-1 rounded-lg bg-[#18223A] hover:bg-[#1E293B] text-[#10B981] hover:text-white font-medium flex items-center gap-1 transition text-[10px] border border-[#1E293B] cursor-pointer"
                              title={`Add a son, daughter or descendant below ${member.fullName}`}
                            >
                              <ArrowDown size={11} /> + Child
                            </button>

                            {/* Detail Drawer trigger */}
                            <button
                              onClick={() => setSelectedMember(member)}
                              className="px-2 py-1 rounded-lg bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] font-semibold flex items-center gap-1 transition text-[10px] border border-[#10B981]/30 cursor-pointer"
                              title="View full biographical profile and oral history"
                            >
                              <Eye size={11} /> Profile
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: GENERATIONS LANES (ALTERNATIVE CLEAN VIEW) */}
      {viewMode === 'generations' && members.length > 0 && (
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map(gen => {
            const genMembers = filteredMembers.filter(m => m.generation === gen);
            if (genMembers.length === 0 && searchQuery) return null;

            return (
              <div key={gen} className="bg-[#121A2E] p-5 rounded-2xl border border-[#1E293B] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#10B981]/20 text-[#10B981] font-bold text-xs flex items-center justify-center border border-[#10B981]/30">
                      {gen}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#F8FAFC]">
                        {GENERATION_TIER_NAMES[gen]?.title || `Generation ${gen}`}
                      </h3>
                      <p className="text-[11px] text-[#94A3B8]">
                        {GENERATION_TIER_NAMES[gen]?.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setGeneration(gen);
                      setEditingMemberId(null);
                      setFullName('');
                      setRelationship(gen === 4 ? 'Self' : gen === 3 ? 'Parent' : 'Relative');
                      setIsModalOpen(true);
                    }}
                    className="text-xs text-[#10B981] hover:text-[#34D399] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Add to Gen {gen}
                  </button>
                </div>

                {genMembers.length === 0 ? (
                  <div className="text-xs text-[#94A3B8] py-3 text-center">
                    No members logged in Generation {gen}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {genMembers.map(m => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMember(m)}
                        className="bg-[#18223A] hover:bg-[#1C2844] p-3.5 rounded-xl border border-[#1E293B] hover:border-[#10B981]/50 transition cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-xs font-bold text-[#F8FAFC]">{m.fullName}</h4>
                          <span className="text-[10px] text-[#10B981] font-mono">{m.relationship}</span>
                          <div className="text-[10px] text-[#94A3B8] mt-0.5">
                            {m.isAlive ? 'Living' : `Passed (${m.passedYear || '?'})`} • {m.branch || "Mom's Lineage"}
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[#94A3B8]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: DIRECTORY TABLE */}
      {viewMode === 'directory' && (
        <div className="bg-[#121A2E] rounded-2xl border border-[#1E293B] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1020] text-[#94A3B8] border-b border-[#1E293B] font-semibold">
                <tr>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Relationship</th>
                  <th className="p-3.5">Tier / Gen</th>
                  <th className="p-3.5">Status &amp; Lifespan</th>
                  <th className="p-3.5">Branch</th>
                  <th className="p-3.5">Calling &amp; Origin</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredMembers.map(member => (
                  <tr 
                    key={member.id} 
                    onClick={() => setSelectedMember(member)}
                    className="hover:bg-[#18223A] transition cursor-pointer text-[#F8FAFC]"
                  >
                    <td className="p-3.5 font-bold flex items-center gap-2">
                      {member.relationship.toLowerCase() === 'self' && <Star size={13} className="text-[#10B981]" fill="currentColor" />}
                      {member.fullName}
                    </td>
                    <td className="p-3.5 text-[#10B981] font-mono">{member.relationship}</td>
                    <td className="p-3.5">Tier {member.generation}</td>
                    <td className="p-3.5">
                      {member.isAlive ? (
                        <span className="text-[#10B981] flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Living {member.birthYear ? `(b. ${member.birthYear})` : ''}
                        </span>
                      ) : (
                        <span className="text-[#FBBF24]">
                          🕯️ {member.birthYear || '?'} – {member.passedYear || 'Passed'}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-[#94A3B8]">{member.branch || "Mom's Lineage"}</td>
                    <td className="p-3.5 text-[#94A3B8]">
                      {member.occupation || 'N/A'}{member.birthPlace ? ` (${member.birthPlace})` : ''}
                    </td>
                    <td className="p-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 text-[#94A3B8] hover:text-white rounded-lg hover:bg-[#0B1020] mr-1 cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteMember(member.id, e)}
                        className="p-1.5 text-[#94A3B8] hover:text-[#FB7185] rounded-lg hover:bg-[#0B1020] cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: AI ANCESTRAL CHRONICLE */}
      {viewMode === 'chronicle' && (
        <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <BookOpen size={20} className="text-[#10B981]" /> The Living Ancestral Heritage Chronicle
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                AI synthesis honoring Mom's grandpa down to RWEMERA Ally Hamis and future descendants, preserved for generations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateChronicle}
                disabled={isGeneratingChronicle}
                className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles size={14} />
                {isGeneratingChronicle ? 'Composing Chronicle...' : 'Regenerate Narrative'}
              </button>

              {chronicle && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(chronicle);
                    setCopiedChronicle(true);
                    setTimeout(() => setCopiedChronicle(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-[#18223A] hover:bg-[#1E293B] text-xs text-[#F8FAFC] border border-[#1E293B] rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedChronicle ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
                  {copiedChronicle ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#18223A] p-6 rounded-2xl border border-[#1E293B] text-xs leading-relaxed text-[#F8FAFC] whitespace-pre-line font-serif sm:text-sm shadow-inner">
            {chronicle || "Click 'Regenerate Narrative' to compose your family's historical story."}
          </div>
        </div>
      )}

      {/* RICH MEMBER DETAIL & TRIBUTE DRAWER / MODAL */}
      {selectedMember && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="bg-[#121A2E] border border-[#1E293B] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border ${
                  selectedMember.isAlive
                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                    : 'bg-[#291C0E] text-[#FBBF24] border-[#FBBF24]/30'
                }`}>
                  {selectedMember.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                      {selectedMember.relationship}
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      Tier {selectedMember.generation}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#F8FAFC] mt-1">
                    {selectedMember.fullName}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openEditModal(selectedMember);
                    setSelectedMember(null);
                  }}
                  className="p-2 rounded-xl bg-[#18223A] text-[#94A3B8] hover:text-white border border-[#1E293B] cursor-pointer"
                  title="Edit member"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 rounded-xl bg-[#18223A] text-[#94A3B8] hover:text-white border border-[#1E293B] cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* MEMORIAL TRIBUTE OR LIVING BADGE */}
            {!selectedMember.isAlive ? (
              <div className="bg-gradient-to-r from-[#291C0E] to-[#1E140A] p-4 rounded-2xl border border-[#FBBF24]/40 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FBBF24]">
                  <span>🕯️🕊️ In Loving Memory — Honored Ancestor</span>
                </div>
                <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
                  Lifespan: <strong>{selectedMember.birthYear || '?'} – {selectedMember.passedYear || 'Passed'}</strong>
                  {selectedMember.birthYear && selectedMember.passedYear && (
                    <span className="text-[#94A3B8] ml-1">
                      (Lived {Number(selectedMember.passedYear) - Number(selectedMember.birthYear)} years)
                    </span>
                  )}
                  . Enduring pillar whose memory and wisdom remain treasured in our lineage.
                </p>
              </div>
            ) : (
              <div className="bg-[#10B981]/10 p-3.5 rounded-2xl border border-[#10B981]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#10B981] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Living (Present Generation)</span>
                </div>
                {selectedMember.birthYear && (
                  <span className="text-[#CBD5E1]">
                    Age: <strong>{new Date().getFullYear() - Number(selectedMember.birthYear)} years</strong> (Born {selectedMember.birthYear})
                  </span>
                )}
              </div>
            )}

            {/* VITAL BIOGRAPHICAL DETAILS */}
            <div className="space-y-2 text-xs text-[#CBD5E1]">
              <div className="bg-[#18223A] p-4 rounded-2xl border border-[#1E293B] space-y-2">
                {selectedMember.spouseName && (
                  <div className="flex items-center gap-2">
                    <Heart size={14} className="text-[#FB7185]" />
                    <span><strong>Spouse:</strong> {selectedMember.spouseName}</span>
                  </div>
                )}
                {selectedMember.birthPlace && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#38BDF8]" />
                    <span><strong>Origin / Homestead:</strong> {selectedMember.birthPlace}</span>
                  </div>
                )}
                {selectedMember.occupation && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-[#FBBF24]" />
                    <span><strong>Calling / Work:</strong> {selectedMember.occupation}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <GitFork size={14} className="text-[#10B981]" />
                  <span><strong>Family Branch:</strong> {selectedMember.branch || "Mom's Lineage"}</span>
                </div>
              </div>

              {/* MEMORIES, ORAL HISTORY & BIO */}
              {selectedMember.notesBio && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#10B981]" /> Memories, Oral History &amp; Wisdom
                  </span>
                  <div className="bg-[#18223A] p-4 rounded-2xl border border-[#1E293B] leading-relaxed italic text-xs text-[#F8FAFC]">
                    "{selectedMember.notesBio}"
                  </div>
                </div>
              )}

              {/* FAMILY WEB CONNECTIONS JUMP */}
              {(() => {
                const { parents, children, siblings } = getPersonConnections(selectedMember);
                return (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      Family Connections Web
                    </span>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {parents.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedMember(p)}
                          className="px-2.5 py-1 rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#38BDF8] text-[#38BDF8] flex items-center gap-1 cursor-pointer"
                        >
                          ⬆️ Parent: {p.fullName}
                        </button>
                      ))}

                      {siblings.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedMember(s)}
                          className="px-2.5 py-1 rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#FBBF24] text-[#FBBF24] flex items-center gap-1 cursor-pointer"
                        >
                          ➡️ Sibling: {s.fullName}
                        </button>
                      ))}

                      {children.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedMember(c)}
                          className="px-2.5 py-1 rounded-xl bg-[#18223A] hover:bg-[#1E293B] border border-[#1E293B] hover:border-[#10B981] text-[#10B981] flex items-center gap-1 cursor-pointer"
                        >
                          ⬇️ Child: {c.fullName}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* FOOTER ACTIONS: Add Parent / Sibling / Child from here */}
            <div className="pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    openAddRelativeModal('parent', selectedMember);
                    setSelectedMember(null);
                  }}
                  className="px-2.5 py-1.5 bg-[#18223A] hover:bg-[#1E293B] text-[#38BDF8] text-xs font-semibold rounded-xl border border-[#1E293B] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUp size={12} /> + Parent
                </button>
                <button
                  onClick={() => {
                    openAddRelativeModal('sibling', selectedMember);
                    setSelectedMember(null);
                  }}
                  className="px-2.5 py-1.5 bg-[#18223A] hover:bg-[#1E293B] text-[#FBBF24] text-xs font-semibold rounded-xl border border-[#1E293B] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight size={12} /> + Sibling
                </button>
                <button
                  onClick={() => {
                    openAddRelativeModal('child', selectedMember);
                    setSelectedMember(null);
                  }}
                  className="px-2.5 py-1.5 bg-[#18223A] hover:bg-[#1E293B] text-[#10B981] text-xs font-semibold rounded-xl border border-[#1E293B] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowDown size={12} /> + Child
                </button>
              </div>

              <button
                onClick={(e) => handleDeleteMember(selectedMember.id, e)}
                className="px-3 py-1.5 text-xs text-[#FB7185] hover:bg-[#FB7185]/10 rounded-xl transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SETUP WIZARD MODAL */}
      {isQuickBuilderOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsQuickBuilderOpen(false)}
        >
          <div 
            className="bg-[#121A2E] border border-[#1E293B] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <Sparkles size={18} className="text-[#10B981]" />
                Choose Family Tree Starting Point
              </h3>
              <button 
                onClick={() => setIsQuickBuilderOpen(false)} 
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#94A3B8]">
              Select where you'd like to anchor your tree. You can expand in any direction afterwards!
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <button
                onClick={handleStartWithMe}
                className="w-full text-left bg-[#18223A] hover:bg-[#1E293B] p-4 rounded-2xl border border-[#1E293B] hover:border-[#10B981] transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#F8FAFC] group-hover:text-[#10B981] transition flex items-center gap-1.5">
                    <span>⭐</span> Start with Me (Self)
                  </div>
                  <div className="text-[#94A3B8] text-[11px] mt-0.5">
                    Anchor yourself in the center. Easily add siblings on your side, parents above, and children below.
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#10B981] group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={handleStartWithParents}
                className="w-full text-left bg-[#18223A] hover:bg-[#1E293B] p-4 rounded-2xl border border-[#1E293B] hover:border-[#38BDF8] transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition flex items-center gap-1.5">
                    <span>👨‍👩‍👦</span> Start with Both Parents
                  </div>
                  <div className="text-[#94A3B8] text-[11px] mt-0.5">
                    Positions Father &amp; Mother side-by-side on Tier 3, with you connected as child.
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#38BDF8] group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={handleSeedStarterTree}
                className="w-full text-left bg-[#18223A] hover:bg-[#1E293B] p-4 rounded-2xl border border-[#1E293B] hover:border-[#FBBF24] transition flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-bold text-[#F8FAFC] group-hover:text-[#FBBF24] transition flex items-center gap-1.5">
                    <span>🏛️</span> Load Ancestral Lineage (Mom's Grandpa Downward)
                  </div>
                  <div className="text-[#94A3B8] text-[11px] mt-0.5">
                    Pre-loads Mom's Great-Grandfather down to Grandpa, Great-Uncle, Parents &amp; Self.
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#FBBF24] group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MEMBER MODAL FORM */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-[#121A2E] border border-[#1E293B] rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <Users size={18} className="text-[#10B981]" />
                {editingMemberId ? 'Edit Family Record' : 'Add Family Member'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#94A3B8] block mb-1 font-medium">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. RWEMERA Ally Hamis, Murebwayire Aisha, Grandpa..."
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#94A3B8] block mb-1 font-medium">Relationship in Family *</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                    placeholder="e.g. Self, Brother, Mother..."
                    list="relationship-suggestions"
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  />
                  <datalist id="relationship-suggestions">
                    {RELATIONSHIP_SUGGESTIONS.map(r => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1 font-medium">Organogram Tier Level</label>
                  <select
                    value={generation}
                    onChange={e => setGeneration(Number(e.target.value))}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  >
                    <option value={1}>Tier 1: Great-Grandparents / Root Era</option>
                    <option value={2}>Tier 2: Grandparents / Great-Uncles</option>
                    <option value={3}>Tier 3: Parents / Uncles / Aunts</option>
                    <option value={4}>Tier 4: Current Gen (Me &amp; Siblings)</option>
                    <option value={5}>Tier 5: Children &amp; Future Descendants</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1 font-medium">Parent in Tree (Upward Connection)</label>
                <select
                  value={selectedParentId}
                  onChange={e => setSelectedParentId(e.target.value)}
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                >
                  <option value="">None / Root / Independent</option>
                  {members.filter(m => m.id !== editingMemberId).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.relationship}, Tier {m.generation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#94A3B8] block mb-1 font-medium">Spouse / Partner Name</label>
                  <input
                    type="text"
                    value={spouseName}
                    onChange={e => setSpouseName(e.target.value)}
                    placeholder="Spouse name"
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1 font-medium">Branch / Clan Name</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    placeholder="e.g. Mom's Lineage, Rwemera Lineage"
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-center">
                <div>
                  <label className="text-[#94A3B8] block mb-1 font-medium">Birth Year</label>
                  <input
                    type="text"
                    value={birthYear}
                    onChange={e => setBirthYear(e.target.value)}
                    placeholder="e.g. 1972"
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1 font-medium">Living Status</label>
                  <button
                    type="button"
                    onClick={() => setIsAlive(!isAlive)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isAlive 
                        ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' 
                        : 'bg-[#291C0E] border-[#FBBF24]/50 text-[#FBBF24]'
                    }`}
                  >
                    {isAlive ? '🟢 Living' : '🕯️ Passed (Ancestor)'}
                  </button>
                </div>

                {!isAlive ? (
                  <div>
                    <label className="text-[#94A3B8] block mb-1 font-medium">Passed Year</label>
                    <input
                      type="text"
                      value={passedYear}
                      onChange={e => setPassedYear(e.target.value)}
                      placeholder="e.g. 2018"
                      className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="text-[11px] text-[#94A3B8] pt-4">
                    Active &amp; living relative
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#94A3B8] block mb-1 font-medium">Origin / Birthplace</label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={e => setBirthPlace(e.target.value)}
                    placeholder="e.g. Ngoma, Rwanda"
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1 font-medium">Occupation / Calling</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    placeholder="e.g. Civil Servant, Specialist..."
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1 font-medium">Memories, Wisdom &amp; Oral History</label>
                <textarea
                  rows={3}
                  value={notesBio}
                  onChange={e => setNotesBio(e.target.value)}
                  placeholder="Record stories, virtues, favorite sayings, notable deeds or memory eulogies..."
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl p-3 text-[#F8FAFC] focus:border-[#10B981] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMember}
                  disabled={!fullName.trim()}
                  className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {editingMemberId ? 'Update Record' : 'Save to Family Tree'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
