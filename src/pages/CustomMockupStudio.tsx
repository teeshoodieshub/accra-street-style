import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { Upload, Type, Image as ImageIcon, Download, Undo2, Redo2, ZoomIn, ZoomOut, ShoppingBag, Loader2, Smile, Star, Heart, Flame, Sparkles, Music, Sun, Moon, CloudLightning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { createProduct, uploadProductImage } from '@/lib/supabaseApi';

// Color swatches matching the reference image grid
const COLOR_SWATCHES = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Brown', hex: '#8B6914' },
  { name: 'Gray', hex: '#B0B0B0' },
  { name: 'Light Blue', hex: '#6B9BD2' },
  { name: 'Dark Brown', hex: '#5C4033' },
  { name: 'Forest Green', hex: '#2D5A27' },
  { name: 'Red', hex: '#C41E3A' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Royal Blue', hex: '#2B4C9B' },
  { name: 'Lavender', hex: '#9B8EC4' },
  { name: 'Olive', hex: '#6B6832' },
  { name: 'Slate', hex: '#708090' },
  { name: 'Rose', hex: '#DE6B7B' },
  { name: 'Teal', hex: '#1A7A5C' },
  { name: 'Silver', hex: '#A8A8A8' },
  { name: 'Burgundy', hex: '#6B1C2A' },
  { name: 'Charcoal', hex: '#36454F' },
];

// Pre-built graphics the user can add
const GRAPHIC_OPTIONS = [
  { icon: '⭐', label: 'Star' },
  { icon: '❤️', label: 'Heart' },
  { icon: '🔥', label: 'Fire' },
  { icon: '✨', label: 'Sparkle' },
  { icon: '🎵', label: 'Music' },
  { icon: '☀️', label: 'Sun' },
  { icon: '🌙', label: 'Moon' },
  { icon: '⚡', label: 'Lightning' },
  { icon: '🌸', label: 'Flower' },
  { icon: '💎', label: 'Diamond' },
  { icon: '🦋', label: 'Butterfly' },
  { icon: '🎨', label: 'Palette' },
];

type ViewType = 'front' | 'back' | 'sleeve';

export default function CustomMockupStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[7]); // Red by default
  const [activeView, setActiveView] = useState<ViewType>('front');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showGraphicPanel, setShowGraphicPanel] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [size, setSize] = useState('M');
  const { addItem } = useCart();

  // Undo/redo state
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const isRestoringRef = useRef(false);

  // Save canvas state for undo
  const saveState = useCallback(() => {
    if (!fabricCanvas || isRestoringRef.current) return;
    const json = JSON.stringify(fabricCanvas.toJSON());
    setUndoStack(prev => [...prev, json]);
    setRedoStack([]);
  }, [fabricCanvas]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 350,
      height: 400,
      backgroundColor: 'transparent',
    });

    setFabricCanvas(canvas);

    // Save initial state
    const initialState = JSON.stringify(canvas.toJSON());
    setUndoStack([initialState]);

    // Listen for object modifications
    const onModified = () => {
      if (!isRestoringRef.current) {
        const json = JSON.stringify(canvas.toJSON());
        setUndoStack(prev => [...prev, json]);
        setRedoStack([]);
      }
    };
    canvas.on('object:modified', onModified);
    canvas.on('object:added', onModified);

    return () => {
      canvas.off('object:modified', onModified);
      canvas.off('object:added', onModified);
      canvas.dispose();
      setFabricCanvas(null);
    };
  }, []);

  const handleUndo = () => {
    if (!fabricCanvas || undoStack.length <= 1) return;
    isRestoringRef.current = true;
    const newUndo = [...undoStack];
    const current = newUndo.pop()!;
    setRedoStack(prev => [...prev, current]);
    const prevState = newUndo[newUndo.length - 1];
    fabricCanvas.loadFromJSON(prevState).then(() => {
      fabricCanvas.renderAll();
      setUndoStack(newUndo);
      isRestoringRef.current = false;
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas || redoStack.length === 0) return;
    isRestoringRef.current = true;
    const newRedo = [...redoStack];
    const nextState = newRedo.pop()!;
    setUndoStack(prev => [...prev, nextState]);
    fabricCanvas.loadFromJSON(nextState).then(() => {
      fabricCanvas.renderAll();
      setRedoStack(newRedo);
      isRestoringRef.current = false;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target?.result;
      if (typeof data !== 'string') return;

      fabric.Image.fromURL(data).then((img) => {
        img.scaleToWidth(180);
        fabricCanvas.centerObject(img);
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    if (!fabricCanvas) return;
    const text = new fabric.IText('Your Text', {
      left: 100,
      top: 150,
      fontFamily: 'Arial',
      fill: '#000000',
      fontSize: 28,
      fontWeight: 'bold',
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  const addGraphic = (emoji: string) => {
    if (!fabricCanvas) return;
    const text = new fabric.IText(emoji, {
      left: 120,
      top: 160,
      fontSize: 60,
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    setShowGraphicPanel(false);
  };

  const saveDesign = () => {
    if (!fabricCanvas) return;
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    // Create a composite canvas with the product background + design
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 800;
    exportCanvas.height = 900;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Fill with the product color
    ctx.fillStyle = selectedColor.hex;
    ctx.fillRect(0, 0, 800, 900);

    // Draw the fabric canvas on top
    const fabricDataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, 100, 100, 600, 700);
      const link = document.createElement('a');
      link.download = 'custom-mockup-design.png';
      link.href = exportCanvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Design saved!');
    };
    img.src = fabricDataUrl;
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleAddToCart = async () => {
    if (!fabricCanvas) return;
    setIsAddingToCart(true);
    try {
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      const dataURL = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });

      const file = dataURLtoFile(dataURL, `custom-mockup-${Date.now()}.png`);
      if (!file) throw new Error('Failed to generate image file');

      toast.loading('Uploading design...', { id: 'add-cart' });
      const imageUrl = await uploadProductImage(file);

      const productId = `custom-${Date.now()}`;
      const customProduct = {
        id: productId,
        name: `Custom Sweatshirt - ${selectedColor.name}`,
        price: 49.99,
        category: 'custom',
        featuredImage: imageUrl,
        images: [imageUrl],
        useDesignSelection: false,
        colors: [selectedColor.hex],
        sizes: [size],
        description: 'A custom designed product created in the Mockup Studio.',
        specs: '100% Cotton, Custom Print',
        isNew: true,
      };

      toast.loading('Adding to cart...', { id: 'add-cart' });
      await createProduct(customProduct);
      addItem(customProduct, size, selectedColor.hex);

      toast.success('Added to cart!', { id: 'add-cart' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add to cart. Please try again.', { id: 'add-cart' });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Generate SVG path for a crewneck sweatshirt silhouette
  const getProductSVG = (view: ViewType, color: string) => {
    if (view === 'front') {
      return (
        <svg viewBox="0 0 500 580" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Body */}
          <path
            d={`M 100 160 
                C 100 155, 105 130, 130 120 
                C 140 116, 155 112, 175 110 
                C 185 108, 195 115, 210 120 
                C 220 124, 235 128, 250 128 
                C 265 128, 280 124, 290 120 
                C 305 115, 315 108, 325 110 
                C 345 112, 360 116, 370 120 
                C 395 130, 400 155, 400 160 
                L 440 220 
                C 445 228, 445 240, 440 248 
                L 400 300 
                L 400 520 
                C 400 535, 395 545, 380 545 
                L 120 545 
                C 105 545, 100 535, 100 520 
                L 100 300 
                L 60 248 
                C 55 240, 55 228, 60 220 
                Z`}
            fill={color}
            stroke="none"
          />
          {/* Collar */}
          <path
            d={`M 175 110 
                C 185 100, 200 95, 215 93 
                C 225 91, 240 90, 250 90 
                C 260 90, 275 91, 285 93 
                C 300 95, 315 100, 325 110 
                C 315 115, 300 118, 290 115 
                C 275 110, 265 105, 250 105 
                C 235 105, 225 110, 210 115 
                C 200 118, 185 115, 175 110 
                Z`}
            fill={color}
            stroke="none"
            filter="brightness(0.85)"
          />
          <path
            d={`M 175 110 
                C 185 100, 200 95, 215 93 
                C 225 91, 240 90, 250 90 
                C 260 90, 275 91, 285 93 
                C 300 95, 315 100, 325 110`}
            fill="none"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="2"
          />
          {/* Left sleeve seam */}
          <path d="M 100 160 L 100 300" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          {/* Right sleeve seam */}
          <path d="M 400 160 L 400 300" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          {/* Bottom ribbing */}
          <rect x="100" y="525" width="300" height="20" rx="2" fill={color} opacity="0.85" />
          <line x1="100" y1="525" x2="400" y2="525" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          {/* Left cuff */}
          <rect x="45" y="240" width="25" height="15" rx="3" fill={color} opacity="0.85" />
          {/* Right cuff */}
          <rect x="430" y="240" width="25" height="15" rx="3" fill={color} opacity="0.85" />
          {/* Subtle body shadows/folds */}
          <path d="M 200 200 Q 250 320 200 480" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="8" />
          <path d="M 300 200 Q 250 320 300 480" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="8" />
          {/* Collar shadow */}
          <ellipse cx="250" cy="135" rx="60" ry="8" fill="rgba(0,0,0,0.05)" />
        </svg>
      );
    } else if (view === 'back') {
      return (
        <svg viewBox="0 0 500 580" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Same body shape */}
          <path
            d={`M 100 160 
                C 100 155, 105 130, 130 120 
                C 140 116, 155 112, 175 110 
                C 185 108, 200 100, 215 95 
                C 230 92, 240 90, 250 90 
                C 260 90, 270 92, 285 95 
                C 300 100, 315 108, 325 110 
                C 345 112, 360 116, 370 120 
                C 395 130, 400 155, 400 160 
                L 440 220 
                C 445 228, 445 240, 440 248 
                L 400 300 
                L 400 520 
                C 400 535, 395 545, 380 545 
                L 120 545 
                C 105 545, 100 535, 100 520 
                L 100 300 
                L 60 248 
                C 55 240, 55 228, 60 220 
                Z`}
            fill={color}
            stroke="none"
          />
          {/* Back collar - higher neckline */}
          <path
            d={`M 185 110 
                C 200 100, 220 96, 250 95 
                C 280 96, 300 100, 315 110`}
            fill="none"
            stroke="rgba(0,0,0,0.12)"
            strokeWidth="3"
          />
          {/* Seam down center back */}
          <line x1="250" y1="110" x2="250" y2="525" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
          {/* Sleeve seams */}
          <path d="M 100 160 L 100 300" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          <path d="M 400 160 L 400 300" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          {/* Bottom ribbing */}
          <rect x="100" y="525" width="300" height="20" rx="2" fill={color} opacity="0.85" />
          <line x1="100" y1="525" x2="400" y2="525" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          {/* Cuffs */}
          <rect x="45" y="240" width="25" height="15" rx="3" fill={color} opacity="0.85" />
          <rect x="430" y="240" width="25" height="15" rx="3" fill={color} opacity="0.85" />
          {/* Back tag */}
          <rect x="240" y="115" width="20" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
        </svg>
      );
    } else {
      // Sleeve view
      return (
        <svg viewBox="0 0 500 580" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Sleeve tube */}
          <path
            d={`M 120 100 
                C 130 95, 200 80, 280 80 
                C 360 80, 380 95, 390 100 
                L 420 480 
                C 420 500, 400 510, 380 510 
                L 130 510 
                C 110 510, 90 500, 90 480 
                Z`}
            fill={color}
            stroke="none"
          />
          {/* Cuff ribbing */}
          <rect x="90" y="490" width="330" height="25" rx="4" fill={color} opacity="0.85" />
          <line x1="90" y1="490" x2="420" y2="490" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          {/* Seam */}
          <line x1="255" y1="80" x2="255" y2="490" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
          {/* Shoulder curve */}
          <path
            d="M 120 100 C 180 85 320 85 390 100"
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="2"
          />
          {/* Fold shadows */}
          <path d="M 200 120 Q 220 300 200 460" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="6" />
          <path d="M 310 120 Q 290 300 310 460" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="6" />
        </svg>
      );
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-white dark:bg-zinc-950">
      {/* Step Headers */}
      <div className="flex items-center gap-12 px-8 py-5 border-b border-gray-200 dark:border-zinc-800">
        <h2 className="text-2xl font-bold text-foreground font-serif">
          <span className="text-muted-foreground">1:</span> Design it
        </h2>
        <h2 className="text-2xl font-bold text-foreground font-serif">
          <span className="text-muted-foreground">2:</span> Preview it
        </h2>
      </div>

      {/* Main Studio Area */}
      <div className="flex flex-col lg:flex-row border border-gray-200 dark:border-zinc-800 mx-4 my-4 rounded-sm">
        {/* Left Panel */}
        <div className="w-full lg:w-[260px] flex-shrink-0 p-5 border-r border-gray-200 dark:border-zinc-800 flex flex-col gap-5">
          {/* Color Swatches */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Color
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color.hex}
                  title={color.name}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-9 h-9 rounded-sm border-2 transition-all duration-150 hover:scale-110
                    ${selectedColor.hex === color.hex
                      ? 'border-blue-500 shadow-md ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-300 dark:border-zinc-600 hover:border-gray-500'}
                  `}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex flex-col gap-1.5">
            {(['front', 'back', 'sleeve'] as ViewType[]).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`
                  px-4 py-1.5 text-sm font-medium rounded-sm border transition-all capitalize
                  ${activeView === view
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 text-foreground border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800'}
                `}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-zinc-800">
            <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-sm cursor-pointer transition-colors text-sm font-medium">
              <Upload size={16} className="text-blue-500 flex-shrink-0" />
              <span>UPLOAD FILE</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            <button
              onClick={addText}
              className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-sm transition-colors text-sm font-medium text-left"
            >
              <Type size={16} className="text-blue-500 flex-shrink-0" />
              <span>ADD TEXT</span>
            </button>

            <button
              onClick={() => setShowGraphicPanel(!showGraphicPanel)}
              className="flex items-center gap-3 px-4 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-sm transition-colors text-sm font-medium text-left"
            >
              <Smile size={16} className="text-yellow-500 flex-shrink-0" />
              <span>ADD GRAPHIC</span>
            </button>

            {/* Graphic Panel */}
            {showGraphicPanel && (
              <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-zinc-800 rounded-sm border border-gray-200 dark:border-zinc-700 animate-in slide-in-from-top-2">
                {GRAPHIC_OPTIONS.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => addGraphic(g.icon)}
                    className="text-2xl p-2 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                    title={g.label}
                  >
                    {g.icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save Design */}
          <div className="mt-auto pt-4">
            <button
              onClick={saveDesign}
              className="flex items-center gap-3 w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-sm transition-colors font-bold text-sm shadow-sm"
            >
              <Download size={18} />
              <span>SAVE DESIGN</span>
            </button>
            <p className="text-xs text-muted-foreground mt-1.5 italic">
              Your designs will be saved as an image ;)
            </p>
          </div>

          {/* Size & Add to Cart */}
          <div className="pt-3 border-t border-gray-200 dark:border-zinc-800">
            <label className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Size
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {['S', 'M', 'L', 'XL', '2XL'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-all
                    ${size === s
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-600 hover:border-foreground'}
                  `}
                >
                  {s}
                </button>
              ))}
            </div>
            <Button
              className="w-full flex justify-center gap-2 bg-black hover:bg-black/90 text-white rounded-sm tracking-wider uppercase h-10 text-xs font-bold"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? <Loader2 className="animate-spin" size={16} /> : <ShoppingBag size={16} />}
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </div>

        {/* Right Panel — Product Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-zinc-900/50 relative min-h-[600px]">
          {/* Zoom Button */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-sm transition-colors shadow-sm z-10"
          >
            {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
            {isZoomed ? 'Zoom −' : 'Zoom +'}
          </button>

          {/* Product Mockup with Canvas */}
          <div
            className={`relative transition-transform duration-300 ${isZoomed ? 'scale-125' : 'scale-100'}`}
            style={{ width: '420px', height: '500px' }}
          >
            {/* SVG Product Mockup */}
            <div className="absolute inset-0 pointer-events-none">
              {getProductSVG(activeView, selectedColor.hex)}
            </div>

            {/* Fabric Canvas Overlay — only on front view */}
            {activeView === 'front' && (
              <div
                className="absolute z-10"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -45%)',
                  width: '350px',
                  height: '400px',
                }}
              >
                {/* Printable area indicator */}
                <div className="absolute inset-4 border-2 border-dashed border-gray-300/50 rounded-sm pointer-events-none z-20" />
                <canvas ref={canvasRef} />
              </div>
            )}

            {/* Non-front view message */}
            {activeView !== 'front' && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm px-4 py-2 rounded-sm shadow-sm text-sm text-muted-foreground">
                  {activeView === 'back' ? 'Back view — design area on front' : 'Sleeve view — design area on front'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar — Undo / Redo */}
      <div className="flex items-center justify-center gap-3 py-4">
        <button
          onClick={handleUndo}
          disabled={undoStack.length <= 1}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-sm border text-sm font-medium transition-all
            ${undoStack.length > 1
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
              : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-600 cursor-not-allowed'}
          `}
        >
          <Undo2 size={14} />
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-sm border text-sm font-medium transition-all
            ${redoStack.length > 0
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
              : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-600 cursor-not-allowed'}
          `}
        >
          Redo
          <Redo2 size={14} />
        </button>
      </div>
    </div>
  );
}
