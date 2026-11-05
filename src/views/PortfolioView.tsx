import { ImageUploader } from '../components/ImageUploader';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Camera, 
  Plus, 
  Heart, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  Tag, 
  ShieldCheck,
  Upload
} from 'lucide-react';
import { PortfolioItem } from '../types';

export const PortfolioView: React.FC = () => {
  const { currentTenant, currentSegment, portfolio, createPortfolioItem, showNotification } = useApp();

  const [activeCategory, setActiveCategory] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Trabalhos');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  const categories = ['all', ...new Set(['Trabalhos', ...currentSegment.suggestedServices.map(s => s.category), ...portfolio.map(p => p.category)])];

  const filteredPortfolio = portfolio.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    return true;
  });

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl || !consentGiven) {
      alert('Envie uma foto, informe o título e confirme a autorização para publicação.');
      return;
    }

    await createPortfolioItem({
      title,
      category,
      imageUrl,
      description,
    });

    setIsUploadModalOpen(false);
    setTitle('');
    setDescription('');
    setConsentGiven(false);
  };

  const handleShareOnInstagram = (item: PortfolioItem) => {
    showNotification('Foto preparada para compartilhamento no Instagram!', 'info');
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-stone-900 text-xl sm:text-2xl flex items-center gap-2">
            Portfólio & Galeria
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
              Fase 10
            </span>
          </h1>
          <p className="text-xs text-stone-700">
            Exiba seus trabalhos reais no portal público do {currentTenant?.tradeName}
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
        >
          <Camera className="w-4 h-4" />
          Adicionar Trabalho Real
        </button>
      </div>

      {/* Categorias de Filtro */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cat === 'all' ? 'Todos os Trabalhos' : cat}
          </button>
        ))}
      </div>

      {/* Grid de Fotos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPortfolio.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-56 w-full overflow-hidden bg-stone-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-md">
                  {item.category}
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>{item.likes}</span>
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                <h3 className="font-display font-bold text-stone-900 text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 line-clamp-2">
                  {item.description || 'Trabalho realizado com produtos de alta durabilidade.'}
                </p>
              </div>
            </div>

            <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Exibido no Portal Público
              </span>

              <button
                onClick={() => handleShareOnInstagram(item)}
                className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-200/60 transition-colors"
                title="Compartilhar no Instagram"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Adicionar Foto ao Portfólio */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-stone-900 text-base">
              Adicionar Trabalho ao Portfólio
            </h3>
            <form onSubmit={handleCreatePortfolio} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Título do Trabalho *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alongamento em Fibra com Francesinha Reversa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria</label>
                <select
                  aria-label="Categoria"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                >
                  {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <ImageUploader label="Foto do trabalho" type="portfolio" currentImageUrl={imageUrl} onImageSaved={setImageUrl}/>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição das Técnicas</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Técnicas, produtos e cuidados utilizados..."
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                  />
                  <span className="text-[11px] text-stone-700 leading-tight">
                    Declaro que o cliente autorizou a fotografia do trabalho para divulgação comercial e portfólio no portal público, conforme as diretrizes da LGPD.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!consentGiven}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition-all shadow-xs"
                >
                  Publicar no Portfólio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
