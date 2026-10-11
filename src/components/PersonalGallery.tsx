import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  X, 
  ZoomIn, 
  Calendar, 
  Tag, 
  Upload, 
  Filter,
  Check,
  Award,
  Sparkles
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { GalleryPhoto, GalleryCategory } from '../types';

const CATEGORIES: GalleryCategory[] = [
  'Milestones',
  'Certificates & Awards',
  'Work & Projects',
  'Personal',
  'Other'
];

export default function PersonalGallery({ onBack }: { onBack?: () => void }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // New photo form states
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<GalleryCategory>('Milestones');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  // Real-time Firestore query
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'gallery'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: GalleryPhoto[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as GalleryPhoto));

      // Sort by date descending
      items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setPhotos(items);
    });

    return () => unsubscribe();
  }, []);

  // Client-side image compression using Canvas
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.78 quality
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          setPreviewImage(compressed);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!auth.currentUser || !title.trim() || !previewImage) return;

    setIsUploading(true);
    try {
      await addDoc(collection(db, 'gallery'), {
        userId: auth.currentUser.uid,
        title: title.trim(),
        caption: caption.trim(),
        category,
        date,
        imageUrl: previewImage,
        createdAt: serverTimestamp()
      });

      // Reset form
      setTitle('');
      setCaption('');
      setCategory('Milestones');
      setDate(new Date().toISOString().split('T')[0]);
      setPreviewImage('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to add photo:', err);
      alert('Error saving photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this memory?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      if (lightboxPhoto?.id === id) {
        setLightboxPhoto(null);
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  const filteredPhotos = selectedCategory === 'All' 
    ? photos 
    : photos.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="bg-[#121A2E] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBack && (
              <button
                onClick={onBack}
                className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition mr-2 flex items-center gap-1"
              >
                ← Back to Dashboard
              </button>
            )}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">
              Personal Memories & Visual Archive
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] flex items-center gap-2.5">
            <Camera className="text-[#38BDF8]" size={26} />
            Personal Photo Gallery & Milestones
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Preserve your milestone moments, certificates, awards, and project pictures with your personal AI assistant.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 bg-[#38BDF8] hover:bg-[#0284C7] text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#38BDF8]/20 transition"
        >
          <Plus size={16} /> Add Photo or Milestone
        </button>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
            selectedCategory === 'All'
              ? 'bg-[#38BDF8] text-slate-950 font-bold'
              : 'bg-[#121A2E] text-[#94A3B8] border border-[#1E293B] hover:text-white'
          }`}
        >
          All Photos ({photos.length})
        </button>

        {CATEGORIES.map(cat => {
          const count = photos.filter(p => p.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? 'bg-[#38BDF8] text-slate-950 font-bold'
                  : 'bg-[#121A2E] text-[#94A3B8] border border-[#1E293B] hover:text-white'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* ADD PHOTO MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121A2E] border border-[#1E293B] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAdding(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-white transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <Upload size={18} className="text-[#38BDF8]" /> Upload Photo or Certificate
            </h3>

            <div className="space-y-3 text-xs">
              {/* Image Preview / Drag Drop Box */}
              <div>
                <label className="text-[#94A3B8] block mb-1">Select Picture *</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition overflow-hidden relative ${
                    isDragging 
                      ? 'border-[#38BDF8] bg-[#38BDF8]/10' 
                      : previewImage 
                        ? 'border-[#38BDF8]' 
                        : 'border-[#1E293B] hover:border-[#38BDF8]/60 bg-[#0B1020]'
                  }`}
                >
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-full h-full object-contain bg-black/40"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-4 pointer-events-none">
                      <ImageIcon size={32} className={`mx-auto mb-2 transition ${isDragging ? 'text-[#38BDF8] scale-110' : 'text-[#94A3B8] opacity-60'}`} />
                      <p className="text-[#F8FAFC] font-medium">
                        {isDragging ? 'Drop your certificate or image here!' : 'Click to choose file or drag & drop here'}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">JPEG, PNG, WebP (Automatically compressed & optimized)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#94A3B8]">Title / Milestone Name *</label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-[#64748B]">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTitle('Results Confirmation Copy');
                        setCategory('Certificates & Awards');
                        setCaption('NESA National Examination Senior 6 MEG Distinction (60/60 Aggregate score, Straight A).');
                      }}
                      className="text-[#38BDF8] hover:underline"
                    >
                      Results Copy
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTitle('Passport / Identification Photo');
                        setCategory('Personal');
                        setCaption('Official passport photograph for identity verification and academic accreditation.');
                      }}
                      className="text-[#38BDF8] hover:underline"
                    >
                      Passport Photo
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Results Confirmation Copy / POTI Peace Operations Diploma"
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#94A3B8] block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as GalleryCategory)}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#38BDF8] focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#94A3B8] block mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl px-3 py-2 text-[#F8FAFC] focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#94A3B8] block mb-1">Caption / Story Behind the Photo</label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Describe this milestone, what you achieved, who was with you, or key reflections..."
                  className="w-full bg-[#18223A] border border-[#1E293B] rounded-xl p-3 text-[#F8FAFC] focus:border-[#38BDF8] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={isUploading || !title.trim() || !previewImage}
                  className="px-5 py-2 bg-[#38BDF8] hover:bg-[#0284C7] text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {isUploading ? 'Saving...' : 'Save to Gallery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div 
            className="bg-[#121A2E] border border-[#1E293B] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
            >
              <X size={18} />
            </button>

            <div className="max-h-[60vh] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.title}
                className="max-h-[60vh] w-auto object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                    {lightboxPhoto.category}
                  </span>
                  <span className="text-[#94A3B8] font-mono">{lightboxPhoto.date}</span>
                </div>
                <button
                  onClick={(e) => handleDeletePhoto(lightboxPhoto.id, e)}
                  className="text-[#94A3B8] hover:text-[#FB7185] flex items-center gap-1 text-[11px] transition"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              <h3 className="text-lg font-bold text-[#F8FAFC]">{lightboxPhoto.title}</h3>

              {lightboxPhoto.caption && (
                <p className="text-[#94A3B8] leading-relaxed pt-1 text-xs">
                  {lightboxPhoto.caption}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PHOTOS GRID */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-[#121A2E] border border-dashed border-[#1E293B] rounded-2xl p-12 text-center text-xs text-[#94A3B8] space-y-3">
          <ImageIcon size={40} className="mx-auto text-[#38BDF8] opacity-40" />
          <p className="text-sm font-semibold text-[#F8FAFC]">No photos in this category yet</p>
          <p className="max-w-md mx-auto">
            Upload your personal certificates, milestone accomplishments, and work memories so your personal assistant can reference them when advising you.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-[#38BDF8] text-slate-950 font-bold rounded-xl inline-flex items-center gap-1.5 transition"
          >
            <Plus size={14} /> Add First Picture
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="bg-[#121A2E] rounded-2xl border border-[#1E293B] overflow-hidden group cursor-pointer hover:border-[#38BDF8]/50 transition duration-200 shadow-md flex flex-col"
            >
              <div className="h-44 overflow-hidden relative bg-[#0B1020]">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end justify-between p-3">
                  <span className="text-white text-xs flex items-center gap-1">
                    <ZoomIn size={14} /> View
                  </span>
                  <button
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    className="p-1.5 rounded-lg bg-black/60 text-[#94A3B8] hover:text-[#FB7185] transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <span className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-[#38BDF8] backdrop-blur-sm border border-white/10">
                  {photo.category}
                </span>
              </div>

              <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] truncate group-hover:text-[#38BDF8] transition">
                    {photo.title}
                  </h4>
                  {photo.caption && (
                    <p className="text-[11px] text-[#94A3B8] line-clamp-2 mt-0.5">
                      {photo.caption}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#94A3B8] pt-1">
                  <span>{photo.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
