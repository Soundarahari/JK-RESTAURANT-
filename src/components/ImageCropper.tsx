import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Check, X } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio?: number; // width/height. Default 1 (square)
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ imageSrc, aspectRatio = 1, onCropComplete, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const CANVAS_W = 320;
  const CANVAS_H = Math.round(CANVAS_W / aspectRatio);

  // Draw image on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Dark overlay background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.save();
    ctx.translate(CANVAS_W / 2 + offset.x, CANVAS_H / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const fitScale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const drawW = img.naturalWidth * fitScale;
    const drawH = img.naturalHeight * fitScale;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Crop frame border
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo((CANVAS_W / 3) * i, 0);
      ctx.lineTo((CANVAS_W / 3) * i, CANVAS_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, (CANVAS_H / 3) * i);
      ctx.lineTo(CANVAS_W, (CANVAS_H / 3) * i);
      ctx.stroke();
    }
  }, [imageLoaded, scale, rotation, offset, CANVAS_W, CANVAS_H]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY, ox: offset.x, oy: offset.y };
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: dragStart.current.ox + (clientX - dragStart.current.x),
      y: dragStart.current.oy + (clientY - dragStart.current.y),
    });
  };

  const onMouseUp = () => setIsDragging(false);

  // Export cropped image
  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(dataUrl);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Drag to reposition • Pinch or use buttons to zoom</p>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border-2 border-brand-500/30 shadow-lg cursor-grab active:cursor-grabbing select-none"
        style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: '100%' }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', width: '100%', height: 'auto', touchAction: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          onClick={() => setScale(s => Math.max(0.5, parseFloat((s - 0.1).toFixed(1))))}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs font-black text-gray-500 w-10 text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(s => Math.min(4, parseFloat((s + 0.1).toFixed(1))))}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={() => setRotation(r => r - 90)}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
          title="Rotate 90°"
        >
          <RotateCw size={16} className="scale-x-[-1]" />
        </button>
        <button
          onClick={() => setRotation(r => r + 90)}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
          title="Rotate 90°"
        >
          <RotateCw size={16} />
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        <button
          onClick={() => { setScale(1); setRotation(0); setOffset({ x: 0, y: 0 }); }}
          className="px-3 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-black text-gray-500 uppercase tracking-wider hover:bg-gray-200 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Zoom slider */}
      <div className="w-full px-2">
        <input
          type="range"
          min="50"
          max="400"
          step="5"
          value={Math.round(scale * 100)}
          onChange={e => setScale(Number(e.target.value) / 100)}
          className="w-full accent-brand-500"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 w-full">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <X size={14} /> Cancel
        </button>
        <button
          onClick={handleCrop}
          className="flex-1 py-3 bg-brand-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Check size={14} /> Apply Crop
        </button>
      </div>
    </div>
  );
}
