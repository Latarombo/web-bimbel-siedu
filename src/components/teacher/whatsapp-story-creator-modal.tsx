'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
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
  Smile,
  Download,
  SendHorizontal,
  Loader2,
  Plus,
  AlertTriangle,
  Palette,
  ChevronDown,
  Square,
  Circle,
  Minus,
  ArrowRight,
  GripVertical,
  Columns,
  Check,
  Trash2,
} from 'lucide-react';

/**
 * WhatsApp Web Mosaic / Blur Dot Matrix Icon (Screenshot 2026-11-24 230459.png)
 */
function WhatsAppBlurIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="3.5" r="1.3" />
      <circle cx="8" cy="5" r="1.3" />
      <circle cx="12" cy="7" r="1.3" />
      <circle cx="16" cy="5" r="1.3" />
      <circle cx="4.5" cy="8.5" r="1.3" />
      <circle cx="8" cy="9.5" r="1.3" />
      <circle cx="12" cy="10.5" r="1.3" />
      <circle cx="16" cy="9.5" r="1.3" />
      <circle cx="19.5" cy="8.5" r="1.3" />
      <circle cx="3.5" cy="12" r="1.3" />
      <circle cx="7" cy="13" r="1.3" />
      <circle cx="10.5" cy="13.5" r="1.3" />
      <circle cx="13.5" cy="13.5" r="1.3" />
      <circle cx="17" cy="13" r="1.3" />
      <circle cx="20.5" cy="12" r="1.3" />
      <circle cx="4.5" cy="15.5" r="1.3" />
      <circle cx="8" cy="16.5" r="1.3" />
      <circle cx="12" cy="17" r="1.3" />
      <circle cx="16" cy="16.5" r="1.3" />
      <circle cx="19.5" cy="15.5" r="1.3" />
      <circle cx="8" cy="19.5" r="1.3" />
      <circle cx="12" cy="20.5" r="1.3" />
      <circle cx="16" cy="19.5" r="1.3" />
    </svg>
  );
}

// 8 Pilihan Warna Toolbar Teks WhatsApp (Screenshot 2026-11-24 230655.png)
const TEXT_PALETTE_COLORS = [
  '#212529', // Black / Charcoal
  '#868e96', // Slate Grey
  '#ffffff', // White
  '#22b8cf', // Cyan
  '#51cf66', // Lime Green
  '#cc5de8', // Purple
  '#ff922b', // Orange
  '#ff6b6b', // Red
];

// Pilihan Font Teks Toolbar WhatsApp
const TEXT_FONT_OPTIONS = ['Sans Serif', 'Serif', 'Mono', 'Display'];

// Pilihan Warna Stroke & Fill Shape
const SHAPE_PALETTE_COLORS = [
  '#000000',
  '#ffffff',
  '#25D366',
  '#ff4a4a',
  '#33ceff',
  '#f49226',
  '#cc5de8',
  '#ffd43b',
];

// Pilihan Ukuran Coretan Pensil
const PEN_STROKE_SIZES = [
  { label: 'Tipis', size: 3 },
  { label: 'Sedang', size: 6 },
  { label: 'Tebal', size: 12 },
  { label: 'Ekstra', size: 22 },
];

export type OverlayElement =
  | {
      id: string;
      type: 'text';
      text: string;
      x: number; // percentage center (0-100)
      y: number; // percentage center (0-100)
      rotation: number; // degrees (0-360)
      color: string;
      fontName: string;
      hasBackground: boolean;
    }
  | {
      id: string;
      type: 'shape';
      shapeType: 'rect' | 'circle' | 'line' | 'arrow';
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      strokeColor: string;
      fillColor: string; // 'transparent' or color hex
      strokeWidth: number;
    }
  | {
      id: string;
      type: 'blur';
      blurType: 'pixelate' | 'gaussian';
      intensity: number; // 6 to 30
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      id: string;
      type: 'emoji';
      emoji: string;
      x: number;
      y: number;
      size: number;
      rotation: number;
    };

/**
 * Mini SVG Segmented Status Ring icon ala WhatsApp
 */
function WhatsAppStatusPillIcon({ className = 'size-4' }: { className?: string }) {
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

// Preset warna solid dan gradien status teks WhatsApp
const TEXT_BG_COLORS = [
  // Solid Colors
  { name: 'Coral', value: '#f1787c' },
  { name: 'Teal', value: '#00a884' },
  { name: 'Amber', value: '#b9770e' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Crimson', value: '#e11d48' },
  { name: 'Slate', value: '#1e293b' },
  // Gradients
  { name: 'Sunset Glow', value: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)' },
  { name: 'Emerald Ocean', value: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%)' },
  { name: 'Cosmic Violet', value: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f43f5e 100%)' },
  { name: 'Midnight Blue', value: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)' },
  { name: 'Warm Amber', value: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)' },
  { name: 'Aurora Borealis', value: 'linear-gradient(135deg, #0284c7 0%, #10b981 50%, #84cc16 100%)' },
  { name: 'Twilight Berry', value: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' },
];

// Preset font status teks WhatsApp
const TEXT_FONTS = [
  { name: 'Sans', className: 'font-sans font-medium' },
  { name: 'Serif', className: 'font-serif font-bold' },
  { name: 'Mono', className: 'font-mono font-bold tracking-tight' },
  { name: 'Display', className: 'font-sans font-extrabold uppercase tracking-wider' },
  { name: 'Italic', className: 'font-sans italic font-semibold' },
];

// Filter efek foto kamera
const PHOTO_FILTERS = [
  { id: 'asli', name: 'Asli', style: {} },
  { id: 'bw', name: 'B&W', style: { filter: 'grayscale(100%) contrast(110%)' } },
  { id: 'warm', name: 'Hangat', style: { filter: 'sepia(35%) saturate(140%)' } },
  { id: 'cool', name: 'Sejuk', style: { filter: 'hue-rotate(180deg) saturate(110%)' } },
  { id: 'vivid', name: 'Sinematik', style: { filter: 'contrast(125%) saturate(135%)' } },
  { id: 'vintage', name: 'Vintage', style: { filter: 'sepia(55%) contrast(95%) brightness(105%)' } },
  { id: 'dramatic', name: 'Dramatis', style: { filter: 'contrast(150%) brightness(95%)' } },
];

// Palet warna pena menggambar
const PEN_COLORS = [
  '#00a884',
  '#ffffff',
  '#000000',
  '#ef4444',
  '#eab308',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
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

  // Creative Tools States (Pen, Text Overlay, Shape, Emoji, Filter, Crop)
  const [isPenActive, setIsPenActive] = useState(false);
  const [penColor, setPenColor] = useState('#00a884');
  const [penWidth, setPenWidth] = useState(4);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  const [showPenPalette, setShowPenPalette] = useState(false);
  const [showThemePalette, setShowThemePalette] = useState(false);
  const [showFilterCarousel, setShowFilterCarousel] = useState(false);
  const [showShapePicker, setShowShapePicker] = useState(false);

  // Crop & Rotate State
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const photoWrapperRef = useRef<HTMLDivElement>(null);
  const isDraggingCropRef = useRef<string | null>(null);
  const cropStartPosRef = useRef<{ startX: number; startY: number; initialRect: { x: number; y: number; width: number; height: number } }>({
    startX: 0,
    startY: 0,
    initialRect: { x: 0, y: 0, width: 100, height: 100 },
  });

  // Overlay Elements Array (Persistent placed items on photo: Text, Shape, Blur, Emoji)
  const [overlayElements, setOverlayElements] = useState<OverlayElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [penStrokeSize, setPenStrokeSize] = useState<number>(6);

  const isDraggingElementRef = useRef<{
    mode: 'move' | 'resize' | 'rotate';
    elementId: string;
    handle?: string;
    startX: number;
    startY: number;
    initialElem: OverlayElement;
  } | null>(null);

  // Drawing Canvas History (for Undo / Redo)
  const [historyStack, setHistoryStack] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const isDrawingRef = useRef(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCompressing, setIsCompressing] = useState(false);

  const addPhotoInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const textTextareaRef = useRef<HTMLTextAreaElement>(null);
  const photoTextInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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
      setShowThemePalette(false);
      setShowFilterCarousel(false);
      setShowShapePicker(false);
      setIsCropMode(false);
      setCropRect({ x: 0, y: 0, width: 100, height: 100 });
      setIsPenActive(false);
      setShowPenPalette(false);
      setOverlayElements([]);
      setSelectedElementId(null);
      setPenStrokeSize(6);
      setHistoryStack([]);
      setRedoStack([]);
      if (defaultClassId) setSelectedClassId(defaultClassId);
    }
  }, [isOpen, initialMode, initialPhotos, defaultClassId]);

  const activePhoto = photos[activePhotoIdx];
  const currentRotation = rotations[activePhotoIdx] ?? 0;
  const selectedElement = overlayElements.find((el) => el.id === selectedElementId) ?? null;

  // Clear or resize drawing canvas when photo changes
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const rect = img.getBoundingClientRect();
    const width = Math.round(rect.width) || img.clientWidth || img.naturalWidth || 600;
    const height = Math.round(rect.height) || img.clientHeight || img.naturalHeight || 450;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const blankState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistoryStack([blankState]);
      setRedoStack([]);
    }
  }, []);

  useEffect(() => {
    if (activePhoto) {
      const timer = setTimeout(initCanvas, 150);
      return () => clearTimeout(timer);
    }
  }, [activePhoto, currentRotation, initCanvas]);

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.id === selectedClassId) ?? classes[0];

  // Rotasi Fisik Citra: Langsung memutar foto pada offscreen canvas sehingga lebar dan tinggi bertukar alami
  // Menghilangkan 100% ruang kosong / letterbox saat pemotongan (crop)
  const physicallyRotateActivePhoto = (direction: 'cw' | 'ccw' = 'cw') => {
    if (!activePhoto) return;
    const img = new Image();
    img.onload = () => {
      const offscreen = document.createElement('canvas');
      offscreen.width = img.height;
      offscreen.height = img.width;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      ctx.translate(offscreen.width / 2, offscreen.height / 2);
      ctx.rotate(direction === 'cw' ? Math.PI / 2 : -Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedDataUrl = offscreen.toDataURL('image/jpeg', 0.92);

      setPhotos((prev) => {
        const copy = [...prev];
        copy[activePhotoIdx] = rotatedDataUrl;
        return copy;
      });
      setCropRect({ x: 0, y: 0, width: 100, height: 100 });
    };
    img.src = activePhoto;
  };

  const handleRotateForward = () => {
    physicallyRotateActivePhoto('cw');
  };

  const handleRotateBackward = () => {
    physicallyRotateActivePhoto('ccw');
  };

  // Handler reset crop & rotasi
  const handleResetCropAndRotation = () => {
    setCropRect({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Terapkan hasil potongan (crop) ke foto aktif
  const handleApplyCrop = () => {
    if (!activePhoto) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const sx = (cropRect.x / 100) * img.width;
      const sy = (cropRect.y / 100) * img.height;
      const sw = (cropRect.width / 100) * img.width;
      const sh = (cropRect.height / 100) * img.height;

      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

      setPhotos((prev) => {
        const copy = [...prev];
        copy[activePhotoIdx] = croppedDataUrl;
        return copy;
      });
      setIsCropMode(false);
      setCropRect({ x: 0, y: 0, width: 100, height: 100 });
    };
    img.src = activePhoto;
  };

  // Handler seret handle crop (8 titik pembatas)
  const handleCropHandlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingCropRef.current = handle;
    cropStartPosRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialRect: { ...cropRect },
    };

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!isDraggingCropRef.current || !photoWrapperRef.current) return;
      const containerRect = photoWrapperRef.current.getBoundingClientRect();
      const deltaXPct = ((moveEvt.clientX - cropStartPosRef.current.startX) / containerRect.width) * 100;
      const deltaYPct = ((moveEvt.clientY - cropStartPosRef.current.startY) / containerRect.height) * 100;
      const init = cropStartPosRef.current.initialRect;
      const mode = isDraggingCropRef.current;

      setCropRect(() => {
        let { x, y, width, height } = init;

        if (mode === 'move') {
          x = Math.max(0, Math.min(100 - width, init.x + deltaXPct));
          y = Math.max(0, Math.min(100 - height, init.y + deltaYPct));
          return { x, y, width, height };
        }

        if (mode.includes('l')) {
          const newX = Math.max(0, Math.min(init.x + init.width - 10, init.x + deltaXPct));
          width = init.x + init.width - newX;
          x = newX;
        }
        if (mode.includes('r')) {
          width = Math.max(10, Math.min(100 - init.x, init.width + deltaXPct));
        }
        if (mode.includes('t')) {
          const newY = Math.max(0, Math.min(init.y + init.height - 10, init.y + deltaYPct));
          height = init.y + init.height - newY;
          y = newY;
        }
        if (mode.includes('b')) {
          height = Math.max(10, Math.min(100 - init.y, init.height + deltaYPct));
        }

        return { x, y, width, height };
      });
    };

    const onPointerUp = () => {
      isDraggingCropRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Helper manipulasi Overlay Elements
  const updateElement = (id: string, updates: Partial<OverlayElement>) => {
    setOverlayElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...updates } as OverlayElement) : el))
    );
  };

  const removeElement = (id: string) => {
    setOverlayElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  // Seret (Move) posisi elemen di atas foto
  const handleElementPointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElementId(id);
    setIsPenActive(false);
    setShowPenPalette(false);

    const elem = overlayElements.find((el) => el.id === id);
    if (!elem) return;

    isDraggingElementRef.current = {
      mode: 'move',
      elementId: id,
      startX: e.clientX,
      startY: e.clientY,
      initialElem: { ...elem },
    };

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!isDraggingElementRef.current || !photoWrapperRef.current) return;
      const { elementId, startX, startY, initialElem } = isDraggingElementRef.current;
      const containerRect = photoWrapperRef.current.getBoundingClientRect();
      const deltaXPct = ((moveEvt.clientX - startX) / containerRect.width) * 100;
      const deltaYPct = ((moveEvt.clientY - startY) / containerRect.height) * 100;

      updateElement(elementId, {
        x: Math.max(5, Math.min(95, Math.round(initialElem.x + deltaXPct))),
        y: Math.max(5, Math.min(95, Math.round(initialElem.y + deltaYPct))),
      });
    };

    const onPointerUp = () => {
      isDraggingElementRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Ubah ukuran (Resize) elemen via handle pembatas
  const handleElementHandlePointerDown = (id: string, handle: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElementId(id);

    const elem = overlayElements.find((el) => el.id === id);
    if (!elem) return;

    isDraggingElementRef.current = {
      mode: 'resize',
      elementId: id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialElem: { ...elem },
    };

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!isDraggingElementRef.current || !photoWrapperRef.current) return;
      const { elementId, handle: h, startX, startY, initialElem } = isDraggingElementRef.current;
      const containerRect = photoWrapperRef.current.getBoundingClientRect();
      const deltaXPct = ((moveEvt.clientX - startX) / containerRect.width) * 100;
      const deltaYPct = ((moveEvt.clientY - startY) / containerRect.height) * 100;

      if (initialElem.type === 'shape' || initialElem.type === 'blur') {
        let width = initialElem.width;
        let height = initialElem.height;
        if (h?.includes('r')) width = Math.max(8, Math.min(95, initialElem.width + deltaXPct * 2));
        if (h?.includes('l')) width = Math.max(8, Math.min(95, initialElem.width - deltaXPct * 2));
        if (h?.includes('b')) height = Math.max(6, Math.min(95, initialElem.height + deltaYPct * 2));
        if (h?.includes('t')) height = Math.max(6, Math.min(95, initialElem.height - deltaYPct * 2));
        updateElement(elementId, { width: Math.round(width), height: Math.round(height) });
      } else if (initialElem.type === 'emoji') {
        const deltaMax = Math.max(Math.abs(deltaXPct), Math.abs(deltaYPct));
        const sign = deltaXPct > 0 || deltaYPct > 0 ? 1 : -1;
        const newSize = Math.max(
          24,
          Math.min(180, Math.round(initialElem.size + sign * deltaMax * 1.5))
        );
        updateElement(elementId, { size: newSize });
      }
    };

    const onPointerUp = () => {
      isDraggingElementRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Putar (Rotate) elemen via handle tuas atas
  const handleElementRotatePointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElementId(id);

    const elem = overlayElements.find((el) => el.id === id);
    if (!elem) return;

    isDraggingElementRef.current = {
      mode: 'rotate',
      elementId: id,
      startX: e.clientX,
      startY: e.clientY,
      initialElem: { ...elem },
    };

    const onPointerMove = (moveEvt: PointerEvent) => {
      if (!isDraggingElementRef.current || !photoWrapperRef.current) return;
      const { elementId, initialElem } = isDraggingElementRef.current;
      const containerRect = photoWrapperRef.current.getBoundingClientRect();
      const cx = containerRect.left + (initialElem.x / 100) * containerRect.width;
      const cy = containerRect.top + (initialElem.y / 100) * containerRect.height;
      const angleRad = Math.atan2(moveEvt.clientY - cy, moveEvt.clientX - cx);
      let deg = Math.round((angleRad * 180) / Math.PI) + 90;
      if (deg < 0) deg += 360;
      if (deg >= 360) deg -= 360;
      updateElement(elementId, { rotation: deg } as any);
    };

    const onPointerUp = () => {
      isDraggingElementRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Undo drawing canvas action
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyStack.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTop = historyStack[historyStack.length - 1];
    const newHistory = historyStack.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];

    ctx.putImageData(previousState, 0, 0);
    setHistoryStack(newHistory);
    setRedoStack((prev) => [...prev, currentTop]);
  };

  // Redo drawing canvas action
  const handleRedo = () => {
    const canvas = canvasRef.current;
    if (!canvas || redoStack.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextState = redoStack[redoStack.length - 1];
    ctx.putImageData(nextState, 0, 0);
    setHistoryStack((prev) => [...prev, nextState]);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  // Drawing Canvas Handlers
  const startDrawing = (clientX: number, clientY: number) => {
    if (!isPenActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penStrokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !isPenActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.closePath();
    const newState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistoryStack((prev) => [...prev, newState]);
    setRedoStack([]);
  };

  // Tool Action: Tambah / Aktifkan Teks
  const handleAddTextElement = () => {
    setIsPenActive(false);
    setShowPenPalette(false);
    setShowShapePicker(false);
    setIsCropMode(false);
    setShowFilterCarousel(false);
    setShowEmojiPicker(false);

    const newText: OverlayElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: '',
      x: 50,
      y: 50,
      rotation: 0,
      color: '#212529',
      fontName: 'Sans Serif',
      hasBackground: true,
    };
    setOverlayElements((prev) => [...prev, newText]);
    setSelectedElementId(newText.id);
  };

  // Tool Action: Tambah / Ubah Bentuk Penyorot
  const handleSelectShape = (shapeType: 'rect' | 'circle' | 'line' | 'arrow') => {
    setIsPenActive(false);
    setShowPenPalette(false);
    setShowShapePicker(false);
    setIsCropMode(false);
    setShowFilterCarousel(false);
    setShowEmojiPicker(false);

    if (selectedElement && selectedElement.type === 'shape') {
      updateElement(selectedElement.id, { shapeType });
      return;
    }

    const newShape: OverlayElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shapeType,
      x: 50,
      y: 50,
      width: shapeType === 'line' || shapeType === 'arrow' ? 42 : 32,
      height: shapeType === 'line' || shapeType === 'arrow' ? 24 : 32,
      rotation: 0,
      strokeColor: '#000000',
      fillColor: 'transparent',
      strokeWidth: 4,
    };
    setOverlayElements((prev) => [...prev, newShape]);
    setSelectedElementId(newShape.id);
  };

  // Tool Action: Tambah / Aktifkan Sensor Blur
  const handleToggleBlurTool = () => {
    setIsPenActive(false);
    setShowPenPalette(false);
    setShowShapePicker(false);
    setIsCropMode(false);
    setShowFilterCarousel(false);
    setShowEmojiPicker(false);

    const existingBlur = overlayElements.find((el) => el.type === 'blur');
    if (existingBlur) {
      setSelectedElementId(existingBlur.id);
      return;
    }

    const newBlur: OverlayElement = {
      id: `blur-${Date.now()}`,
      type: 'blur',
      blurType: 'pixelate',
      intensity: 14,
      x: 50,
      y: 50,
      width: 30,
      height: 25,
    };
    setOverlayElements((prev) => [...prev, newBlur]);
    setSelectedElementId(newBlur.id);
  };

  // Tool Action: Tambah Emoji Interaktif
  const handleStampEmoji = (emoji: string) => {
    setIsPenActive(false);
    setShowPenPalette(false);
    setShowShapePicker(false);
    setIsCropMode(false);
    setShowFilterCarousel(false);
    setShowEmojiPicker(false);

    const newEmoji: OverlayElement = {
      id: `emoji-${Date.now()}`,
      type: 'emoji',
      emoji,
      x: 50,
      y: 50,
      size: 52,
      rotation: 0,
    };
    setOverlayElements((prev) => [...prev, newEmoji]);
    setSelectedElementId(newEmoji.id);
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

  // Gabungkan foto + coretan kanvas + shape + teks draggable menjadi dataURL
  const getFlattenedActivePhoto = async (): Promise<string> => {
    if (!activePhoto) return '';
    const canvas = canvasRef.current;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = img.width;
        offscreen.height = img.height;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return resolve(activePhoto);

        // 1. Gambar foto (foto sudah terotasi fisik jika diputar)
        ctx.drawImage(img, 0, 0);

        // 2. Gambar layer kanvas coretan (jika ada goresan)
        if (canvas && historyStack.length > 1) {
          ctx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
        }

        // 3. Gambar semua Overlay Elements (Blur, Shape, Text, Emoji)
        for (const el of overlayElements) {
          const cx = (el.x / 100) * offscreen.width;
          const cy = (el.y / 100) * offscreen.height;

          if (el.type === 'blur') {
            const bw = (el.width / 100) * offscreen.width;
            const bh = (el.height / 100) * offscreen.height;
            const bx = Math.max(0, Math.round(cx - bw / 2));
            const by = Math.max(0, Math.round(cy - bh / 2));
            const realW = Math.min(offscreen.width - bx, Math.round(bw));
            const realH = Math.min(offscreen.height - by, Math.round(bh));

            if (realW > 0 && realH > 0) {
              if (el.blurType === 'pixelate') {
                const blockSize = Math.max(6, Math.round(realW * (el.intensity / 100)));
                const temp = document.createElement('canvas');
                const tw = Math.max(1, Math.floor(realW / blockSize));
                const th = Math.max(1, Math.floor(realH / blockSize));
                temp.width = tw;
                temp.height = th;
                const tctx = temp.getContext('2d');
                if (tctx) {
                  tctx.imageSmoothingEnabled = false;
                  tctx.drawImage(offscreen, bx, by, realW, realH, 0, 0, tw, th);
                  ctx.imageSmoothingEnabled = false;
                  ctx.drawImage(temp, 0, 0, tw, th, bx, by, realW, realH);
                  ctx.imageSmoothingEnabled = true;
                }
              } else {
                const temp = document.createElement('canvas');
                temp.width = realW;
                temp.height = realH;
                const tctx = temp.getContext('2d');
                if (tctx) {
                  tctx.filter = `blur(${Math.max(4, el.intensity)}px)`;
                  tctx.drawImage(offscreen, bx, by, realW, realH, 0, 0, realW, realH);
                  ctx.drawImage(temp, bx, by, realW, realH);
                }
              }
            }
          } else if (el.type === 'shape') {
            const sw = (el.width / 100) * offscreen.width;
            const sh = (el.height / 100) * offscreen.height;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((el.rotation * Math.PI) / 180);

            ctx.strokeStyle = el.strokeColor || '#000000';
            ctx.fillStyle = el.fillColor === 'transparent' ? 'transparent' : el.fillColor || '#ffffff';
            ctx.lineWidth = Math.max(2, Math.round(offscreen.width * (el.strokeWidth * 0.002)));
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (el.shapeType === 'rect') {
              if (el.fillColor !== 'transparent') {
                ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
              }
              ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);
            } else if (el.shapeType === 'circle') {
              ctx.beginPath();
              ctx.ellipse(0, 0, sw / 2, sh / 2, 0, 0, 2 * Math.PI);
              if (el.fillColor !== 'transparent') {
                ctx.fill();
              }
              ctx.stroke();
            } else if (el.shapeType === 'line') {
              ctx.beginPath();
              ctx.moveTo(-sw / 2, sh / 2);
              ctx.lineTo(sw / 2, -sh / 2);
              ctx.stroke();
            } else if (el.shapeType === 'arrow') {
              const fromX = -sw / 2;
              const fromY = sh / 2;
              const toX = sw / 2;
              const toY = -sh / 2;
              const headLen = Math.max(16, offscreen.width * 0.035);
              const angle = Math.atan2(toY - fromY, toX - fromX);

              ctx.beginPath();
              ctx.moveTo(fromX, fromY);
              ctx.lineTo(toX, toY);
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(toX, toY);
              ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
              ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
              ctx.closePath();
              ctx.fillStyle = el.strokeColor || '#000000';
              ctx.fill();
            }
            ctx.restore();
          } else if (el.type === 'text' && el.text.trim()) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((el.rotation * Math.PI) / 180);

            const fontSize = Math.max(18, Math.round(offscreen.width * 0.05));
            const fontFamily =
              el.fontName === 'Serif'
                ? 'serif'
                : el.fontName === 'Mono'
                ? 'monospace'
                : 'sans-serif';
            ctx.font = `bold ${fontSize}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = el.text.trim();
            const metrics = ctx.measureText(text);
            const padX = Math.round(fontSize * 0.7);
            const padY = Math.round(fontSize * 0.45);
            const cardW = metrics.width + padX * 2;
            const cardH = fontSize + padY * 2;

            if (el.hasBackground) {
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 12);
              } else {
                ctx.rect(-cardW / 2, -cardH / 2, cardW, cardH);
              }
              ctx.fill();
            }

            ctx.fillStyle = el.color || '#212529';
            ctx.fillText(text, 0, 0);
            ctx.restore();
          } else if (el.type === 'emoji' && el.emoji) {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((el.rotation * Math.PI) / 180);
            const fontSize = Math.max(24, Math.round(offscreen.width * (el.size / 600)));
            ctx.font = `${fontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(el.emoji, 0, 0);
            ctx.restore();
          }
        }

        resolve(offscreen.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = () => resolve(activePhoto);
      img.src = activePhoto;
    });
  };

  // Download foto saat ini
  const handleDownloadActivePhoto = async () => {
    const finalPhoto = await getFlattenedActivePhoto();
    if (!finalPhoto) return;
    const a = document.createElement('a');
    a.href = finalPhoto;
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
  const handleSubmit = async (e?: React.FormEvent) => {
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

    let finalPhotos = [...photos];
    if (creatorMode === 'photo' && activePhoto) {
      const flattened = await getFlattenedActivePhoto();
      finalPhotos[activePhotoIdx] = flattened;
    }

    startTransition(async () => {
      setErrorMsg(null);
      const res = await bagikanStatusPembelajaran({
        kelasId: selectedClassId,
        kontenTeks: finalContent,
        mediaUrls: creatorMode === 'photo' ? finalPhotos : [`bg:${TEXT_BG_COLORS[textBgIdx].value}`],
        photos: creatorMode === 'photo' ? finalPhotos : [`bg:${TEXT_BG_COLORS[textBgIdx].value}`],
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

  // =========================================================================
  // TAMPILAN 1: STATUS FOTO (PERSIS Screenshot 2026-11-24 203809.png)
  // =========================================================================
  if (creatorMode === 'photo') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-[#0c1317] text-white select-none animate-in fade-in duration-200"
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
        {/* TOP BAR EDITOR FOTO WHATSAPP (Direct match to Screenshot)      */}
        {/* ------------------------------------------------------------- */}
        <header className="h-16 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0 border-b border-white/5 bg-[#0c1317]">
          {/* Sisi Kiri: Tombol Tutup X */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup editor"
              aria-label="Tutup editor"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Sisi Tengah: Grouped Creative Toolbar (Persis Screenshot) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyStack.length <= 1}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Batalkan perubahan (Undo)"
              aria-label="Undo"
            >
              <RotateCcw className="size-5" />
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Ulangi perubahan (Redo)"
              aria-label="Redo"
            >
              <RotateCw className="size-5" />
            </button>

            {/* Rotate / Crop */}
            <button
              type="button"
              onClick={() => {
                setIsCropMode(!isCropMode);
                setShowFilterCarousel(false);
                setShowShapePicker(false);
              }}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                isCropMode
                  ? 'text-white bg-[#00a884]'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title="Potong & Putar Foto (Crop & Rotate)"
              aria-label="Potong dan putar foto"
            >
              <Crop className="size-5" />
            </button>

            {/* Filter Kamera */}
            <button
              type="button"
              onClick={() => {
                setShowFilterCarousel(!showFilterCarousel);
                setIsCropMode(false);
                setShowShapePicker(false);
              }}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                showFilterCarousel || activeFilterIdx > 0
                  ? 'text-[#00a884] bg-white/15'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title={`Filter Kamera: ${PHOTO_FILTERS[activeFilterIdx].name}`}
              aria-label="Filter warna kamera"
            >
              <Sparkles className="size-5" />
            </button>

            {/* Pencil / Draw Tool */}
            <button
              type="button"
              onClick={() => {
                setIsPenActive(!isPenActive);
                setShowPenPalette(!showPenPalette);
                setSelectedElementId(null);
                setShowFilterCarousel(false);
                setShowShapePicker(false);
                setIsCropMode(false);
                setShowEmojiPicker(false);
              }}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                isPenActive
                  ? 'text-white bg-[#00a884]'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title="Alat Gambar / Pensil"
              aria-label="Alat gambar pensil"
            >
              <Pencil className="size-5" />
            </button>

            {/* Text Overlay Tool (Aa) */}
            <button
              type="button"
              onClick={handleAddTextElement}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                selectedElement?.type === 'text'
                  ? 'text-white bg-[#00a884]'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title="Tambahkan Teks di atas Foto (Aa)"
              aria-label="Tambahkan teks"
            >
              <Type className="size-5" />
            </button>

            {/* Shape Tool (Square, Circle, Line, Arrow) with 2x2 Popover (Screenshot 2026-11-24 230459.png) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsPenActive(false);
                  setShowPenPalette(false);
                  setShowShapePicker(!showShapePicker);
                  setShowFilterCarousel(false);
                  setIsCropMode(false);
                }}
                className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                  showShapePicker || selectedElement?.type === 'shape'
                    ? 'text-white bg-[#00a884]'
                    : 'text-[#8696a0] hover:text-white hover:bg-white/10'
                }`}
                title="Pilih Bentuk Penyorot (Kotak, Lingkaran, Garis, Panah)"
                aria-label="Pilih bentuk penyorot"
              >
                <Square className="size-5" />
              </button>

              {/* Popover 2x2 Shape Picker matching Screenshot 2026-11-24 230459.png */}
              {showShapePicker ? (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 p-2 rounded-2xl bg-white text-[#3b4a54] shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 grid grid-cols-2 gap-1.5 w-32">
                  <button
                    type="button"
                    onClick={() => handleSelectShape('rect')}
                    className="grid size-12 place-items-center rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Kotak"
                  >
                    <Square className="size-6 stroke-[2.2]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectShape('circle')}
                    className="grid size-12 place-items-center rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Lingkaran"
                  >
                    <Circle className="size-6 stroke-[2.2]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectShape('line')}
                    className="grid size-12 place-items-center rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Garis Diagonal"
                  >
                    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="4" y1="20" x2="20" y2="4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectShape('arrow')}
                    className="grid size-12 place-items-center rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
                    title="Panah Diagonal"
                  >
                    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="19" x2="19" y2="5" />
                      <polyline points="9 5 19 5 19 15" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Blur / Sensor Tool dengan WhatsApp Mosaic Icon */}
            <button
              type="button"
              onClick={handleToggleBlurTool}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                selectedElement?.type === 'blur'
                  ? 'text-white bg-[#00a884]'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title="Sensor / Buramkan area foto"
              aria-label="Sensor foto"
            >
              <WhatsAppBlurIcon className="size-5" />
            </button>

            {/* Emoji Tool */}
            <button
              type="button"
              onClick={() => {
                setIsPenActive(false);
                setShowPenPalette(false);
                setShowShapePicker(false);
                setShowEmojiPicker(!showEmojiPicker);
              }}
              className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
                showEmojiPicker || selectedElement?.type === 'emoji'
                  ? 'text-[#00a884] bg-white/15'
                  : 'text-[#8696a0] hover:text-white hover:bg-white/10'
              }`}
              title="Pilih Stiker & Emoji"
              aria-label="Pilih stiker emoji"
            >
              <Smile className="size-5" />
            </button>
          </div>

          {/* Sisi Kanan: Columns / Layout Toggle & Unduh Foto */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tata letak kanvas"
              aria-label="Tata letak kanvas"
            >
              <Columns className="size-5" />
            </button>
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
        {/* FLOATING SUB-TOOLBARS: PALET WARNA & UKURAN PENA              */}
        {/* ------------------------------------------------------------- */}
        {showPenPalette ? (
          <div className="z-40 flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2 px-4 bg-[#111b21] border-b border-white/10 animate-in fade-in slide-in-from-top-1">
            <span className="text-[11px] text-[#8696a0] mr-1">Warna:</span>
            {PEN_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setPenColor(col)}
                style={{ backgroundColor: col }}
                className={`size-6 rounded-full border-2 transition-transform cursor-pointer ${
                  penColor === col ? 'border-white scale-110 shadow-md' : 'border-transparent hover:scale-105'
                }`}
                title={col}
              />
            ))}

            <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

            <span className="text-[11px] text-[#8696a0] mr-1">Ukuran Coretan:</span>
            {PEN_STROKE_SIZES.map((s) => (
              <button
                key={s.size}
                type="button"
                onClick={() => setPenStrokeSize(s.size)}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  penStrokeSize === s.size ? 'bg-[#00a884] text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title={`Ukuran ${s.label} (${s.size}px)`}
              >
                {s.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Sub-toolbar Potong & Putar (Crop & Rotate Interactive Mode) */}
        {isCropMode ? (
          <div className="z-40 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#111b21] border-b border-white/10 text-xs animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleRotateBackward}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
                title="Putar Kiri (-90°)"
              >
                <RotateCcw className="size-4" />
                <span className="hidden sm:inline">Putar Kiri (-90°)</span>
              </button>
              <button
                type="button"
                onClick={handleRotateForward}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
                title="Putar Kanan (+90° searah jarum jam terus)"
              >
                <RotateCw className="size-4" />
                <span className="hidden sm:inline">Putar Kanan (+90°)</span>
              </button>
              <button
                type="button"
                onClick={handleResetCropAndRotation}
                className="px-2.5 py-1.5 rounded-lg text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer font-medium"
                title="Reset Potongan & Rotasi"
              >
                Reset
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCropMode(false);
                  setCropRect({ x: 0, y: 0, width: 100, height: 100 });
                }}
                className="px-3 py-1.5 rounded-lg text-[#8696a0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-white font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <Check className="size-4" />
                <span>Selesai Potong</span>
              </button>
            </div>
          </div>
        ) : null}



        {/* ------------------------------------------------------------- */}
        {/* CENTER CANVAS: FOTO KEGIATAN & LAYER CORETAN INTERAKTIF       */}
        {/* ------------------------------------------------------------- */}
        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          {activePhoto ? (
            <div
              className="absolute inset-0 size-full pointer-events-none overflow-hidden select-none -z-0"
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto}
                alt=""
                className="size-full object-cover scale-150 blur-3xl opacity-30"
              />
              <div className="absolute inset-0 bg-[#0c1317]/60" />
            </div>
          ) : null}

          {activePhoto ? (
            <div className="relative z-10 flex items-center justify-center max-w-full max-h-full">
              {/* Tight wrapper yang membungkus rendered foto secara presisi */}
              <div
                ref={photoWrapperRef}
                onClick={() => setSelectedElementId(null)}
                className="relative inline-flex items-center justify-center rounded-sm shadow-2xl overflow-hidden cursor-default"
              >
                {/* Foto Utama */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={activePhoto}
                  alt="Foto kegiatan yang dipilih"
                  onLoad={initCanvas}
                  style={{
                    transform: `rotate(${currentRotation}deg)`,
                    ...(PHOTO_FILTERS[activeFilterIdx].style ?? {}),
                    ...(isPixelated ? { filter: 'blur(4px)' } : {}),
                  }}
                  className="max-h-[58vh] sm:max-h-[62vh] max-w-[85vw] sm:max-w-2xl w-auto h-auto object-contain rounded-sm transition-all duration-200 pointer-events-none select-none block"
                />

                {/* Interactive HTML5 Drawing Canvas Overlaid on Top of Image */}
                <canvas
                  ref={canvasRef}
                  onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
                  onMouseMove={(e) => draw(e.clientX, e.clientY)}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    if (touch) startDrawing(touch.clientX, touch.clientY);
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    if (touch) draw(touch.clientX, touch.clientY);
                  }}
                  onTouchEnd={stopDrawing}
                  className={`absolute inset-0 size-full ${
                    isPenActive && !isCropMode ? 'cursor-crosshair z-20' : 'pointer-events-none z-10'
                  }`}
                />

                {/* Overlay Pemotong Interaktif (Crop Handles) */}
                {isCropMode ? (
                  <div className="absolute inset-0 z-30 select-none pointer-events-auto">
                    {/* Darkened overlay cutout via box-shadow */}
                    <div
                      style={{
                        left: `${cropRect.x}%`,
                        top: `${cropRect.y}%`,
                        width: `${cropRect.width}%`,
                        height: `${cropRect.height}%`,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                      }}
                      className="absolute border-2 border-white cursor-move pointer-events-auto"
                      onPointerDown={(e) => handleCropHandlePointerDown('move', e)}
                    >
                      {/* Grid 3x3 Rule-of-Thirds */}
                      <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                        <div className="border-r border-white/35" />
                        <div className="border-r border-white/35" />
                      </div>
                      <div className="absolute inset-0 grid grid-rows-3 pointer-events-none">
                        <div className="border-b border-white/35" />
                        <div className="border-b border-white/35" />
                      </div>

                      {/* 8 Drag Handles */}
                      <div
                        onPointerDown={(e) => handleCropHandlePointerDown('tl', e)}
                        className="absolute -top-1.5 -left-1.5 size-3.5 bg-white border border-black/40 rounded-full cursor-nwse-resize shadow-md"
                      />
                      <div
                        onPointerDown={(e) => handleCropHandlePointerDown('t', e)}
                        className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3.5 bg-white border border-black/40 rounded-full cursor-ns-resize shadow-md"
                      />
                      <div
                        onPointerDown={(e) => handleCropHandlePointerDown('tr', e)}
                        className="absolute -top-1.5 -right-1.5 size-3.5 bg-white border border-black/40 rounded-full cursor-nesw-resize shadow-md"
                      />
                      <div
                        onPointerDown={(e) => handleCropHandlePointerDown('r', e)}
                        className="absolute top-1/2 -right-1.5 -translate-y-1/2 size-3.5 bg-white border border-black/40 rounded-full cursor-ew-resize shadow-md"
                      />
                      <div
                        onPointerDown={(e) => handleCropHandlePointerDown('br', e)}
                        className="absolute -bottom-1.5 -right-1.5 size-3.5 bg-white border border-black/40 rounded-full cursor-nwse-resize shadow-md"
                      />
                      <div
                        onPointerDown={(e) => handleCropHandlePointerDown('b', e)}
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3.5 bg-white border border-black/40 rounded-full cursor-ns-resize shadow-md"
                      />
                      <div
                        onPointerDown={(e) => handleCropHandlePointerDown('bl', e)}
                        className="absolute -bottom-1.5 -left-1.5 size-3.5 bg-white border border-black/40 rounded-full cursor-nesw-resize shadow-md"
                      />
                      <div
                        onPointerDown={(e) => handleCropHandlePointerDown('l', e)}
                        className="absolute top-1/2 -left-1.5 -translate-y-1/2 size-3.5 bg-white border border-black/40 rounded-full cursor-ew-resize shadow-md"
                      />
                    </div>
                  </div>
                ) : null}

                {/* Persistent Overlay Elements (Text, Shape, Blur, Emoji) */}
                {overlayElements.map((item) => {
                  const isSelected = item.id === selectedElementId && !isCropMode;

                  if (item.type === 'text') {
                    return (
                      <div
                        key={item.id}
                        style={{
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                        }}
                        onPointerDown={(e) => handleElementPointerDown(item.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-30 select-none cursor-move animate-in fade-in zoom-in-95 max-w-[90%] rounded-2xl transition-shadow ${
                          item.hasBackground ? 'bg-white shadow-2xl' : 'bg-transparent shadow-none'
                        } ${isSelected ? 'border-2 border-[#25D366]' : 'border-2 border-transparent'}`}
                      >
                        {isSelected ? (
                          <>
                            {/* Attached Floating Top Smiley Button */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowEmojiPicker((prev) => !prev);
                                }}
                                className="grid size-8 place-items-center rounded-full bg-white text-[#54656f] hover:text-[#111b21] shadow-md border border-neutral-200 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                                title="Tambah stiker atau emoji"
                                onPointerDown={(e) => e.stopPropagation()}
                              >
                                <Smile className="size-4" />
                              </button>
                            </div>

                            {/* Top Rotation Handle Stem */}
                            <div
                              onPointerDown={(e) => handleElementRotatePointerDown(item.id, e)}
                              className="absolute -top-6 right-2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
                              title="Putar teks"
                            >
                              <div className="size-3 bg-white border-2 border-[#25D366] rounded-full shadow-md" />
                              <div className="w-0.5 h-3 bg-[#25D366]" />
                            </div>
                          </>
                        ) : null}

                        <div className="px-3 py-2 flex items-center">
                          <input
                            type="text"
                            value={item.text}
                            onChange={(e) => updateElement(item.id, { text: e.target.value })}
                            placeholder="Ketik sesuatu"
                            style={{
                              color: item.hasBackground
                                ? item.color
                                : item.color === '#ffffff'
                                ? '#ffffff'
                                : item.color,
                              fontFamily:
                                item.fontName === 'Serif'
                                  ? 'serif'
                                  : item.fontName === 'Mono'
                                  ? 'monospace'
                                  : 'sans-serif',
                              textShadow: item.hasBackground ? 'none' : '0 2px 6px rgba(0,0,0,0.85)',
                            }}
                            className={`bg-transparent border-0 outline-none text-center font-bold text-base sm:text-lg min-w-[150px] max-w-[260px] sm:max-w-[340px] ${
                              item.hasBackground
                                ? 'placeholder:text-neutral-400'
                                : 'placeholder:text-white/70'
                            }`}
                            onPointerDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    );
                  }

                  if (item.type === 'shape') {
                    return (
                      <div
                        key={item.id}
                        style={{
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          width: `${item.width}%`,
                          height: `${item.height}%`,
                          transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                        }}
                        className="absolute z-30 select-none cursor-move group"
                        onPointerDown={(e) => handleElementPointerDown(item.id, e)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Shape SVG Graphic */}
                        <svg
                          className="size-full overflow-visible pointer-events-none"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          {item.shapeType === 'rect' ? (
                            <rect
                              x="4"
                              y="4"
                              width="92"
                              height="92"
                              fill={item.fillColor}
                              stroke={item.strokeColor || '#000000'}
                              strokeWidth={item.strokeWidth}
                              rx="6"
                            />
                          ) : item.shapeType === 'circle' ? (
                            <ellipse
                              cx="50"
                              cy="50"
                              rx="46"
                              ry="46"
                              fill={item.fillColor}
                              stroke={item.strokeColor || '#000000'}
                              strokeWidth={item.strokeWidth}
                            />
                          ) : item.shapeType === 'line' ? (
                            <line
                              x1="6"
                              y1="94"
                              x2="94"
                              y2="6"
                              stroke={item.strokeColor || '#000000'}
                              strokeWidth={item.strokeWidth * 1.2}
                              strokeLinecap="round"
                            />
                          ) : item.shapeType === 'arrow' ? (
                            <>
                              <defs>
                                <marker
                                  id={`shape-arrow-${item.id}`}
                                  markerWidth="8"
                                  markerHeight="8"
                                  refX="6"
                                  refY="4"
                                  orient="auto"
                                >
                                  <polygon
                                    points="0 0, 8 4, 0 8"
                                    fill={item.strokeColor || '#000000'}
                                  />
                                </marker>
                              </defs>
                              <line
                                x1="8"
                                y1="92"
                                x2="90"
                                y2="10"
                                stroke={item.strokeColor || '#000000'}
                                strokeWidth={item.strokeWidth * 1.2}
                                strokeLinecap="round"
                                markerEnd={`url(#shape-arrow-${item.id})`}
                              />
                            </>
                          ) : null}
                        </svg>

                        {/* Selection Bounding Box & Handles when selected */}
                        {isSelected ? (
                          <div className="absolute inset-0 border-2 border-[#25D366] pointer-events-none">
                            {/* Top Rotation Handle Stem & Circle */}
                            <div
                              onPointerDown={(e) => handleElementRotatePointerDown(item.id, e)}
                              className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
                              title="Putar bentuk"
                            >
                              <div className="size-3 bg-white border-2 border-[#25D366] rounded-full shadow-md" />
                              <div className="w-0.5 h-3 bg-[#25D366]" />
                            </div>

                            {/* 8 Circular White Handles */}
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'tl', e)}
                              className="absolute -top-1.5 -left-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nwse-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 't', e)}
                              className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-ns-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'tr', e)}
                              className="absolute -top-1.5 -right-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nesw-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'r', e)}
                              className="absolute top-1/2 -right-1.5 -translate-y-1/2 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-ew-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'br', e)}
                              className="absolute -bottom-1.5 -right-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nwse-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'b', e)}
                              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-ns-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'bl', e)}
                              className="absolute -bottom-1.5 -left-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nesw-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'l', e)}
                              className="absolute top-1/2 -left-1.5 -translate-y-1/2 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-ew-resize pointer-events-auto"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  if (item.type === 'blur') {
                    return (
                      <div
                        key={item.id}
                        style={{
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          width: `${item.width}%`,
                          height: `${item.height}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute z-30 select-none cursor-move group"
                        onPointerDown={(e) => handleElementPointerDown(item.id, e)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Blur Visual Area */}
                        <div
                          style={{
                            backdropFilter: `blur(${item.intensity}px)`,
                            WebkitBackdropFilter: `blur(${item.intensity}px)`,
                          }}
                          className={`size-full rounded-lg overflow-hidden relative ${
                            item.blurType === 'pixelate' ? 'bg-white/10' : 'bg-transparent'
                          }`}
                        >
                          {item.blurType === 'pixelate' ? (
                            <div
                              className="absolute inset-0 opacity-40 pointer-events-none"
                              style={{
                                backgroundImage:
                                  'radial-gradient(circle, #000 1.5px, transparent 1.5px), radial-gradient(circle, #fff 1px, transparent 1px)',
                                backgroundSize: `${Math.max(6, Math.round(item.intensity * 0.8))}px ${Math.max(6, Math.round(item.intensity * 0.8))}px`,
                              }}
                            />
                          ) : null}
                        </div>

                        {/* Selection Bounding Box & 8 Handles when selected */}
                        {isSelected ? (
                          <div className="absolute inset-0 border-2 border-[#25D366] pointer-events-none">
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'tl', e)}
                              className="absolute -top-1.5 -left-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nwse-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 't', e)}
                              className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-ns-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'tr', e)}
                              className="absolute -top-1.5 -right-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nesw-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'r', e)}
                              className="absolute top-1/2 -right-1.5 -translate-y-1/2 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-ew-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'br', e)}
                              className="absolute -bottom-1.5 -right-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nwse-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'b', e)}
                              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-ns-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'bl', e)}
                              className="absolute -bottom-1.5 -left-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nesw-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'l', e)}
                              className="absolute top-1/2 -left-1.5 -translate-y-1/2 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-ew-resize pointer-events-auto"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  if (item.type === 'emoji') {
                    return (
                      <div
                        key={item.id}
                        style={{
                          left: `${item.x}%`,
                          top: `${item.y}%`,
                          transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                        }}
                        className="absolute z-30 select-none cursor-move group"
                        onPointerDown={(e) => handleElementPointerDown(item.id, e)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          style={{ fontSize: `${item.size}px`, lineHeight: 1 }}
                          className="block drop-shadow-md"
                        >
                          {item.emoji}
                        </span>

                        {/* Selection Bounding Box & Rotate & Resize Handles when selected */}
                        {isSelected ? (
                          <div className="absolute inset-0 border-2 border-[#25D366] pointer-events-none -m-1">
                            {/* Top Rotation Handle Stem */}
                            <div
                              onPointerDown={(e) => handleElementRotatePointerDown(item.id, e)}
                              className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-grab active:cursor-grabbing"
                              title="Putar emoji"
                            >
                              <div className="size-3 bg-white border-2 border-[#25D366] rounded-full shadow-md" />
                              <div className="w-0.5 h-3 bg-[#25D366]" />
                            </div>

                            {/* Corner Resize Handles */}
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'tl', e)}
                              className="absolute -top-1.5 -left-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nwse-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'tr', e)}
                              className="absolute -top-1.5 -right-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nesw-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'br', e)}
                              className="absolute -bottom-1.5 -right-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nwse-resize pointer-events-auto"
                            />
                            <div
                              onPointerDown={(e) => handleElementHandlePointerDown(item.id, 'bl', e)}
                              className="absolute -bottom-1.5 -left-1.5 size-3 bg-white border border-neutral-600 rounded-full shadow-md cursor-nesw-resize pointer-events-auto"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
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
          {showEmojiPicker ? (
            <div className="absolute top-2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-[#202c33] border border-[#2a3942] shadow-2xl animate-in fade-in slide-in-from-top-2">
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => handleStampEmoji(em)}
                  className="text-xl hover:scale-125 transition-transform cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          ) : null}

          {/* Banner Error jika ada */}
          {errorMsg ? (
            <div className="absolute top-4 inset-x-6 z-40 max-w-md mx-auto rounded-xl bg-rose-600 text-white text-xs p-3 text-center shadow-2xl backdrop-blur-md">
              {errorMsg}
            </div>
          ) : null}

          {/* Loading Indicator Kompresi */}
          {isCompressing ? (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs text-white">
              <Loader2 className="size-8 animate-spin text-[#00a884] mb-2" />
              <p className="text-xs font-semibold">Mengompresi foto kegiatan...</p>
            </div>
          ) : null}
        </main>

        {/* Carousel Filter Kamera Melayang di Atas Footer */}
        {showFilterCarousel && activePhoto ? (
          <div className="z-30 flex items-center justify-center gap-3 py-3 px-4 bg-[#111b21]/95 backdrop-blur-md border-t border-white/10 overflow-x-auto max-w-full animate-in fade-in slide-in-from-bottom-2 [scrollbar-width:none]">
            <span className="text-[11px] text-[#8696a0] shrink-0 font-medium hidden sm:inline mr-1">
              Filter Kamera:
            </span>
            {PHOTO_FILTERS.map((f, idx) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilterIdx(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div
                  className={`size-14 rounded-xl overflow-hidden border-2 transition-all ${
                    activeFilterIdx === idx
                      ? 'border-[#00a884] ring-2 ring-[#00a884]/40 scale-105 shadow-md'
                      : 'border-white/20 group-hover:border-white/60'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activePhoto}
                    alt={f.name}
                    style={f.style}
                    className="size-full object-cover"
                  />
                </div>
                <span
                  className={`text-[11px] font-semibold tracking-tight ${
                    activeFilterIdx === idx ? 'text-[#00a884]' : 'text-[#8696a0] group-hover:text-white'
                  }`}
                >
                  {f.name}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {/* ------------------------------------------------------------- */}
        {/* BOTTOM AREA: ROW 1 KETERANGAN, ROW 2 TIGA KOLOM PERSIS SCREENSHOT */}
        {/* ------------------------------------------------------------- */}
        <footer className="w-full px-6 pb-6 pt-2 shrink-0 space-y-3">
          {/* BARIS 1: TOOLBAR DINAMIS BERDASARKAN ELEMEN TERPILIH ATAU MODE PENA */}
          {selectedElement?.type === 'text' && !isCropMode ? (
            /* TEXT BOTTOM TOOLBAR (Screenshot 2026-11-24 230655.png) */
            <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-3 py-2 px-3 sm:px-4 rounded-xl bg-[#202c33]/95 backdrop-blur-md border border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              {/* 8 Color Palette Dots */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {TEXT_PALETTE_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { color: col })}
                    style={{ backgroundColor: col }}
                    className={`size-6 sm:size-7 rounded-full border-2 transition-transform cursor-pointer ${
                      selectedElement.color === col
                        ? 'border-[#25D366] scale-110 ring-2 ring-[#25D366]/40'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    title={`Warna: ${col}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Font Dropdown / Cycle Button ("A Sans Serif ▾") */}
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx =
                      (TEXT_FONT_OPTIONS.indexOf(selectedElement.fontName) + 1) %
                      TEXT_FONT_OPTIONS.length;
                    updateElement(selectedElement.id, {
                      fontName: TEXT_FONT_OPTIONS[nextIdx],
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
                  title="Ubah Gaya Font"
                >
                  <span>A {selectedElement.fontName}</span>
                  <ChevronDown className="size-3 text-white/70" />
                </button>

                {/* Toggle Latar Belakang ("✓ Latar belakang") */}
                <button
                  type="button"
                  onClick={() =>
                    updateElement(selectedElement.id, {
                      hasBackground: !selectedElement.hasBackground,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedElement.hasBackground
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="Aktifkan / nonaktifkan latar belakang teks"
                >
                  {selectedElement.hasBackground ? <Check className="size-3.5 stroke-[3]" /> : null}
                  <span>Latar belakang</span>
                </button>

                {/* Trash Button */}
                <button
                  type="button"
                  onClick={() => removeElement(selectedElement.id)}
                  className="grid size-8 place-items-center rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                  title="Hapus Teks"
                  aria-label="Hapus teks"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ) : selectedElement?.type === 'shape' && !isCropMode ? (
            /* SHAPE BOTTOM TOOLBAR (Screenshot 2026-11-24 230459.png) */
            <div className="max-w-2xl mx-auto w-full flex flex-wrap items-center justify-between gap-2 sm:gap-3 py-2 px-3 sm:px-4 rounded-xl bg-[#202c33]/95 backdrop-blur-md border border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Shape Switcher (Kotak, Lingkaran, Garis, Panah) */}
                <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { shapeType: 'rect' })}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      selectedElement.shapeType === 'rect'
                        ? 'bg-[#00a884] text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                    title="Ubah ke Kotak"
                  >
                    <Square className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { shapeType: 'circle' })}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      selectedElement.shapeType === 'circle'
                        ? 'bg-[#00a884] text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                    title="Ubah ke Lingkaran"
                  >
                    <Circle className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { shapeType: 'line' })}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      selectedElement.shapeType === 'line'
                        ? 'bg-[#00a884] text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                    title="Ubah ke Garis"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { shapeType: 'arrow' })}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      selectedElement.shapeType === 'arrow'
                        ? 'bg-[#00a884] text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                    title="Ubah ke Panah"
                  >
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>

                {/* Warna Pinggir (Stroke) */}
                <span className="text-[10px] text-[#8696a0] ml-1">Garis:</span>
                {SHAPE_PALETTE_COLORS.slice(0, 5).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { strokeColor: col })}
                    style={{ backgroundColor: col }}
                    className={`size-5 rounded-full border transition-transform cursor-pointer ${
                      selectedElement.strokeColor === col
                        ? 'border-[#25D366] scale-110 ring-1 ring-[#25D366]'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    title={`Garis: ${col}`}
                  />
                ))}

                {/* Warna Isi (Fill) */}
                <span className="text-[10px] text-[#8696a0] ml-1">Isi:</span>
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { fillColor: 'transparent' })}
                  className={`size-5 rounded-full border grid place-items-center text-[9px] cursor-pointer transition-transform ${
                    selectedElement.fillColor === 'transparent'
                      ? 'border-[#25D366] bg-white/20 text-[#25D366] ring-1 ring-[#25D366]'
                      : 'border-white/30 text-white/60 hover:scale-105'
                  }`}
                  title="Isi: Transparan"
                >
                  ⊘
                </button>
                {['#ffffff', '#000000', '#25D366', '#ff4a4a'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { fillColor: col })}
                    style={{ backgroundColor: col }}
                    className={`size-5 rounded-full border transition-transform cursor-pointer ${
                      selectedElement.fillColor === col
                        ? 'border-[#25D366] scale-110 ring-1 ring-[#25D366]'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    title={`Isi: ${col}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Trash Button */}
                <button
                  type="button"
                  onClick={() => removeElement(selectedElement.id)}
                  className="grid size-8 place-items-center rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                  title="Hapus Bentuk Penyorot"
                  aria-label="Hapus bentuk"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ) : selectedElement?.type === 'blur' && !isCropMode ? (
            /* BLUR TOOLBAR */
            <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-3 py-2 px-4 rounded-xl bg-[#202c33]/95 backdrop-blur-md border border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8696a0]">Jenis:</span>
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { blurType: 'pixelate' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedElement.blurType === 'pixelate'
                      ? 'bg-[#00a884] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Mosaik
                </button>
                <button
                  type="button"
                  onClick={() => updateElement(selectedElement.id, { blurType: 'gaussian' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedElement.blurType === 'gaussian'
                      ? 'bg-[#00a884] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Buram
                </button>

                <span className="text-xs text-[#8696a0] ml-2">Intensitas:</span>
                {[
                  { label: 'Halus', val: 8 },
                  { label: 'Sedang', val: 16 },
                  { label: 'Kuat', val: 26 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { intensity: item.val })}
                    className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      selectedElement.intensity === item.val
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Trash Button */}
              <button
                type="button"
                onClick={() => removeElement(selectedElement.id)}
                className="grid size-8 place-items-center rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                title="Hapus Sensor Blur"
                aria-label="Hapus blur"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : selectedElement?.type === 'emoji' && !isCropMode ? (
            /* EMOJI TOOLBAR */
            <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-3 py-2 px-4 rounded-xl bg-[#202c33]/95 backdrop-blur-md border border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#8696a0]">Ukuran:</span>
                {[
                  { label: 'Kecil', val: 36 },
                  { label: 'Sedang', val: 52 },
                  { label: 'Besar', val: 76 },
                  { label: 'Ekstra', val: 108 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => updateElement(selectedElement.id, { size: s.val })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      selectedElement.size === s.val
                        ? 'bg-[#00a884] text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Trash Button */}
              <button
                type="button"
                onClick={() => removeElement(selectedElement.id)}
                className="grid size-8 place-items-center rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                title="Hapus Emoji"
                aria-label="Hapus emoji"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : (
            /* BARIS 1 STANDAR: Input Tambah Keterangan dengan tombol Emoji di kanan */
            <div className="max-w-2xl mx-auto w-full relative flex items-center bg-[#202c33] rounded-lg px-4 py-2.5 border border-transparent focus-within:border-[#00a884]/60 transition-colors shadow-sm">
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
                title="Sisipkan emoji ke keterangan"
              >
                <Smile className="size-5" />
              </button>
            </div>
          )}

          {/* BARIS 2: TIGA KOLOM (Kiri: Pill Audiens | Tengah: Thumbnails + | Kanan: Tombol Kirim Hijau) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* KOLOM KIRI: Pill Audiens (1 Disertakan) status */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAudiencePicker(!showAudiencePicker)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white backdrop-blur-xs transition-colors cursor-pointer shadow-sm"
              >
                <WhatsAppStatusPillIcon className="size-3.5 text-white/90" />
                <span className="truncate max-w-[160px] sm:max-w-xs">
                  {currentClass ? `(1 Disertakan) status · ${currentClass.nama}` : '(1 Disertakan) status'}
                </span>
                <ChevronDown className="size-3 text-white/70" />
              </button>

              {/* Popover Pilih Kelas Penerima Status */}
              {showAudiencePicker ? (
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
                        className={`w-full text-left px-2.5 py-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
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
              ) : null}
            </div>

            {/* KOLOM TENGAH: Tombol Putar Cepat + Filmstrip Thumbnails & Kotak + Tambah Foto */}
            <div className="flex items-center justify-center gap-2 overflow-x-auto min-w-0">
              {/* Tombol Putar Cepat Foto (+90°) Konsisten di Bawah */}
              <button
                type="button"
                onClick={() => physicallyRotateActivePhoto('cw')}
                className="grid size-11 sm:size-12 place-items-center rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 border border-white/10"
                title="Putar Foto (+90° searah jarum jam)"
                aria-label="Putar Foto Kanan"
              >
                <RotateCw className="size-5" />
              </button>

              {photos.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative size-11 sm:size-12 shrink-0 rounded-md overflow-hidden border-2 cursor-pointer transition-transform ${
                    idx === activePhotoIdx
                      ? 'border-[#00a884] scale-105 shadow-md'
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
                    className="absolute top-0.5 right-0.5 grid size-3.5 place-items-center rounded-full bg-black/80 text-white hover:bg-rose-600 transition-colors"
                    title="Hapus foto"
                  >
                    <X className="size-2" />
                  </button>
                </div>
              ))}

              {photos.length < 5 ? (
                <button
                  type="button"
                  onClick={() => addPhotoInputRef.current?.click()}
                  className="grid size-11 sm:size-12 place-items-center rounded-md border border-[#8696a0]/40 bg-[#202c33] hover:bg-[#2a3942] text-white transition-colors cursor-pointer shrink-0"
                  title="Tambah foto (Maks 5)"
                >
                  <Plus className="size-5 text-[#8696a0] hover:text-white" />
                </button>
              ) : null}
            </div>

            {/* KOLOM KANAN: Tombol Kirim Hijau Bulat WhatsApp */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isPending || isCompressing || photos.length === 0}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-[#00a884] hover:bg-[#02906f] text-white shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
                title="Kirim status ke orang tua"
                aria-label="Kirim status ke orang tua"
              >
                {isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <SendHorizontal className="size-5 ml-0.5 fill-current" />
                )}
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // TAMPILAN 2: STATUS TEKS (PERSIS Screenshot 2026-11-24 141517.png)
  // =========================================================================
  const activeBg = TEXT_BG_COLORS[textBgIdx];
  const activeFont = TEXT_FONTS[textFontIdx];

  return (
    <div
      style={{ background: activeBg.value }}
      className="fixed inset-0 z-50 flex flex-col text-white select-none transition-all duration-300 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Editor Status Teks WhatsApp"
    >
      {/* ------------------------------------------------------------- */}
      {/* TOP BAR EDITOR TEKS WHATSAPP (Persis Screenshot)              */}
      {/* ------------------------------------------------------------- */}
      <header className="h-16 px-6 flex items-center justify-between z-30 shrink-0 bg-black/10 backdrop-blur-xs border-b border-white/10">
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

          {/* Ganti Tema Warna & Gradien Latar (Palette) */}
          <button
            type="button"
            onClick={() => {
              setShowThemePalette(!showThemePalette);
            }}
            className={`grid size-10 place-items-center rounded-full transition-colors cursor-pointer ${
              showThemePalette ? 'bg-white/20 text-white' : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
            title={`Tema: ${activeBg.name} (Klik untuk buka palet tema)`}
          >
            <Palette className="size-6" />
          </button>
        </div>
      </header>

      {/* Floating Theme Palette Ribbon (Solid Colors & Gradients) */}
      {showThemePalette ? (
        <div className="z-30 flex items-center justify-center gap-2 py-2.5 px-4 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-x-auto max-w-full animate-in fade-in slide-in-from-top-1">
          <span className="text-[11px] text-white/80 mr-1 shrink-0 font-medium">Tema Warna & Gradien:</span>
          {TEXT_BG_COLORS.map((theme, idx) => (
            <button
              key={theme.name}
              type="button"
              onClick={() => setTextBgIdx(idx)}
              style={{ background: theme.value }}
              className={`size-7 rounded-full border-2 transition-transform cursor-pointer shrink-0 ${
                textBgIdx === idx
                  ? 'border-white scale-110 shadow-lg ring-2 ring-white/60'
                  : 'border-white/30 hover:scale-105'
              }`}
              title={theme.name}
            />
          ))}
        </div>
      ) : null}

      {/* ------------------------------------------------------------- */}
      {/* CENTER CANVAS: TEKS STATUS BESAR & TERPUSAT PRESISI           */}
      {/* ------------------------------------------------------------- */}
      <main
        onClick={() => textTextareaRef.current?.focus()}
        className="flex-1 flex flex-col items-center justify-center px-6 sm:px-12 relative cursor-text select-none"
      >
        <div className="w-full max-w-4xl flex items-center justify-center my-auto">
          <textarea
            ref={textTextareaRef}
            autoFocus
            rows={1}
            value={textStatus}
            onChange={(e) => {
              setTextStatus(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Ketik status..."
            className={`w-full text-center text-white placeholder-white/50 text-3xl sm:text-5xl md:text-6xl bg-transparent border-0 outline-none resize-none leading-normal overflow-hidden focus:ring-0 ${activeFont.className}`}
            style={{ minHeight: '1.3em' }}
          />
        </div>

        {/* Floating Emoji Ribbon */}
        {showEmojiPicker ? (
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
        ) : null}

        {/* Error Banner */}
        {errorMsg ? (
          <div className="absolute top-4 inset-x-6 z-40 max-w-md mx-auto rounded-xl bg-rose-600 text-white text-xs p-3 text-center shadow-2xl backdrop-blur-md">
            {errorMsg}
          </div>
        ) : null}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM BAR: PILL AUDIENS (Kiri) & TOMBOL KIRIM BULAT HIJAU (Kanan) */}
      {/* ------------------------------------------------------------- */}
      <footer className="w-full px-6 pb-6 pt-2 flex items-center justify-between shrink-0">
        {/* Pill Audiens: (Kontak) status (Persis Screenshot) */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowAudiencePicker(!showAudiencePicker)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white backdrop-blur-xs transition-colors cursor-pointer shadow-sm"
          >
            <WhatsAppStatusPillIcon className="size-3.5 text-white/90" />
            <span className="truncate max-w-[200px] sm:max-w-xs">
              {currentClass ? `(Kontak) status · ${currentClass.nama}` : '(Kontak) status'}
            </span>
            <ChevronDown className="size-3 text-white/70" />
          </button>

          {/* Popover Pilih Kelas */}
          {showAudiencePicker ? (
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
                    className={`w-full text-left px-2.5 py-2 rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
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
          ) : null}
        </div>

        {/* Tombol Kirim Hijau Bulat WhatsApp */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isPending || !textStatus.trim()}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-[#00a884] hover:bg-[#02906f] text-white shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
            title="Kirim status ke orang tua"
            aria-label="Kirim status ke orang tua"
          >
            {isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <SendHorizontal className="size-5 ml-0.5 fill-current" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default WhatsappStoryCreatorModal;
