import { ImageUploader } from '../components/ImageUploader';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Edit2, 
  Trash2, 
  Check, 
  Search,
  Filter
} from 'lucide-react';
import { formatCurrencyBRL } from '../utils/validators';
import { CatalogueImportModal } from '../components/CatalogueImportModal';
import { MarketBenchmarkModal } from '../components/MarketBenchmarkModal';
import { Service } from '../types';
import {ServiceTeamPicker} from '../components/ServiceTeamPicker';

export const CatalogView: React.FC = () => {
  const { currentTenant, currentSegment, services, professionals, createService, updateService, deleteService, showNotification } = useApp();

  const segmentCategories = Array.from(new Set([
    ...(currentSegment ? currentSegment.suggestedServices.map((s) => s.category) : []),
    ...services.map((s) => s.category).filter(Boolean),
  ]));

  const categories = ['all', ...(segmentCategories.length > 0 ? segmentCategories : ['Geral', 'Serviços'])];

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState<boolean>(false);

  // Formulário de novo serviço
  const [newServiceName, setNewServiceName] = useState('');
  const [newCategory, setNewCategory] = useState(segmentCategories[0] || 'Geral');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newProfessionals,setNewProfessionals]=useState<string[]>([]);
  const [newImageUrl,setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const filteredServices = services.filter((s) => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newPrice || !newDuration) return;

    try {
      await createService({
        name: newServiceName,
        category: newCategory,
        price: parseFloat(newPrice),
        durationMinutes: parseInt(newDuration, 10),
        description: newDescription,
        materialsNeeded: [],
        imageUrl:newImageUrl,
        professionalIds:newProfessionals,
      });
      setIsNewServiceModalOpen(false);
      setNewServiceName('');
      setNewDescription('');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar serviço');
    }
  };

  const handleToggleActive = async (service: Service) => {
    await updateService(service.id, { active: !service.active });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o serviço "${name}" do catálogo?`)) {
      await deleteService(id);
    }
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8">
      {/* Top Header & AI Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-stone-900 text-xl sm:text-2xl">
            Catálogo Inteligente de Serviços
          </h1>
          <p className="text-xs text-stone-700">
            Gerencie os procedimentos, preços e durações oferecidos pelo {currentTenant?.tradeName}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBenchmarkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl transition-all shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-amber-600" />
            Simular preço
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Importar catálogo
          </button>

          <button
            onClick={() => setIsNewServiceModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Novo Serviço
          </button>
        </div>
      </div>

      {/* Busca e Filtros de Categoria */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por procedimento, técnica ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-amber-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-stone-900 text-white font-semibold shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grade de Cards de Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs flex flex-col justify-between ${
              service.active ? 'border-stone-200 hover:border-amber-300' : 'border-stone-200 opacity-60'
            }`}
          >
            <div>
              {/* Imagem do Serviço */}
              {service.imageUrl && (
                <div className="h-36 w-full relative overflow-hidden bg-stone-100">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {service.category}
                  </div>
                  {service.isPopular && (
                    <div className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      Mais Procurado
                    </div>
                  )}
                </div>
              )}

              {/* Detalhes do Serviço */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-stone-900 text-sm leading-tight">
                    {service.name}
                  </h3>
                  <span className="font-bold text-stone-900 text-sm tabular-nums shrink-0">
                    {formatCurrencyBRL(service.price)}
                  </span>
                </div>

                <p className="text-xs text-stone-700 line-clamp-2">
                  {service.description || 'Configure o escopo deste serviço para seus clientes.'}
                </p>

                <div className="flex items-center gap-3 text-xs text-stone-700 pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-stone-700" />
                    {service.durationMinutes} minutos
                  </span>
                  <span>·</span>
                  <span className={service.active ? 'text-emerald-700 font-semibold' : 'text-stone-700'}>
                    {service.active ? 'Disponível' : 'Desativado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações do Card */}
            <p className="px-4 pb-3 text-xs text-stone-500">{professionals.some(p=>p.active&&p.services.includes(service.id))?'Equipe vinculada para agendamento':'Vincule um profissional para disponibilizar no portal'}</p>
            <div className="px-4 py-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={service.active}
                  onChange={() => handleToggleActive(service)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-[11px] font-medium text-stone-700">
                  {service.active ? 'Ativo na Agenda' : 'Oculto'}
                </span>
              </label>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingService({...service,professionalIds:professionals.filter(p=>p.active&&p.services.includes(service.id)).map(p=>p.id)})}
                  className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-200/60 transition-colors"
                  title="Configurar serviço e equipe"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(service.id, service.name)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Excluir Serviço"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Serviço */}
      {isNewServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-stone-900 text-base">
              Cadastrar Novo Serviço
            </h3>
            <form onSubmit={handleCreateService} className="space-y-3">
<ImageUploader label="Imagem do serviço" type="service" currentImageUrl={newImageUrl} onImageSaved={setNewImageUrl}/>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Procedimento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Banho de Gel Diamante"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Duração (min) *</label>
                  <input
                    type="number"
                    step="5"
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria</label>
                <select
                  aria-label="Categoria"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                >
                  {segmentCategories.map(category=><option key={category} value={category}>{category}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Descreva a técnica e os benefícios..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <ServiceTeamPicker value={newProfessionals} onChange={setNewProfessionals}/>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewServiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Serviço */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-stone-900 text-base">
              Editar: {editingService.name}
            </h3>
            <div className="space-y-3">
              <ImageUploader label="Imagem do serviço" type="service" currentImageUrl={editingService.imageUrl} onImageSaved={url=>setEditingService({...editingService,imageUrl:url})}/>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Duração (min)</label>
                  <input
                    type="number"
                    step="5"
                    value={editingService.durationMinutes}
                    onChange={(e) => setEditingService({ ...editingService, durationMinutes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <label className="block text-xs font-semibold">Custo de materiais por serviço (R$)<input aria-label="Custo de materiais do serviço" type="number" min="0" step="0.01" value={editingService.costBRL??0} onChange={e=>setEditingService({...editingService,costBRL:Number(e.target.value)})} className="block mt-1 w-full border rounded-xl p-3"/></label>
              <ServiceTeamPicker value={editingService.professionalIds||[]} onChange={ids=>setEditingService({...editingService,professionalIds:ids})}/>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await updateService(editingService.id, {
                      price: editingService.price,
                      durationMinutes: editingService.durationMinutes,
                      description: editingService.description,
                      professionalIds:editingService.professionalIds,
                      costBRL:editingService.costBRL,
                    });
                    setEditingService(null);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modais de IA */}
      <CatalogueImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <MarketBenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />
    </div>
  );
};
