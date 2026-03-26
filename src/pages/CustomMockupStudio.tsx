import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import * as fabric from 'fabric';
import {
  Download,
  Loader2,
  Redo2,
  ShoppingBag,
  Smile,
  Type,
  Undo2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import hoodieAshMockup from '@/assets/product-hoodie-ash.jpg';
import hoodieCreamMockup from '@/assets/product-hoodie-cream.jpg';
import hoodieWineMockup from '@/assets/product-hoodie-wine.jpg';
import sleevelessBlackMockup from '@/assets/product-sleeveless-black.jpg';
import sleevelessGreenMockup from '@/assets/product-sleeveless-green.jpg';
import teeBlackMockup from '@/assets/product-tee-black.jpg';
import teeWhiteMockup from '@/assets/product-tee-white.jpg';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import { createProduct, uploadProductImage } from '@/lib/supabaseApi';

type ViewType = 'front' | 'back' | 'sleeve';
type GarmentId = 'tee' | 'hoodie' | 'sweatshirt' | 'sleeveless-hoodie';

type GarmentColorway = {
  name: string;
  hex: string;
  image?: string;
};

type PrintArea = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type GarmentConfig = {
  id: GarmentId;
  name: string;
  price: number;
  description: string;
  specs: string;
  views: ViewType[];
  printArea: PrintArea;
  colorways: GarmentColorway[];
};

const DESIGN_SURFACE = { width: 360, height: 440 };

const GARMENTS: GarmentConfig[] = [
  {
    id: 'tee',
    name: 'T-Shirt',
    price: 34.99,
    description: 'Photographed heavyweight tee mockup with a centered front print area.',
    specs: 'Heavyweight cotton, relaxed fit, front print placement',
    views: ['front', 'back', 'sleeve'],
    printArea: { left: 31, top: 25.5, width: 38, height: 40.5 },
    colorways: [
      { name: 'Vintage White', hex: '#F5F1E8', image: teeWhiteMockup },
      { name: 'Jet Black', hex: '#18181B', image: teeBlackMockup },
    ],
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    price: 54.99,
    description: 'Real hoodie mockups with a chest print zone that sits slightly lower under the hood.',
    specs: 'Midweight fleece, kangaroo pocket, front print placement',
    views: ['front', 'back', 'sleeve'],
    printArea: { left: 30, top: 28, width: 40, height: 39 },
    colorways: [
      { name: 'Ash', hex: '#B8B6B1', image: hoodieAshMockup },
      { name: 'Cream', hex: '#E7DDC9', image: hoodieCreamMockup },
      { name: 'Wine', hex: '#6A2331', image: hoodieWineMockup },
    ],
  },
  {
    id: 'sweatshirt',
    name: 'Sweatshirt',
    price: 49.99,
    description: 'Crewneck sweatshirt preview with a centered printable area and cleaner silhouette lines.',
    specs: 'Cotton fleece, ribbed collar and cuffs, front print placement',
    views: ['front', 'back', 'sleeve'],
    printArea: { left: 25.5, top: 21.5, width: 49, height: 48.5 },
    colorways: [
      { name: 'Heather Grey', hex: '#B3B6BD' },
      { name: 'Bone', hex: '#E8E0D3' },
      { name: 'Navy', hex: '#22304A' },
      { name: 'Burgundy', hex: '#6B1C2A' },
    ],
  },
  {
    id: 'sleeveless-hoodie',
    name: 'Sleeveless Hoodie',
    price: 46.99,
    description: 'Cut-off hoodie mockups with photographed front views and open armholes.',
    specs: 'Sleeveless fleece, relaxed body, front print placement',
    views: ['front', 'back'],
    printArea: { left: 31.5, top: 27, width: 37, height: 39.5 },
    colorways: [
      { name: 'Black', hex: '#1A1A1A', image: sleevelessBlackMockup },
      { name: 'Forest', hex: '#264F3C', image: sleevelessGreenMockup },
    ],
  },
];

const VIEW_LABELS: Record<ViewType, string> = {
  front: 'Front',
  back: 'Back',
  sleeve: 'Sleeve',
};

const GRAPHIC_OPTIONS = [
  { icon: '\u2B50', label: 'Star' },
  { icon: '\u2665', label: 'Heart' },
  { icon: '\uD83D\uDD25', label: 'Fire' },
  { icon: '\u2728', label: 'Sparkle' },
  { icon: '\uD83C\uDFB5', label: 'Music' },
  { icon: '\u2600\uFE0F', label: 'Sun' },
  { icon: '\uD83C\uDF19', label: 'Moon' },
  { icon: '\u26A1', label: 'Lightning' },
  { icon: '\uD83C\uDF38', label: 'Flower' },
  { icon: '\uD83D\uDC8E', label: 'Diamond' },
  { icon: '\uD83E\uDD8B', label: 'Butterfly' },
  { icon: '\uD83C\uDFA8', label: 'Palette' },
];

function getGarmentConfig(garmentId: GarmentId) {
  return GARMENTS.find((garment) => garment.id === garmentId) ?? GARMENTS[0];
}

function buildIllustrationSvg(garmentId: GarmentId, view: ViewType, color: string) {
  const sleeve = `
    <path d="M120 96 C155 84 345 84 380 96 L420 492 C420 506 406 516 388 516 H112 C94 516 80 506 80 492 Z" fill="${color}" />
    <rect x="80" y="492" width="340" height="24" rx="6" fill="${color}" opacity="0.84" />
    <path d="M194 126 Q220 302 198 468" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="8" />
    <path d="M306 126 Q280 302 302 468" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="8" />
  `;

  const templates: Record<GarmentId, Record<'front' | 'back', string>> = {
    tee: {
      front: `
        <path d="M142 118 C162 104 182 100 204 98 C220 98 232 112 250 112 C268 112 280 98 296 98 C318 100 338 104 358 118 L438 176 C450 186 451 206 440 220 L394 274 V516 C394 532 384 542 368 542 H132 C116 542 106 532 106 516 V274 L60 220 C49 206 50 186 62 176 Z" fill="${color}" />
        <path d="M188 102 C202 88 222 82 250 82 C278 82 298 88 312 102" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="3.5" />
        <path d="M174 190 Q198 296 182 470" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="10" />
        <path d="M326 190 Q302 296 318 470" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="10" />
      `,
      back: `
        <path d="M142 118 C162 104 182 100 204 98 C218 96 230 90 250 90 C270 90 282 96 296 98 C318 100 338 104 358 118 L438 176 C450 186 451 206 440 220 L394 274 V516 C394 532 384 542 368 542 H132 C116 542 106 532 106 516 V274 L60 220 C49 206 50 186 62 176 Z" fill="${color}" />
        <path d="M192 104 C207 96 226 92 250 92 C274 92 293 96 308 104" fill="none" stroke="rgba(0,0,0,0.13)" stroke-width="3.5" />
        <line x1="250" y1="114" x2="250" y2="520" stroke="rgba(0,0,0,0.03)" stroke-width="1.5" />
      `,
    },
    hoodie: {
      front: `
        <path d="M118 164 C128 138 146 124 172 118 C184 116 198 122 214 126 C226 130 238 132 250 132 C262 132 274 130 286 126 C302 122 316 116 328 118 C354 124 372 138 382 164 L438 234 C446 244 446 258 438 268 L398 318 V520 C398 536 390 546 374 546 H126 C110 546 102 536 102 520 V318 L62 268 C54 258 54 244 62 234 Z" fill="${color}" />
        <path d="M164 162 C174 122 198 94 250 84 C302 94 326 122 336 162 C316 148 302 144 250 168 C198 144 184 148 164 162 Z" fill="${color}" opacity="0.9" />
        <path d="M172 378 C194 352 226 340 250 340 C274 340 306 352 328 378 L314 440 C284 452 216 452 186 440 Z" fill="rgba(0,0,0,0.06)" />
        <rect x="48" y="252" width="26" height="18" rx="5" fill="${color}" opacity="0.84" />
        <rect x="426" y="252" width="26" height="18" rx="5" fill="${color}" opacity="0.84" />
      `,
      back: `
        <path d="M118 164 C128 138 146 124 172 118 C184 116 198 122 214 126 C226 130 238 132 250 132 C262 132 274 130 286 126 C302 122 316 116 328 118 C354 124 372 138 382 164 L438 234 C446 244 446 258 438 268 L398 318 V520 C398 536 390 546 374 546 H126 C110 546 102 536 102 520 V318 L62 268 C54 258 54 244 62 234 Z" fill="${color}" />
        <path d="M172 168 C182 122 210 96 250 90 C290 96 318 122 328 168 C308 158 290 154 250 154 C210 154 192 158 172 168 Z" fill="${color}" opacity="0.9" />
        <line x1="250" y1="166" x2="250" y2="528" stroke="rgba(0,0,0,0.03)" stroke-width="1.5" />
        <rect x="48" y="252" width="26" height="18" rx="5" fill="${color}" opacity="0.84" />
        <rect x="426" y="252" width="26" height="18" rx="5" fill="${color}" opacity="0.84" />
      `,
    },
    sweatshirt: {
      front: `
        <path d="M102 162 C102 152 110 132 132 121 C150 112 168 108 182 108 C194 108 206 116 220 120 C230 124 240 126 250 126 C260 126 270 124 280 120 C294 116 306 108 318 108 C332 108 350 112 368 121 C390 132 398 152 398 162 L440 222 C446 230 446 242 438 250 L400 302 V520 C400 536 392 546 378 546 H122 C108 546 100 536 100 520 V302 L62 250 C54 242 54 230 60 222 Z" fill="${color}" />
        <path d="M176 110 C188 100 208 94 250 94 C292 94 312 100 324 110 C304 120 196 120 176 110 Z" fill="${color}" opacity="0.88" />
        <ellipse cx="250" cy="136" rx="62" ry="10" fill="rgba(0,0,0,0.06)" />
        <path d="M202 198 Q250 322 206 486" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="10" />
        <path d="M298 198 Q250 322 294 486" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="10" />
        <rect x="42" y="238" width="28" height="16" rx="3" fill="${color}" opacity="0.84" />
        <rect x="430" y="238" width="28" height="16" rx="3" fill="${color}" opacity="0.84" />
      `,
      back: `
        <path d="M102 162 C102 152 110 132 132 121 C150 112 168 108 182 108 C198 104 212 98 224 95 C238 92 246 91 250 91 C254 91 262 92 276 95 C288 98 302 104 318 108 C332 108 350 112 368 121 C390 132 398 152 398 162 L440 222 C446 230 446 242 438 250 L400 302 V520 C400 536 392 546 378 546 H122 C108 546 100 536 100 520 V302 L62 250 C54 242 54 230 60 222 Z" fill="${color}" />
        <path d="M188 112 C204 102 224 98 250 98 C276 98 296 102 312 112" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="3" />
        <line x1="250" y1="120" x2="250" y2="528" stroke="rgba(0,0,0,0.04)" stroke-width="1.5" />
        <rect x="42" y="238" width="28" height="16" rx="3" fill="${color}" opacity="0.84" />
        <rect x="430" y="238" width="28" height="16" rx="3" fill="${color}" opacity="0.84" />
      `,
    },
    'sleeveless-hoodie': {
      front: `
        <path d="M154 130 C172 118 190 112 210 108 C222 108 232 118 250 132 C268 118 278 108 290 108 C310 112 328 118 346 130 C362 144 372 168 376 190 L388 520 C388 536 378 546 362 546 H138 C122 546 112 536 112 520 L124 190 C128 168 138 144 154 130 Z" fill="${color}" />
        <path d="M176 170 C184 130 210 102 250 90 C290 102 316 130 324 170 C306 158 288 154 250 154 C212 154 194 158 176 170 Z" fill="${color}" opacity="0.9" />
        <path d="M136 206 Q126 262 118 330" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="6" />
        <path d="M364 206 Q374 262 382 330" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="6" />
      `,
      back: `
        <path d="M154 130 C172 118 190 112 210 108 C222 108 232 118 250 132 C268 118 278 108 290 108 C310 112 328 118 346 130 C362 144 372 168 376 190 L388 520 C388 536 378 546 362 546 H138 C122 546 112 536 112 520 L124 190 C128 168 138 144 154 130 Z" fill="${color}" />
        <path d="M186 174 C202 160 224 154 250 154 C276 154 298 160 314 174" fill="none" stroke="rgba(0,0,0,0.14)" stroke-width="3" />
        <path d="M136 206 Q126 262 118 330" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="6" />
        <path d="M364 206 Q374 262 382 330" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="6" />
        <line x1="250" y1="174" x2="250" y2="525" stroke="rgba(0,0,0,0.03)" stroke-width="1.5" />
      `,
    },
  };

  const markup = view === 'sleeve' ? sleeve : templates[garmentId][view];
  return `<svg viewBox="0 0 500 580" xmlns="http://www.w3.org/2000/svg">${markup}</svg>`;
}

function buildIllustrationDataUrl(garmentId: GarmentId, view: ViewType, color: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildIllustrationSvg(garmentId, view, color))}`;
}

function syncFabricCanvasLayout(canvas: fabric.Canvas) {
  canvas.wrapperEl.style.width = '100%';
  canvas.wrapperEl.style.height = '100%';
  canvas.wrapperEl.style.position = 'absolute';
  canvas.wrapperEl.style.inset = '0';
  canvas.wrapperEl.style.borderRadius = '18px';
  canvas.wrapperEl.style.overflow = 'hidden';
  canvas.lowerCanvasEl.style.width = '100%';
  canvas.lowerCanvasEl.style.height = '100%';
  canvas.lowerCanvasEl.style.borderRadius = '18px';
  canvas.upperCanvasEl.style.width = '100%';
  canvas.upperCanvasEl.style.height = '100%';
  canvas.upperCanvasEl.style.borderRadius = '18px';
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const payload = parts[1];

  if (!mimeMatch || !payload) {
    return null;
  }

  const bytes = atob(payload);
  const buffer = new Uint8Array(bytes.length);

  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index);
  }

  return new File([buffer], filename, { type: mimeMatch[1] });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

export default function CustomMockupStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRestoringRef = useRef(false);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedGarmentId, setSelectedGarmentId] = useState<GarmentId>('tee');
  const [selectedColorHex, setSelectedColorHex] = useState(GARMENTS[0].colorways[0].hex);
  const [activeView, setActiveView] = useState<ViewType>('front');
  const [isZoomed, setIsZoomed] = useState(false);
  const [showGraphicPanel, setShowGraphicPanel] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [size, setSize] = useState('M');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const { addItem } = useCart();

  const selectedGarment = getGarmentConfig(selectedGarmentId);
  const selectedColor =
    selectedGarment.colorways.find((colorway) => colorway.hex === selectedColorHex) ??
    selectedGarment.colorways[0];
  const currentPreviewSrc =
    activeView === 'front' && selectedColor.image
      ? selectedColor.image
      : buildIllustrationDataUrl(selectedGarment.id, activeView, selectedColor.hex);

  useEffect(() => {
    if (!selectedGarment.colorways.some((colorway) => colorway.hex === selectedColorHex)) {
      setSelectedColorHex(selectedGarment.colorways[0].hex);
    }
  }, [selectedColorHex, selectedGarment]);

  useEffect(() => {
    if (!selectedGarment.views.includes(activeView)) {
      setActiveView('front');
    }
  }, [activeView, selectedGarment]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: DESIGN_SURFACE.width,
      height: DESIGN_SURFACE.height,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    });

    syncFabricCanvasLayout(canvas);
    setFabricCanvas(canvas);

    const initialState = JSON.stringify(canvas.toJSON());
    setUndoStack([initialState]);
    setRedoStack([]);

    const onCanvasChange = () => {
      if (isRestoringRef.current) {
        return;
      }

      const nextState = JSON.stringify(canvas.toJSON());
      setUndoStack((previous) => [...previous, nextState]);
      setRedoStack([]);
    };

    canvas.on('object:modified', onCanvasChange);
    canvas.on('object:added', onCanvasChange);

    return () => {
      canvas.off('object:modified', onCanvasChange);
      canvas.off('object:added', onCanvasChange);
      canvas.dispose();
      setFabricCanvas(null);
    };
  }, []);

  const handleUndo = () => {
    if (!fabricCanvas || undoStack.length <= 1) {
      return;
    }

    isRestoringRef.current = true;
    const nextUndoStack = [...undoStack];
    const currentState = nextUndoStack.pop();

    if (!currentState) {
      isRestoringRef.current = false;
      return;
    }

    setRedoStack((previous) => [...previous, currentState]);
    const previousState = nextUndoStack[nextUndoStack.length - 1];

    if (!previousState) {
      isRestoringRef.current = false;
      return;
    }

    fabricCanvas.loadFromJSON(previousState).then(() => {
      syncFabricCanvasLayout(fabricCanvas);
      fabricCanvas.renderAll();
      setUndoStack(nextUndoStack);
      isRestoringRef.current = false;
    });
  };

  const handleRedo = () => {
    if (!fabricCanvas || redoStack.length === 0) {
      return;
    }

    isRestoringRef.current = true;
    const nextRedoStack = [...redoStack];
    const nextState = nextRedoStack.pop();

    if (!nextState) {
      isRestoringRef.current = false;
      return;
    }

    setUndoStack((previous) => [...previous, nextState]);
    fabricCanvas.loadFromJSON(nextState).then(() => {
      syncFabricCanvasLayout(fabricCanvas);
      fabricCanvas.renderAll();
      setRedoStack(nextRedoStack);
      isRestoringRef.current = false;
    });
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !fabricCanvas) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (fileEvent) => {
      const data = fileEvent.target?.result;

      if (typeof data !== 'string') {
        return;
      }

      fabric.Image.fromURL(data).then((image) => {
        image.scaleToWidth(220);
        fabricCanvas.centerObject(image);
        fabricCanvas.add(image);
        fabricCanvas.setActiveObject(image);
        fabricCanvas.renderAll();
      });
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const addText = () => {
    if (!fabricCanvas) {
      return;
    }

    const text = new fabric.IText('Your Text', {
      left: 92,
      top: 150,
      fontFamily: 'Arial',
      fill: '#111111',
      fontSize: 30,
      fontWeight: 'bold',
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
  };

  const addGraphic = (emoji: string) => {
    if (!fabricCanvas) {
      return;
    }

    const symbol = new fabric.IText(emoji, {
      left: 126,
      top: 160,
      fontSize: 64,
    });

    fabricCanvas.add(symbol);
    fabricCanvas.setActiveObject(symbol);
    fabricCanvas.renderAll();
    setShowGraphicPanel(false);
  };

  const buildCompositePreview = async () => {
    if (!fabricCanvas) {
      return null;
    }

    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();

    const basePreviewSrc =
      selectedColor.image ?? buildIllustrationDataUrl(selectedGarment.id, 'front', selectedColor.hex);
    const designDataUrl = fabricCanvas.toDataURL({ format: 'png', multiplier: 3 });
    const [basePreview, designLayer] = await Promise.all([
      loadImage(basePreviewSrc),
      loadImage(designDataUrl),
    ]);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 800;
    exportCanvas.height = 1024;
    const context = exportCanvas.getContext('2d');

    if (!context) {
      return null;
    }

    context.drawImage(basePreview, 0, 0, exportCanvas.width, exportCanvas.height);

    const printArea = selectedGarment.printArea;
    context.drawImage(
      designLayer,
      (printArea.left / 100) * exportCanvas.width,
      (printArea.top / 100) * exportCanvas.height,
      (printArea.width / 100) * exportCanvas.width,
      (printArea.height / 100) * exportCanvas.height,
    );

    return exportCanvas.toDataURL('image/png');
  };

  const saveDesign = async () => {
    try {
      const compositePreview = await buildCompositePreview();

      if (!compositePreview) {
        throw new Error('Mockup preview could not be generated.');
      }

      const link = document.createElement('a');
      link.download = `${selectedGarment.name.toLowerCase().replace(/\s+/g, '-')}-${selectedColor.name.toLowerCase().replace(/\s+/g, '-')}-mockup.png`;
      link.href = compositePreview;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Mockup saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save the mockup.');
    }
  };

  const handleAddToCart = async () => {
    if (!fabricCanvas) {
      return;
    }

    setIsAddingToCart(true);

    try {
      toast.loading('Building mockup...', { id: 'add-cart' });
      const compositePreview = await buildCompositePreview();

      if (!compositePreview) {
        throw new Error('Failed to build mockup preview');
      }

      const file = dataUrlToFile(
        compositePreview,
        `custom-${selectedGarment.id}-${Date.now()}.png`,
      );

      if (!file) {
        throw new Error('Failed to generate image file');
      }

      toast.loading('Uploading design...', { id: 'add-cart' });
      const imageUrl = await uploadProductImage(file);

      const customProduct = {
        id: `custom-${Date.now()}`,
        name: `Custom ${selectedGarment.name} - ${selectedColor.name}`,
        price: selectedGarment.price,
        category: 'custom',
        featuredImage: imageUrl,
        images: [imageUrl],
        useDesignSelection: false,
        colors: [selectedColor.hex],
        sizes: [size],
        description: selectedGarment.description,
        specs: selectedGarment.specs,
        isNew: true,
      };

      toast.loading('Adding to cart...', { id: 'add-cart' });
      await createProduct(customProduct);
      addItem(customProduct, size, selectedColor.hex);
      toast.success('Added to cart.', { id: 'add-cart' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to add to cart. Please try again.', { id: 'add-cart' });
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20 dark:bg-zinc-950">
      <div className="flex items-center gap-12 border-b border-gray-200 px-8 py-5 dark:border-zinc-800">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          <span className="text-muted-foreground">1:</span> Design it
        </h2>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          <span className="text-muted-foreground">2:</span> Preview it
        </h2>
      </div>

      <div className="mx-4 my-4 flex flex-col overflow-hidden rounded-sm border border-gray-200 lg:flex-row dark:border-zinc-800">
        <div className="flex w-full flex-shrink-0 flex-col gap-5 border-r border-gray-200 p-5 lg:w-[300px] dark:border-zinc-800">
          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Garment
            </label>
            <div className="grid gap-2">
              {GARMENTS.map((garment) => {
                const isActive = garment.id === selectedGarment.id;
                return (
                  <button
                    key={garment.id}
                    onClick={() => setSelectedGarmentId(garment.id)}
                    className={`rounded-sm border px-4 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-black bg-black text-white'
                        : 'border-gray-300 bg-white text-foreground hover:border-foreground hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold uppercase tracking-[0.18em]">
                        {garment.name}
                      </span>
                      <span className={`text-xs ${isActive ? 'text-white/70' : 'text-muted-foreground'}`}>
                        ${garment.price.toFixed(2)}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs leading-relaxed ${isActive ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {garment.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Mockup Color
            </label>
            <div className="grid grid-cols-2 gap-2">
              {selectedGarment.colorways.map((colorway) => {
                const isActive = selectedColor.hex === colorway.hex;
                return (
                  <button
                    key={`${selectedGarment.id}-${colorway.hex}`}
                    onClick={() => setSelectedColorHex(colorway.hex)}
                    className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200 dark:bg-blue-950/40 dark:ring-blue-900'
                        : 'border-gray-300 bg-white hover:border-gray-500 dark:border-zinc-700 dark:bg-zinc-900'
                    }`}
                  >
                    <span className="h-6 w-6 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: colorway.hex }} />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                      {colorway.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Front view uses real garment photography when a mockup image exists for that colorway.
            </p>
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              View
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['front', 'back', 'sleeve'] as ViewType[]).map((view) => {
                const isAvailable = selectedGarment.views.includes(view);
                const isActive = activeView === view;

                return (
                  <button
                    key={view}
                    onClick={() => isAvailable && setActiveView(view)}
                    disabled={!isAvailable}
                    className={`rounded-sm border px-4 py-2 text-sm font-medium transition-all ${
                      !isAvailable
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600'
                        : isActive
                          ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                          : 'border-gray-300 bg-white text-foreground hover:bg-gray-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {VIEW_LABELS[view]}
                  </button>
                );
              })}
            </div>
            {!selectedGarment.views.includes('sleeve') && (
              <p className="mt-2 text-xs text-muted-foreground">
                Sleeveless hoodies do not include a sleeve template preview.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-2 dark:border-zinc-800">
            <label className="flex cursor-pointer items-center gap-3 rounded-sm bg-gray-100 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
              <Upload size={16} className="flex-shrink-0 text-blue-500" />
              <span>UPLOAD FILE</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            <button
              onClick={addText}
              className="flex items-center gap-3 rounded-sm bg-gray-100 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <Type size={16} className="flex-shrink-0 text-blue-500" />
              <span>ADD TEXT</span>
            </button>

            <button
              onClick={() => setShowGraphicPanel((current) => !current)}
              className="flex items-center gap-3 rounded-sm bg-gray-100 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <Smile size={16} className="flex-shrink-0 text-yellow-500" />
              <span>ADD GRAPHIC</span>
            </button>

            {showGraphicPanel && (
              <div className="grid grid-cols-4 gap-2 rounded-sm border border-gray-200 bg-gray-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                {GRAPHIC_OPTIONS.map((graphic) => (
                  <button
                    key={graphic.label}
                    onClick={() => addGraphic(graphic.icon)}
                    className="rounded p-2 text-2xl transition-colors hover:bg-gray-200 dark:hover:bg-zinc-600"
                    title={graphic.label}
                  >
                    {graphic.icon}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto border-t border-gray-200 pt-4 dark:border-zinc-800">
            <button
              onClick={saveDesign}
              className="flex w-full items-center gap-3 rounded-sm bg-blue-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-600"
            >
              <Download size={18} />
              <span>SAVE MOCKUP</span>
            </button>
            <p className="mt-1.5 text-xs italic text-muted-foreground">
              Downloads the garment preview with your artwork applied.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-3 dark:border-zinc-800">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Size
            </label>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {['S', 'M', 'L', 'XL', '2XL'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSize(option)}
                  className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-all ${
                    size === option
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-gray-300 bg-white hover:border-foreground dark:border-zinc-600 dark:bg-zinc-900'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <Button
              className="h-10 w-full rounded-sm bg-black text-xs font-bold uppercase tracking-wider text-white hover:bg-black/90"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? <Loader2 className="animate-spin" size={16} /> : <ShoppingBag size={16} />}
              {isAddingToCart ? 'Adding...' : `Add ${selectedGarment.name}`}
            </Button>
          </div>
        </div>

        <div className="relative flex min-h-[640px] flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(244,244,245,0.96)_40%,_rgba(228,228,231,0.92)_100%)] p-6 dark:bg-zinc-900">
          <div className="absolute left-4 top-4 z-10 rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700 shadow-sm backdrop-blur dark:bg-zinc-900/80 dark:text-zinc-200">
            {selectedGarment.name} / {selectedColor.name}
          </div>

          <button
            onClick={() => setIsZoomed((current) => !current)}
            className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-sm bg-blue-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-600"
          >
            {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
            {isZoomed ? 'Zoom -' : 'Zoom +'}
          </button>

          <div className="mb-6 max-w-[34rem] text-center">
            <h3 className="text-xl font-semibold text-foreground">
              Switch between garments with front photo mockups where available
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Front view uses real garment photography for tees, hoodies, and sleeveless hoodies.
              Back and sleeve views stay in template mode so you can still inspect placement context.
            </p>
          </div>

          <div className={`relative w-full max-w-[470px] transition-transform duration-300 ${isZoomed ? 'scale-[1.16]' : 'scale-100'}`}>
            <div className="aspect-[25/32] rounded-[32px] border border-white/70 bg-white/50 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.16)] backdrop-blur">
              <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.85),rgba(244,244,245,0.92))]">
                <img
                  src={currentPreviewSrc}
                  alt={`${selectedGarment.name} ${selectedColor.name} ${activeView} preview`}
                  className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_30px_30px_rgba(15,23,42,0.14)]"
                  draggable="false"
                />

                {activeView === 'front' && (
                  <div
                    className="absolute z-10 overflow-hidden rounded-[18px]"
                    style={{
                      left: `${selectedGarment.printArea.left}%`,
                      top: `${selectedGarment.printArea.top}%`,
                      width: `${selectedGarment.printArea.width}%`,
                      height: `${selectedGarment.printArea.height}%`,
                    }}
                  >
                    <div className="pointer-events-none absolute z-20 rounded-[14px] border border-dashed border-zinc-400/45" style={{ inset: '4.5%' }} />
                    <canvas ref={canvasRef} className="h-full w-full" />
                  </div>
                )}

                {activeView !== 'front' && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
                    <div className="rounded-sm bg-white/90 px-4 py-2 text-center text-sm text-muted-foreground shadow-sm backdrop-blur dark:bg-zinc-800/90">
                      Design editing stays on the front mockup. Switch back to front to position artwork.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 py-4">
        <button
          onClick={handleUndo}
          disabled={undoStack.length <= 1}
          className={`flex items-center gap-1.5 rounded-sm border px-4 py-2 text-sm font-medium transition-all ${
            undoStack.length > 1
              ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
              : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600'
          }`}
        >
          <Undo2 size={14} />
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className={`flex items-center gap-1.5 rounded-sm border px-4 py-2 text-sm font-medium transition-all ${
            redoStack.length > 0
              ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
              : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600'
          }`}
        >
          Redo
          <Redo2 size={14} />
        </button>
      </div>
    </div>
  );
}
