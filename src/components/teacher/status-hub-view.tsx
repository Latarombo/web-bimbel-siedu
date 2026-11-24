'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  hapusStatusPembelajaran,
  getStatusViewers,
  type StatusViewerItem,
} from '@/app/actions/teacher';
import type { ClassOption, ExistingStatus } from '@/components/teacher/status-form';
import { WhatsappStoryCreatorModal } from '@/components/teacher/whatsapp-story-creator-modal';
import { WhatsAppStoryRing } from '@/components/common/whatsapp-story-ring';
import {
  WhatsAppStoryViewerModal,
  type StorySlide,
} from '@/components/common/whatsapp-story-viewer-modal';
import { formatWhatsAppTime } from '@/lib/whatsapp-time';
import { compressImageFile } from '@/lib/image-compress';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Camera,
  Plus,
  Clock,
  Trash2,
  Users,
  Image as ImageIcon,
  Pencil,
  ChevronDown,
  Eye,
  X,
  Loader2,
} from 'lucide-react';

interface Props {
  classes: ClassOption[];
  pastStatuses: ExistingStatus[];
  guruName: string;
}

function buildSlidesFromStatuses(items: ExistingStatus[], authorFallback: string): StorySlide[] {
  const slides: StorySlide[] = [];

  for (const item of items) {
    const bgToken = item.mediaUrls?.find((u) => typeof u === 'string' && u.startsWith('bg:'));
    const photoUrls = item.mediaUrls?.filter((u) => typeof u === 'string' && !u.startsWith('bg:')) || [];
    const isTextOnly = photoUrls.length === 0;

    if (isTextOnly) {
      slides.push({
        statusId: item.id,
        authorName: authorFallback,
        authorRoleOrClass: item.kelasNama,
        avatarText: authorFallback.slice(0, 2).toUpperCase(),
        timestampFormatted: formatWhatsAppTime(item.diterbitkanPada),
        text: item.kontenTeks,
        isTextOnly: true,
        bgGradient: bgToken ? bgToken.slice(3) : 'bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-900',
        recipientCount: item.penerimaCount,
        viewCount: item.viewCount ?? 0,
      });
    } else {
      photoUrls.forEach((photoUrl, pIdx) => {
        slides.push({
          statusId: item.id,
          authorName: authorFallback,
          authorRoleOrClass: item.kelasNama,
          avatarText: authorFallback.slice(0, 2).toUpperCase(),
          timestampFormatted: formatWhatsAppTime(item.diterbitkanPada),
          text: pIdx === 0 ? item.kontenTeks : undefined,
          imageUrl: photoUrl,
          isTextOnly: false,
          recipientCount: item.penerimaCount,
          viewCount: item.viewCount ?? 0,
        });
      });
    }
  }

  return slides;
}

export function StatusHubView({ classes, pastStatuses, guruName }: Props) {
  const t = useTranslations('teacher');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [creatorInitialMode, setCreatorInitialMode] = useState<'photo' | 'text'>('photo');
  const [creatorPhotos, setCreatorPhotos] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Hidden file input untuk membuka pemilihan file foto langsung dari dropdown
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Story Viewer State (WhatsApp Fullscreen Player)
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerSlides, setViewerSlides] = useState<StorySlide[]>([]);
  const [viewerInitialIdx, setViewerInitialIdx] = useState(0);

  // Status yang sudah dilihat (disimpan di localStorage agar persisten)
  const [viewedStatusIds, setViewedStatusIds] = useState<Set<number>>(new Set());

  // State untuk dialog daftar penonton status
  const [viewersModalStatusId, setViewersModalStatusId] = useState<number | null>(null);
  const [viewersModalClassName, setViewersModalClassName] = useState<string>('');
  const [viewersList, setViewersList] = useState<StatusViewerItem[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);

  const handleOpenViewersModal = async (statusId: number, kelasNama: string) => {
    setViewersModalStatusId(statusId);
    setViewersModalClassName(kelasNama);
    setIsLoadingViewers(true);
    setViewersList([]);
    try {
      const res = await getStatusViewers(statusId);
      if (res.viewers) {
        setViewersList(res.viewers);
      }
    } catch (err) {
      console.error('Gagal memuat penonton status:', err);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('siedu_viewed_teacher_status_ids');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          setViewedStatusIds(new Set(arr));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const markStatusAsViewed = useCallback((statusId: number) => {
    setViewedStatusIds((prev) => {
      if (prev.has(statusId)) return prev;
      const updated = new Set(prev);
      updated.add(statusId);
      try {
        localStorage.setItem(
          'siedu_viewed_teacher_status_ids',
          JSON.stringify(Array.from(updated)),
        );
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletedStatusIds, setDeletedStatusIds] = useState<Set<number>>(new Set());

  // Filter status yang belum dihapus oleh guru
  const nonDeletedStatuses = pastStatuses.filter(
    (s) => !deletedStatusIds.has(s.id) && s.status !== 'dihapus_guru'
  );

  const nowIso = new Date().toISOString();
  // Status aktif (< 24 jam dan status = aktif)
  const activeStatuses = nonDeletedStatuses.filter(
    (s) => s.status === 'aktif' && s.kadaluarsaPada > nowIso
  );
  const latestActiveStatus = activeStatuses[0];

  // Status riwayat (kedaluwarsa > 24 jam atau berstatus diarsipkan)
  const archivedStatuses = nonDeletedStatuses.filter(
    (s) => s.status === 'diarsipkan' || (s.status === 'aktif' && s.kadaluarsaPada <= nowIso)
  );

  // Status aktif diurutkan secara kronologis (dari yang terbit paling awal hari ini ke yang terbaru)
  const orderedActiveStatuses = [...activeStatuses].sort(
    (a, b) => new Date(a.diterbitkanPada).getTime() - new Date(b.diterbitkanPada).getTime(),
  );

  // Status riwayat diurutkan dari yang paling baru kedaluwarsa ke yang lebih lama
  const orderedArchivedStatuses = [...archivedStatuses].sort(
    (a, b) => new Date(b.diterbitkanPada).getTime() - new Date(a.diterbitkanPada).getTime(),
  );

  // Jumlah status aktif yang sudah dilihat
  const myViewedCount = activeStatuses.filter((s) => viewedStatusIds.has(s.id)).length;

  // Status saya dianggap sudah dilihat jika semua status aktif telah dilihat
  const isMyStatusViewed =
    activeStatuses.length > 0 &&
    myViewedCount === activeStatuses.length;

  // Buka dialog pemilihan file langsung untuk opsi foto
  const handleOpenPhotoCreator = () => {
    photoFileInputRef.current?.click();
  };

  // Handler saat file foto dipilih dari folder / file picker native
  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    try {
      const compressedList: string[] = [];
      for (const f of files.slice(0, 5)) {
        const compressed = await compressImageFile(f);
        compressedList.push(compressed);
      }
      setCreatorPhotos(compressedList);
      setCreatorInitialMode('photo');
      setIsCreatorOpen(true);
    } catch (err) {
      console.error('Gagal memproses file foto status:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Buka editor status teks langsung
  const handleOpenTextCreator = () => {
    setCreatorPhotos([]);
    setCreatorInitialMode('text');
    setIsCreatorOpen(true);
  };

  // Buka penampil untuk Status Saya (HANYA status terbaru aktif secara urut, tanpa riwayat)
  const handleOpenMyStatus = () => {
    if (orderedActiveStatuses.length === 0) {
      handleOpenPhotoCreator();
      return;
    }
    const slides = buildSlidesFromStatuses(orderedActiveStatuses, guruName);
    if (slides.length === 0) return;

    // Mulai dari status pertama yang belum dilihat, atau dari awal jika sudah dilihat semua
    const firstUnviewedIdx = slides.findIndex((s) => !viewedStatusIds.has(s.statusId));
    setViewerSlides(slides);
    setViewerInitialIdx(firstUnviewedIdx >= 0 ? firstUnviewedIdx : 0);
    setIsViewerOpen(true);
  };

  // Buka penampil untuk item di seksi TERBARU (HANYA status terbaru aktif, tanpa riwayat)
  const handleOpenActiveStatus = (targetStatusId: number) => {
    markStatusAsViewed(targetStatusId);
    const slides = buildSlidesFromStatuses(orderedActiveStatuses, guruName);
    if (slides.length === 0) return;

    const foundIdx = slides.findIndex((s) => s.statusId === targetStatusId);
    setViewerSlides(slides);
    setViewerInitialIdx(foundIdx >= 0 ? foundIdx : 0);
    setIsViewerOpen(true);
  };

  // Buka penampil untuk item di seksi RIWAYAT (HANYA status riwayat kedaluwarsa, tanpa status aktif)
  const handleOpenArchivedStatus = (targetStatusId: number) => {
    markStatusAsViewed(targetStatusId);
    const slides = buildSlidesFromStatuses(orderedArchivedStatuses, guruName);
    if (slides.length === 0) return;

    const foundIdx = slides.findIndex((s) => s.statusId === targetStatusId);
    setViewerSlides(slides);
    setViewerInitialIdx(foundIdx >= 0 ? foundIdx : 0);
    setIsViewerOpen(true);
  };

  const handleDelete = (statusId: number) => {
    if (!window.confirm(t('deleteStatusConfirm') || 'Apakah Anda yakin ingin menghapus status ini?')) return;
    startTransition(async () => {
      setErrorMsg(null);
      setDeletedStatusIds((prev) => new Set(prev).add(statusId));
      const res = await hapusStatusPembelajaran({ statusId });
      if (res.error) {
        setErrorMsg(res.error);
        setDeletedStatusIds((prev) => {
          const next = new Set(prev);
          next.delete(statusId);
          return next;
        });
      } else {
        setSuccessMsg(t('statusDeletedSuccess') || 'Status berhasil dihapus.');
        // If viewer is currently viewing this deleted status, close it
        setIsViewerOpen(false);
      }
    });
  };

  const handleDeleteAllArchived = () => {
    if (archivedStatuses.length === 0) return;
    if (!window.confirm(`Apakah Anda yakin ingin menghapus seluruh ${archivedStatuses.length} status pada riwayat?`)) return;

    startTransition(async () => {
      setErrorMsg(null);
      const toDelete = archivedStatuses.map((s) => s.id);
      setDeletedStatusIds((prev) => {
        const next = new Set(prev);
        toDelete.forEach((id) => next.add(id));
        return next;
      });

      let failed = false;
      for (const item of archivedStatuses) {
        const res = await hapusStatusPembelajaran({ statusId: item.id });
        if (res.error) {
          setErrorMsg(res.error);
          failed = true;
          break;
        }
      }
      if (!failed) {
        setSuccessMsg('Seluruh riwayat status berhasil dibersihkan.');
      }
    });
  };

  const initials =
    guruName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'GU';

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. WHATSAPP TRAY: ROW STATUS SAYA (Matching status.png)                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Avatar Ring with Plus Badge */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={handleOpenMyStatus}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full transition-transform active:scale-95 cursor-pointer"
                title={activeStatuses.length > 0 ? "Klik untuk melihat status Anda" : "Klik untuk membuat status"}
              >
                <WhatsAppStoryRing
                  count={activeStatuses.length}
                  viewedCount={myViewedCount}
                  viewedSegments={orderedActiveStatuses.map((s) => viewedStatusIds.has(s.id))}
                  size={58}
                  strokeWidth={2.5}
                  gap={3}
                >
                  <div className="flex size-11.5 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-inner">
                    {initials}
                  </div>
                </WhatsAppStoryRing>
              </button>

              {/* Plus Badge with Popover Dropdown (Foto & Video / Teks) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="absolute -bottom-0.5 -right-0.5 z-20 grid size-5.5 place-items-center rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-400 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    title="Buat Pembaruan Status"
                    aria-label="Buat pembaruan status"
                  >
                    <Plus className="size-3.5 stroke-[3]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-48 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
                >
                  <DropdownMenuItem
                    onClick={handleOpenPhotoCreator}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 w-full text-left">
                      <ImageIcon className="size-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
                      <span>Foto & Video</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleOpenTextCreator}
                    className="w-full cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 w-full text-left">
                      <Pencil className="size-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
                      <span>Teks</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Subtitle info (clickable to view status) */}
            <div
              onClick={handleOpenMyStatus}
              className="min-w-0 cursor-pointer group/title"
              title={activeStatuses.length > 0 ? "Klik untuk melihat status Anda" : "Klik untuk membuat status"}
            >
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover/title:text-emerald-600 dark:group-hover/title:text-emerald-400 transition-colors">
                Status saya
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {latestActiveStatus
                  ? `${formatWhatsAppTime(latestActiveStatus.diterbitkanPada)} (Klik untuk melihat)`
                  : 'Klik untuk membuat pembaruan status'}
              </p>
            </div>
          </div>

          {/* Tombol Aksi Tambah Status */}
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 active:scale-[0.98] px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="size-4 shrink-0" />
                  <span>Tambah Status</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
              >
                <DropdownMenuItem
                  onClick={handleOpenPhotoCreator}
                  className="w-full cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 w-full text-left">
                    <ImageIcon className="size-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
                    <span>Foto & Video</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleOpenTextCreator}
                  className="w-full cursor-pointer rounded-lg px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5 w-full text-left">
                    <Pencil className="size-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
                    <span>Teks</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SEKSI TERBARU (PEMBARUAN TERKINI - Matching status.png)                */}
      {/* ========================================================================= */}
      {activeStatuses.length > 0 && (
        <section className="space-y-3">
          <div className="px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              TERBARU
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
            {activeStatuses.map((item) => {
              const photoUrls = item.mediaUrls?.filter((u) => typeof u === 'string' && !u.startsWith('bg:')) || [];
              const bgToken = item.mediaUrls?.find((u) => typeof u === 'string' && u.startsWith('bg:'));
              const isTextOnly = photoUrls.length === 0;
              const photoCount = photoUrls.length;
              const isThisStatusViewed = viewedStatusIds.has(item.id);
              const rawBg = bgToken ? bgToken.slice(3) : '#00a884';
              const isInlineBg = rawBg.startsWith('#') || rawBg.includes('(');
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group/row cursor-pointer"
                  onClick={() => handleOpenActiveStatus(item.id)}
                  title="Klik untuk melihat status ini"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Segmented Ring Avatar (Hijau jika baru, Abu-abu jika sudah dilihat) */}
                    <div className="shrink-0">
                      <WhatsAppStoryRing
                        count={photoCount > 0 ? photoCount : 1}
                        viewedCount={isThisStatusViewed ? (photoCount > 0 ? photoCount : 1) : 0}
                        size={52}
                        strokeWidth={2.5}
                        gap={3}
                      >
                        {!isTextOnly ? (
                          <div className={`size-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border ${
                            isThisStatusViewed ? 'border-slate-300 dark:border-slate-700 opacity-80' : 'border-slate-200 dark:border-slate-700'
                          }`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoUrls[0]}
                              alt={item.kelasNama}
                              className="size-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            style={isInlineBg ? { background: rawBg } : undefined}
                            className={`flex size-10 items-center justify-center rounded-full p-1 overflow-hidden border shadow-inner select-none transition-transform ${
                              !isInlineBg ? rawBg : ''
                            } ${
                              isThisStatusViewed
                                ? 'border-slate-300 dark:border-slate-700 opacity-80'
                                : 'border-white/20'
                            }`}
                            title={item.kontenTeks}
                          >
                            <span className="text-[9px] font-bold text-white text-center line-clamp-2 leading-tight break-words px-0.5">
                              {item.kontenTeks || 'Status'}
                            </span>
                          </div>
                        )}
                      </WhatsAppStoryRing>
                    </div>

                    {/* Contact / Class Info & Time */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover/row:text-emerald-600 dark:group-hover/row:text-emerald-400 transition-colors">
                        {item.kelasNama}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatWhatsAppTime(item.diterbitkanPada)}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Viewers & Delete button) */}
                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenViewersModal(item.id, item.kelasNama);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Lihat siapa saja yang telah melihat status ini"
                    >
                      <Eye className="size-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                      <span>Dilihat oleh {item.viewCount ?? 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="size-8 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus status ini"
                      aria-label={`Hapus status ${item.kelasNama}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. SEKSI RIWAYAT (Collapsible / On-demand disclosure)                     */}
      {/* ========================================================================= */}
      {archivedStatuses.length > 0 && (
        <section className="space-y-3 pt-2">
          <div className="w-full px-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 rounded-lg py-1 transition-colors"
              aria-expanded={isHistoryOpen}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                RIWAYAT
              </span>
              <ChevronDown
                className={`size-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
                  isHistoryOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
              <span className="text-xs text-slate-500 font-medium ml-1">
                ({archivedStatuses.length} kedaluwarsa)
              </span>
            </button>

            {isHistoryOpen && (
              <button
                type="button"
                onClick={handleDeleteAllArchived}
                disabled={isPending}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                Hapus Semua Riwayat
              </button>
            )}
          </div>

          {isHistoryOpen && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs animate-in fade-in slide-in-from-top-2 duration-150">
              {archivedStatuses.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors opacity-80 hover:opacity-100 cursor-pointer group/hist"
                  onClick={() => handleOpenArchivedStatus(item.id)}
                  title="Klik untuk melihat status riwayat ini"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                      <Clock className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover/hist:text-emerald-600 dark:group-hover/hist:text-emerald-400 transition-colors">
                        {item.kelasNama}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatWhatsAppTime(item.diterbitkanPada)} · Kedaluwarsa (&gt; 24 jam)
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenViewersModal(item.id, item.kelasNama);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Lihat siapa saja yang telah melihat status ini"
                    >
                      <Eye className="size-3.5 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden="true" />
                      <span>Dilihat oleh {item.viewCount ?? 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                      className="size-8 grid place-items-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Hapus status kedaluwarsa ini"
                      aria-label={`Hapus status kedaluwarsa kelas ${item.kelasNama}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Hidden File Input untuk Opsi Foto & Video langsung dari file explorer */}
      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoFileSelected}
        className="hidden"
      />

      {/* WhatsApp / Instagram Immersive Story Creator Modal */}
      <WhatsappStoryCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => {
          setIsCreatorOpen(false);
          setCreatorPhotos([]);
        }}
        classes={classes}
        initialMode={creatorInitialMode}
        initialPhotos={creatorPhotos}
        onSuccess={() => {
          setSuccessMsg('Status kegiatan berhasil dibagikan ke orang tua murid.');
        }}
      />

      {/* WhatsApp Web Story Viewer Modal (Direct match to Screenshot 2026-11-24 132646.png) */}
      <WhatsAppStoryViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        slides={viewerSlides}
        initialSlideIdx={viewerInitialIdx}
        onDeleteStatus={handleDelete}
        onSlideViewed={markStatusAsViewed}
        isViewerParent={false}
      />

      {/* Modal Dialog Daftar Penonton Status */}
      {viewersModalStatusId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <header className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Eye className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Dilihat oleh ({viewersList.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px]">
                  {viewersModalClassName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewersModalStatusId(null)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup"
                aria-label="Tutup"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoadingViewers ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="size-6 animate-spin text-emerald-500" />
                  <p className="text-xs">Memuat daftar penonton...</p>
                </div>
              ) : viewersList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Eye className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">Belum ada yang melihat</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Orang tua murid yang membuka status ini akan tercatat di sini.</p>
                </div>
              ) : (
                viewersList.map((viewer) => {
                  const initial = viewer.userName?.slice(0, 2).toUpperCase() || 'WM';
                  return (
                    <div
                      key={viewer.userId}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {viewer.userName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Wali Murid
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formatWhatsAppTime(viewer.viewedAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <footer className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-right">
              <button
                type="button"
                onClick={() => setViewersModalStatusId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatusHubView;
