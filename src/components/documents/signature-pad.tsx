import { useRef, useEffect, useState, useCallback } from 'react';
import SignaturePadLib from 'signature_pad';
import { Button } from '@/components/ui/button';
import { Eraser, Check, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange?: (dataUrl: string | null) => void;
  name: string;
}

export function SignaturePad({ onSignatureChange, name }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isSigned) return;
    const container = canvas.parentElement;
    if (!container) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = container.clientWidth * ratio;
    canvas.height = container.clientHeight * ratio;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
    padRef.current?.clear();
  }, [isSigned]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: '#1a1a2e',
    });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      padRef.current?.off();
    };
  }, [resizeCanvas]);

  const handleClear = () => {
    padRef.current?.clear();
  };

  const handleConfirm = () => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
    setIsSigned(true);
    onSignatureChange?.(dataUrl);
  };

  const handleReset = () => {
    setSignatureDataUrl(null);
    setIsSigned(false);
    onSignatureChange?.(null);
    setTimeout(resizeCanvas, 50);
  };

  if (isSigned && signatureDataUrl) {
    return (
      <div className="mt-16 flex flex-col items-center">
        <img src={signatureDataUrl} alt="Assinatura" className="h-20 object-contain" />
        <div className="w-64 border-t border-foreground pt-2 text-center">
          <p className="font-serif text-sm text-foreground">{name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="mt-3 print:hidden">
          <RotateCcw className="h-4 w-4 mr-1" />
          Assinar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-16 flex flex-col items-center print:hidden">
      <p className="font-serif text-xs text-muted-foreground mb-2">Assine no campo abaixo</p>
      <div className="w-full max-w-sm h-32 border-2 border-dashed border-foreground/30 rounded-lg relative bg-white">
        <canvas ref={canvasRef} className="absolute inset-0 touch-none" />
      </div>
      <div className="w-64 border-t border-foreground pt-2 text-center mt-2">
        <p className="font-serif text-sm text-foreground">{name}</p>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="h-4 w-4 mr-1" />
          Limpar
        </Button>
        <Button size="sm" onClick={handleConfirm}>
          <Check className="h-4 w-4 mr-1" />
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}
