'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { bagikanStatusPembelajaran } from '@/app/actions/teacher';
import type { ClassOption } from '@/components/teacher/status-form';
import { compressImageFile } from '@/lib/image-compress';
import {
  X,
  RotateCcw,
  RotateCw,
  Crop,
  Sparkles,
  Pencil,
  Type,
  Grid,
  Smile,
  SmilePlus,
  Download,
  Send,
  Loader2,
  Plus,
  Users,
  AlertTriangle,
  Palette,
  ChevronDown,
} from 'lucide-react';

/**
 * Mini SVG Segmented Status Ring icon ala WhatsApp
 */
function WhatsAppStatusPillIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 0 1 8.66 6.5" strokeDasharray="14 4" />
      <path d="M21 12a9 9 0 0 1-6.5 8.66" strokeDasharray="14 4" />
      <path d="M12 21a9 9 0 0 1-8.66-6.5" strokeDasharray="14 4" />
      <path d="M3 12A9 9 0 0 1 9.5 3.34" strokeDasharray="14 4" />
    </svg>
  );
}

// Preset warna solid status teks WhatsApp (Warna pertama persis Screenshot 2026-11-24 141517.png: Coral #f1787c)
const TEXT_BG_COLORS = [
  { name: 'Coral', value: '#f1787c' },
  { name: 'Teal', value: '#00a884' },
  { name: 'Amber', value: '#b9770e' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Crimson', value: '#e11d48' },
  { name: 'Slate', value: '#1e293b' },
];

// Preset font status teks WhatsApp
const TEXT_FONTS = [
  { name: 'Sans', className: 'font-sans font-medium' },
  { name: 'Serif', className: 'font-serif font-bold' },
  { name: 'Mono', className: 'font-mono font-bold tracking-tight' },
  { name: 'Display', className: 'font-sans font-extrabold uppercase tracking-wider' },
  { name: 'Italic', className: 'font-sans italic font-semibold' },
];

// Filter efek foto
const PHOTO_FILTERS = [
  { name: 'Asli', style: {} },
  { name: 'B&W', style: { filter: 'grayscale(100%) contrast(110%)' } },
  { name: 'Hangat', style: { filter: 'sepia(30%) saturate(140%)' } },
  { name: 'Sejuk', style: { filter: 'hue-rotate(180deg) saturate(110%)' } },
  { name: 'Vivid', style: { filter: 'contrast(125%) saturate(135%)' } },
];

// Quick emoji ribbon
const QUICK_EMOJIS = ['😀', '😂', '😍', '👏', '👍', '🙌', '📚', '✍️', '🎓', '🌟', '🏆', '💯'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassOption[];
  defaultClassId?: number;
  initialMode?: 'photo' | 'text';
  initialPhotos?: string[];
  onSuccess?: () => void;
}

export function WhatsappStoryCreatorModal({
  isOpen,
  onClose,
  classes,
  defaultClassId,
  initialMode = 'photo',
  initialPhotos = [],
  onSuccess,
}: Props) {
  const t = useTranslations('teacher');
  const [selectedClassId, setSelectedClassId] = useState<number>(
    defaultClassId ?? (classes.length > 0 ? classes[0].id : 0),
  );
  const [creatorMode, setCreatorMode] = useState<'photo' | 'text'>(initialMode);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [rotations, setRotations] = useState<number[]>([0, 0, 0, 0, 0]);
  const [activeFilterIdx, setActiveFilterIdx] = useState(0);
  const [isPixelated, setIsPixelated] = useState(false);
  const [caption, setCaption] = useState('');
  const [textStatus, setTextStatus] = useState('');
  const [textBgIdx, setTextBgIdx] = useState(0);
  const [textFontIdx, setTextFontIdx] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCompressing, setIsCompressing] = useState(false);

  const addPhotoInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const textTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Sinkronisasi saat modal dibuka ulang
  useEffect(() => {
    if (isOpen) {
      setCreatorMode(initialMode);
      setPhotos(initialPhotos);
      setActivePhotoIdx(0);
      setRotations([0, 0, 0, 0, 0]);
      setActiveFilterIdx(0);
      setIsPixelated(false);
      setCaption('');
      setTextStatus('');
      setErrorMsg(null);
      setShowEmojiPicker(false);
      setShowAudiencePicker(false);
      if (defaultClassId) setSelectedClassId(defaultClassId);
    }
  }, [isOpen, initialMode, initialPhotos, defaultClassId]);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId) ?? classes[0];
  const activePhoto = photos[activePhotoIdx];
  const currentRotation = rotations[activePhotoIdx] ?? 0;

  // Handler putar foto 90 derajat
  const handleRotateCurrentPhoto = () => {
    setRotations((prev) => {
      const copy = [...prev];
      copy[activePhotoIdx] = ((copy[activePhotoIdx] ?? 0) + 90) % 360;
      return copy;
    });
  };

  // Handler tambah foto tambahan ke filmstrip
  const handleAddMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (photos.length + files.length > 5) {
      setErrorMsg('Maksimal 5 foto per status kegiatan.');
      return;
    }
    setErrorMsg(null);
    setIsCompressing(true);
    try {
      const newPhotos: string[] = [];
      for (const f of files) {
        const compressed = await compressImageFile(f);
        newPhotos.push(compressed);
      }
      setPhotos((prev) => {
        const updated = [...prev, ...newPhotos].slice(0, 5);
        setActivePhotoIdx(updated.length - 1);
        return updated;
      });
    } catch {
      setErrorMsg('Gagal memproses berkas foto tambahan.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      if (activePhotoIdx >= updated.length) {
        setActivePhotoIdx(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  // Download foto saat ini
  const handleDownloadActivePhoto = () => {
    if (!activePhoto) return;
    const a = document.createElement('a');
    a.href = activePhoto;
    a.download = `siedu-status-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Sisipkan emoji ke input aktif
  const handleInsertEmoji = (emoji: string) => {
    if (creatorMode === 'photo') {
      setCaption((prev) => prev + emoji);
      captionInputRef.current?.focus();
    } else {
      setTextStatus((prev) => prev + emoji);
      textTextareaRef.current?.focus();
    }
  };

  // Kirim Status ke Server
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedClassId) {
      setErrorMsg(t('classSelectRequired'));
      return;
    }

    const finalContent = creatorMode === 'photo' ? caption.trim() : textStatus.trim();
    if (!finalContent && (creatorMode === 'text' || photos.length === 0)) {
      setErrorMsg(
        creatorMode === 'photo'
          ? 'Sertakan minimal 1 foto kegiatan atau keterangan pembelajaran.'
          : 'Ketik pesan atau pengumuman status sebelum mengirim.',
      );
      return;
    }

    const finalRecipients = currentClass?.students.map((s) => s.pendaftaranId) ?? [];
    if (finalRecipients.length === 0) {
      setErrorMsg('Tidak ada murid terdaftar pada kelas yang dipilih.');
      return;
    }

    startTransition(async () => {
      setErrorMsg(null);
      const res = await bagikanStatusPembelajaran({
        kelasId: selectedClassId,
        kontenTeks: finalContent,
        mediaUrls: creatorMode === 'photo' ? photos : [],
        photos: creatorMode === 'photo' ? photos : [],
        penerimaPendaftaranIds: finalRecipients,
        recipientPendaftaranIds: finalRecipients,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setCaption('');
        setTextStatus('');
        setPhotos([]);
        onSuccess?.();
        onClose();
      }
    });
  };

  const hasNoConsentStudents = currentClass?.students.some((s) => !s.persetujuanFoto);

  // =========================================================================
  // TAMPILAN 1: STATUS FOTO (PERSIS Screenshot 2026-11-24 141251.png)
  // =========================================================================
  if (creatorMode === 'photo') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-[#0b141a] text-white select-none animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Editor Status Foto WhatsApp"
      >
        {/* Hidden File Input untuk tambah foto */}
        <input
          ref={addPhotoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleAddMoreFiles}
          className="hidden"
        />

        {/* ------------------------------------------------------------- */}
        {/* TOP BAR EDITOR FOTO WHATSAPP                                  */}
        {/* ------------------------------------------------------------- */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
          {/* Sisi Kiri: Tutup, Undo, Redo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup editor"
              aria-label="Tutup"
            >
              <X className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCaption('');
                setRotations([0, 0, 0, 0, 0]);
                setActiveFilterIdx(0);
                setIsPixelated(false);
              }}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Batalkan perubahan (Undo)"
              aria-label="Undo"
            >
              <RotateCcw className="size-5" />
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full text-[#8696a0]/40 transition-colors cursor-not-allowed"
              title="Redo"
              aria-label="Redo"
              disabled
            >
              <RotateCw className="size-5" />
            </button>
          </div>

          {/* Sisi Tengah / Kanan: Toolbar Alat Kreatif (Persis Screenshot) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Rotate / Crop */}
            <button
              type="button"
              onClick={handleRotateCurrentPhoto}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Putar foto 90°"
            >
              <Crop className="size-5" />
            </button>

            {/* Magic Wand / Filter */}
            <button
              type="button"
              onClick={() => setActiveFilterIdx((prev) => (prev + 1) % PHOTO_FILTERS.length)}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                activeFilterIdx > 0
                  ? 'text-[#00a884] bg-white/15'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title={`Filter: ${PHOTO_FILTERS[activeFilterIdx].name}`}
            >
              <Sparkles className="size-5" />
            </button>

            {/* Pencil / Draw Tool */}
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Alat Gambar / Pensil"
            >
              <Pencil className="size-5" />
            </button>

            {/* Text Overlay Tool */}
            <button
              type="button"
              onClick={() => captionInputRef.current?.focus()}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tambahkan Teks"
            >
              <Type className="size-5" />
            </button>

            {/* Blur / Pixelate Tool */}
            <button
              type="button"
              onClick={() => setIsPixelated(!isPixelated)}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                isPixelated
                  ? 'text-[#00a884] bg-white/15'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title="Buramkan wajah / sensor"
            >
              <Grid className="size-5" />
            </button>

            {/* Emoji Tool */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                showEmojiPicker
                  ? 'text-[#00a884] bg-white/15'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title="Pilih Stiker & Emoji"
            >
              <Smile className="size-5" />
            </button>

            {/* Sticker Tool */}
            <button
              type="button"
              onClick={() => handleInsertEmoji('🌟')}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Stiker Cepat"
            >
              <SmilePlus className="size-5" />
            </button>

            {/* HD Badge */}
            <div
              className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-[#8696a0]/60 text-[10px] font-bold text-[#8696a0]"
              title="Kualitas Tinggi (HD)"
            >
              HD
            </div>
          </div>

          {/* Sisi Kanan: Unduh / Simpan */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadActivePhoto}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Unduh foto"
              aria-label="Unduh foto"
            >
              <Download className="size-5" />
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------- */}
        {/* CENTER CANVAS: FOTO KEGIATAN                                  */}
        {/* ------------------------------------------------------------- */}
        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          {activePhoto ? (
            <div className="relative flex items-center justify-center max-w-2xl max-h-[64vh] w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto}
                alt="Foto kegiatan yang dipilih"
                style={{
                  transform: `rotate(${currentRotation}deg)`,
                  ...(PHOTO_FILTERS[activeFilterIdx].style ?? {}),
                  ...(isPixelated ? { filter: 'blur(3px)' } : {}),
                }}
                className="max-h-[64vh] max-w-full object-contain rounded-sm shadow-2xl transition-all duration-200"
              />
            </div>
          ) : (
            <div className="text-center p-8 text-neutral-400 space-y-4">
              <p className="text-sm">Belum ada foto yang dipilih.</p>
              <button
                type="button"
                onClick={() => addPhotoInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-[#00a884] text-white text-xs font-bold hover:bg-[#02906f] cursor-pointer"
              >
                Pilih Berkas Foto
              </button>
            </div>
          )}

          {/* Emoji Ribbon Floating Popup */}
          {showEmojiPicker && (
            <div className="absolute top-2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-[#202c33] border border-[#2a3942] shadow-2xl animate-in fade-in slide-in-from-top-2">
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => handleInsertEmoji(em)}
                  className="text-xl hover:scale-125 transition-transform cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Banner Error jika ada */}
          {errorMsg && (
            <div className="absolute top-4 inset-x-6 z-40 max-w-md mx-auto rounded-xl bg-rose-600 text-white text-xs p-3 text-center shadow-2xl backdrop-blur-md">
              {errorMsg}
            </div>
          )}

          {/* Loading Indicator Kompresi */}
          {isCompressing && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs text-white">
              <Loader2 className="size-8 animate-spin text-[#00a884] mb-2" />
              <p className="text-xs font-semibold">Mengompresi foto kegiatan...</p>
            </div>
          )}
        </main>

        {/* ------------------------------------------------------------- */}
        {/* FILMSTRIP THUMBNAILS (Jika > 1 Foto atau Tombol Tambah +)     */}
        {/* ------------------------------------------------------------- */}
        {photos.length > 0 && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 shrink-0 overflow-x-auto">
            {photos.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative size-12 shrink-0 rounded-md overflow-hidden border-2 cursor-pointer transition-transform ${
                  idx === activePhotoIdx
                    ? 'border-[#00a884] scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Thumb ${idx + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(idx);
                  }}
                  className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-black/80 text-white hover:bg-rose-600 transition-colors"
                  title="Hapus foto"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}

            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => addPhotoInputRef.current?.click()}
                className="grid size-12 place-items-center rounded-md border border-dashed border-[#8696a0]/50 bg-white/5 hover:bg-white/10 text-[#8696a0] hover:text-white transition-colors cursor-pointer"
                title="Tambah foto (Maks 5)"
              >
                <Plus className="size-5" />
              </button>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM BAR: TAMBAH KETERANGAN & TOMBOL KIRIM PERSIS SCREENSHOT */}
        {/* ------------------------------------------------------------- */}
        <footer className="px-4 sm:px-8 pb-6 pt-2 shrink-0 space-y-3 max-w-4xl mx-auto w-full">
          {/* Kolom Tambah Keterangan dengan tombol Emoji di kanan (Persis Screenshot) */}
          <div className="relative flex items-center bg-[#202c33] rounded-lg px-4 py-3 border border-transparent focus-within:border-[#00a884]/60 transition-colors">
            <input
              ref={captionInputRef}
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Tambah keterangan"
              className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-[#8696a0]"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-[#8696a0] hover:text-white transition-colors cursor-pointer ml-2"
              title="Sisipkan emoji"
            >
              <Smile className="size-5" />
            </button>
          </div>

          {/* Baris Audiens Pill di Kiri & Tombol Kirim Hijau Bulat di Kanan */}
          <div className="flex items-center justify-between pt-1">
            {/* Pill Audiens: (Kontak) status */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAudiencePicker(!showAudiencePicker)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <WhatsAppStatusPillIcon className="size-3.5 text-white/80" />
                <span className="truncate max-w-[200px] sm:max-w-xs">
                  {currentClass ? `(Kontak) status · ${currentClass.nama}` : '(Kontak) status'}
                </span>
                <ChevronDown className="size-3 text-white/70" />
              </button>

              {/* Popover Pilih Kelas */}
              {showAudiencePicker && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-[#111b21] border border-[#2a3942] p-3 shadow-2xl z-50 text-xs space-y-2">
                  <p className="font-bold text-white text-xs border-b border-[#2a3942] pb-1.5">
                    Pilih Kelas Penerima Status
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setShowAudiencePicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition-colors flex items-center justify-between ${
                          cls.id === selectedClassId
                            ? 'bg-[#00a884] text-white font-bold'
                            : 'text-[#8696a0] hover:bg-[#202c33] hover:text-white'
                        }`}
                      >
                        <span className="truncate">{cls.nama}</span>
                        <span className="text-[10px] opacity-75 shrink-0 ml-2">
                          {cls.students.length} murid
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasNoConsentStudents && (
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-300">
                  <AlertTriangle className="size-3 shrink-0 text-amber-400" />
                  <span>Ada murid belum menyetujui izin publikasi foto.</span>
                </div>
              )}
            </div>

            {/* Tombol Kirim Hijau Bulat WhatsApp */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isPending || isCompressing || photos.length === 0}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-[#00a884] hover:bg-[#02906f] text-white shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
              title="Kirim status ke orang tua"
            >
              {isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-5 ml-0.5 fill-current" />
              )}
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // TAMPILAN 2: STATUS TEKS (PERSIS Screenshot 2026-11-24 141517.png)
  // =========================================================================
  const activeBgColor = TEXT_BG_COLORS[textBgIdx].value;
  const activeFont = TEXT_FONTS[textFontIdx];

  return (
    <div
      style={{ backgroundColor: activeBgColor }}
      className="fixed inset-0 z-50 flex flex-col text-white select-none transition-colors duration-300 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Editor Status Teks WhatsApp"
    >
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR EDITOR TEKS WHATSAPP (Persis Screenshot)              */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 px-6 flex items-center justify-between z-20 shrink-0">
        {/* Sisi Kiri: Tombol Tutup X Putih Bersih */}
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Tutup editor"
          aria-label="Tutup"
        >
          <X className="size-6" />
        </button>

        {/* Sisi Kanan: Emoji, Ganti Font (Aa), Ganti Warna Latar (Palette) */}
        <div className="flex items-center gap-3">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
              showEmojiPicker ? 'bg-white/20 text-white' : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
            title="Pilih Emoji"
          >
            <Smile className="size-6" />
          </button>

          {/* Ganti Font (Aa) */}
          <button
            type="button"
            onClick={() => setTextFontIdx((prev) => (prev + 1) % TEXT_FONTS.length)}
            className="grid size-10 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 text-lg font-bold transition-colors cursor-pointer"
            title={`Font: ${activeFont.name}`}
          >
            Aa
          </button>

          {/* Ganti Warna Latar (Palette) */}
          <button
            type="button"
            onClick={() => setTextBgIdx((prev) => (prev + 1) % TEXT_BG_COLORS.length)}
            className="grid size-10 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={`Warna: ${TEXT_BG_COLORS[textBgIdx].name}`}
          >
            <Palette className="size-6" />
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* CENTER CANVAS: TEKS STATUS BESAR & TERPUSAT (Persis Screenshot)*/}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 flex items-center justify-center px-6 relative">
        <textarea
          ref={textTextareaRef}
          autoFocus
          value={textStatus}
          onChange={(e) => setTextStatus(e.target.value)}
          placeholder="Ketik status..."
          rows={4}
          className={`w-full max-w-4xl text-center text-white placeholder-white/50 text-4xl sm:text-5xl md:text-6xl bg-transparent border-0 outline-none resize-none leading-tight overflow-hidden focus:ring-0 ${activeFont.className}`}
        />

        {/* Floating Emoji Ribbon */}
        {showEmojiPicker && (
          <div className="absolute top-2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-2">
            {QUICK_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => handleInsertEmoji(em)}
                className="text-xl hover:scale-125 transition-transform cursor-pointer"
              >
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="absolute top-4 inset-x-6 z-40 max-w-md mx-auto rounded-xl bg-rose-600 text-white text-xs p-3 text-center shadow-2xl backdrop-blur-md">
            {errorMsg}
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM BAR: PILL AUDIENS (Kiri) & TOMBOL KIRIM BULAT HIJAU (Kanan) */}
      {/* ------------------------------------------------------------- */}
      <footer className="px-6 py-6 flex items-center justify-between shrink-0">
        {/* Pill Audiens: (Kontak) status (Persis Screenshot) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAudiencePicker(!showAudiencePicker)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white backdrop-blur-xs transition-colors cursor-pointer"
          >
            <WhatsAppStatusPillIcon className="size-3.5 text-white/90" />
            <span className="truncate max-w-[200px] sm:max-w-xs">
              {currentClass ? `(Kontak) status · ${currentClass.nama}` : '(Kontak) status'}
            </span>
            <ChevronDown className="size-3 text-white/70" />
          </button>

          {/* Popover Pilih Kelas */}
          {showAudiencePicker && (
            <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-neutral-900 border border-neutral-700 p-3 shadow-2xl z-50 text-xs space-y-2">
              <p className="font-bold text-white text-xs border-b border-neutral-800 pb-1.5">
                Pilih Kelas Penerima Status
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setShowAudiencePicker(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition-colors flex items-center justify-between ${
                      cls.id === selectedClassId
                        ? 'bg-[#00a884] text-white font-bold'
                        : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span className="truncate">{cls.nama}</span>
                    <span className="text-[10px] opacity-75 shrink-0 ml-2">
                      {cls.students.length} murid
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tombol Kirim Hijau Bulat WhatsApp */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isPending || !textStatus.trim()}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-[#00a884] hover:bg-[#02906f] text-white shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
          title="Kirim status ke orang tua"
        >
          {isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5 ml-0.5 fill-current" />
          )}
        </button>
      </footer>
    </div>
  );
}

export default WhatsappStoryCreatorModal;
