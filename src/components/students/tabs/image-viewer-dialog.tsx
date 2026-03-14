import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCw, X, Loader2 } from "lucide-react";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  fileName: string;
  fileType?: "image" | "pdf";
  onDownload?: () => void;
  loading?: boolean;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  imageUrl,
  fileName,
  fileType = "image",
  onDownload,
  loading,
}: ImageViewerDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isImage = fileType === "image";

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setZoom(1);
      setRotation(0);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-black/95 border-none">
        {/* Toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
          <p className="text-sm text-white/80 truncate max-w-[50%]">{fileName}</p>
          <div className="flex items-center gap-1">
            {isImage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
                  onClick={handleZoomOut}
                  title="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs text-white/60 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
                  onClick={handleZoomIn}
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
                  onClick={handleRotate}
                  title="Rotacionar"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
            {onDownload && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
                onClick={onDownload}
                title="Baixar"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
              onClick={() => handleOpenChange(false)}
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center w-full h-[80vh] overflow-auto p-8 pt-14">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-white/60" />
          ) : imageUrl ? (
            isImage ? (
              <img
                src={imageUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
                draggable={false}
              />
            ) : (
              <iframe
                src={imageUrl}
                title={fileName}
                className="w-full h-full rounded"
                style={{ border: "none" }}
              />
            )
          ) : (
            <p className="text-white/60">Erro ao carregar arquivo</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
