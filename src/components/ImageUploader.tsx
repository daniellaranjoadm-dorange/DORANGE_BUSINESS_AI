import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, RefreshCw, Check, Camera, Link, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ImageUploaderProps {
  label: string;
  currentImageUrl?: string;
  onImageSaved: (url: string) => void;
  aspectRatio?: 'square' | 'banner' | 'portrait' | 'auto';
  type?: 'logo' | 'cover' | 'portfolio' | 'service' | 'general';
  helperText?: string;
  suggestedWidth?: number;
  suggestedHeight?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  currentImageUrl,
  onImageSaved,
  aspectRatio = 'square',
  type = 'general',
  helperText,
  suggestedWidth,
  suggestedHeight,
}) => {
  const { directUploadImage, deleteUploadedImage, showNotification } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  useEffect(()=>{setPreview(currentImageUrl||null)},[currentImageUrl]);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

  // Determina classe de aspecto
  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square w-32 md:w-36'
      : aspectRatio === 'banner'
      ? 'aspect-[3/1] w-full max-h-48'
      : aspectRatio === 'portrait'
      ? 'aspect-[4/5] w-36 md:w-44'
      : 'aspect-video w-full';

  const handleFileProcess = async (file: File) => {
    // Validação de tipo
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showNotification('Formato inválido. Envie imagens PNG, JPG ou WebP.', 'error');
      return;
    }

    // Validação de tamanho (máximo 8MB)
    if (file.size > 8 * 1024 * 1024) {
      showNotification('Arquivo muito grande. O limite máximo é 8MB.', 'error');
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);

        try {
          // Envia para o endpoint de persistência física no backend
          const res = await directUploadImage(base64, file.name, type);
          if (res && res.url) {
            setPreview(res.url);
            onImageSaved(res.url);
          }
        } catch (err: any) {
          setPreview(currentImageUrl || null);
          showNotification(err.message || 'Falha no envio. A imagem não foi salva.', 'error');
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror=()=>{setIsUploading(false);setPreview(currentImageUrl||null);showNotification('Não foi possível ler o arquivo.', 'error');};
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      showNotification('Erro ao processar imagem.', 'error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {if(currentImageUrl?.startsWith('/api/uploads/'))await deleteUploadedImage(currentImageUrl);}catch {showNotification('Não foi possível excluir a imagem.', 'error');return;}
    setPreview(null);
    onImageSaved('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showNotification('Imagem removida.', 'info');
  };

  const handleManualUrlSave = () => {
    if (!manualUrl.trim()) return;
    if(!/^https:\/\//.test(manualUrl.trim())){showNotification('Use uma URL HTTPS válida.', 'error');return;}
    setPreview(manualUrl);
    onImageSaved(manualUrl.trim());
    setShowUrlInput(false);
    showNotification('URL da imagem configurada.', 'success');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-600">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1"
        >
          <Link className="w-3 h-3" />
          {showUrlInput ? 'Ocultar URL' : 'Inserir URL externa'}
        </button>
      </div>

      {showUrlInput && (
        <div className="p-3 bg-stone-100/80 rounded-xl border border-stone-200 flex gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://exemplo.com/sua-imagem.png"
            className="flex-1 text-xs px-3 py-1.5 bg-white border border-stone-300 rounded-lg outline-none focus:ring-1 focus:ring-stone-900"
          />
          <button
            type="button"
            onClick={handleManualUrlSave}
            className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Salvar
          </button>
        </div>
      )}

      {/* Caixa de Upload / Preview */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 text-center ${
          isDragging
            ? 'border-rose-500 bg-rose-50/50'
            : preview
            ? 'border-stone-300 bg-stone-50 hover:border-stone-400'
            : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="w-full flex flex-col items-center">
            <div className={`relative ${aspectClass} overflow-hidden rounded-xl border border-stone-200 bg-stone-100 flex items-center justify-center`}>
              <img
                src={preview}
                alt="Preview"
                className={`w-full h-full ${fitMode === 'cover' ? 'object-cover' : 'object-contain'}`}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white text-xs gap-1.5 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Salvando no servidor...
                </div>
              )}
            </div>

            {/* Ações da imagem */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFitMode(fitMode === 'cover' ? 'contain' : 'cover');
                }}
                className="text-xs px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs font-medium"
              >
                {fitMode === 'cover' ? 'Ajustar: Preencher' : 'Ajustar: Conter'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-xs px-2.5 py-1 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-2xs font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Substituir
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-2xs font-medium"
                title="Remover imagem"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 px-2 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mb-2 shadow-2xs group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-stone-800">
              Clique ou arraste para enviar {label.toLowerCase()}
            </p>
            <p className="text-[11px] text-stone-500 mt-0.5">
              PNG, JPG ou WebP de até 8MB
            </p>
            {suggestedWidth && suggestedHeight && (
              <p className="text-[10px] text-stone-400 mt-1">
                Recomendado: {suggestedWidth}x{suggestedHeight}px
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-stone-100 rounded-lg text-stone-600 font-medium border border-stone-200/60">
                <Camera className="w-3 h-3" /> Galeria / Câmera
              </span>
            </div>
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-stone-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-stone-400 shrink-0" />
          {helperText}
        </p>
      )}
    </div>
  );
};
