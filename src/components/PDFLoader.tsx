import { Loader2 } from 'lucide-react';

interface PDFLoaderProps {
  isGenerating: boolean;
}

export function PDFLoader({ isGenerating }: PDFLoaderProps) {
  if (!isGenerating) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-slate-900 mb-4" />
      <h2 className="text-xl font-semibold text-slate-900">Generating PDF...</h2>
      <p className="text-slate-500">Please wait while we prepare your document.</p>
    </div>
  );
}
