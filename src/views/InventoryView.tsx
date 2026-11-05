import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  ShoppingCart, 
  TrendingDown, 
  CheckCircle2, 
  Edit3, 
  Search,
  Filter,
  History,
  Layers
} from 'lucide-react';
import { formatCurrencyBRL, formatDateBR } from '../utils/validators';
import { InventoryItem } from '../types';

export const InventoryView: React.FC = () => {
  const { currentTenant, inventory, inventoryMovements, createInventoryItem, updateInventoryItem, consumeInventory, showNotification } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements'>('inventory');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Outros');
  const [unit, setUnit] = useState<'un' | 'ml' | 'g' | 'pacote' | 'frasco'>('frasco');
  const [quantity, setQuantity] = useState('5');
  const [minQuantity, setMinQuantity] = useState('2');
  const [unitCost, setUnitCost] = useState('45.00');
  const [supplier, setSupplier] = useState('');

  const categories = ['all', ...new Set([...(currentTenant?.businessSegment === 'nails' ? ['Géis', 'Fibras', 'Esmaltes', 'Lixas e Brocas'] : ['Produtos', 'Equipamentos']), 'Descartáveis', 'Químicos', 'Outros', ...inventory.map(item => item.category)])];

  const filteredItems = inventory.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (search.trim()) {
      return item.name.toLowerCase().includes(search.toLowerCase()) || (item.supplier && item.supplier.toLowerCase().includes(search.toLowerCase()));
    }
    return true;
  });

  const lowStockItems = inventory.filter((i) => i.quantity <= i.minQuantity);
  const totalStockValue = inventory.reduce((acc, i) => acc + i.quantity * i.unitCost, 0);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createInventoryItem({
      name,
      category,
      unit,
      quantity: Number(quantity),
      minQuantity: Number(minQuantity),
      unitCost: Number(unitCost),
      supplier,
    });

    setIsAddModalOpen(false);
    setName('');
    setSupplier('');
  };

  const handleQuickAdjustQuantity = async (item: InventoryItem, delta: number) => {
    if (delta < 0) {
      await consumeInventory(item.id, Math.abs(delta), 'Ajuste manual de saída');
    } else {
      const nextQty = item.quantity + delta;
      await updateInventoryItem(item.id, { quantity: nextQty });
    }
  };

  return (
    <div className="space-y-6 pb-20 xl:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-stone-900 text-xl sm:text-2xl flex items-center gap-2">
            Controle de Estoque & Insumos
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
              R5.1
            </span>
          </h1>
          <p className="text-xs text-stone-700">
            Acompanhe o consumo de géis, fibras, lixas e materiais descartáveis do {currentTenant?.tradeName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subtabs */}
          <div className="flex items-center p-0.5 bg-stone-100 rounded-xl border border-stone-200">
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeSubTab === 'inventory' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Itens em Estoque
            </button>
            <button
              onClick={() => setActiveSubTab('movements')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                activeSubTab === 'movements' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-700" />
              <span>Movimentações ({inventoryMovements.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Cadastrar Insumo
          </button>
        </div>
      </div>

      {/* KPI Cards de Estoque */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-700">Total de Produtos</span>
          <div className="font-display font-bold text-2xl text-stone-900 tabular-nums mt-1">
            {inventory.length}
          </div>
          <p className="text-[11px] text-stone-700 mt-1">Itens monitorados</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-700">Alertas de Reposição</span>
          <div className="font-display font-bold text-2xl text-rose-600 tabular-nums mt-1">
            {lowStockItems.length}
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-1">
            {lowStockItems.length > 0 ? 'Abaixo do estoque mínimo' : 'Estoque regular'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-700">Valor Investido em Estoque</span>
          <div className="font-display font-bold text-2xl text-emerald-700 tabular-nums mt-1">
            {formatCurrencyBRL(totalStockValue)}
          </div>
          <p className="text-[11px] text-stone-700 mt-1">Patrimônio em materiais</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <span className="text-xs font-semibold text-stone-700">Movimentações Auditadas</span>
          <div className="font-display font-bold text-2xl text-stone-900 tabular-nums mt-1">
            {inventoryMovements.length}
          </div>
          <p className="text-[11px] text-stone-700 mt-1">Registro de consumo e reposição</p>
        </div>
      </div>

      {/* Alerta de Lista de Compras Automática */}
      {lowStockItems.length > 0 && activeSubTab === 'inventory' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 text-xs text-rose-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>Lista de Compras Imediata ({lowStockItems.length} itens precisando de reposição)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {lowStockItems.map((item) => (
              <div key={item.id} className="bg-white p-2.5 rounded-xl border border-rose-200 flex justify-between items-center">
                <div>
                  <p className="font-bold text-stone-900">{item.name}</p>
                  <p className="text-[11px] text-stone-700">Fornecedor: {item.supplier || 'Pendente'}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-600">Restam {item.quantity} {item.unit}</span>
                  <span className="text-[10px] text-stone-700 block">(Mínimo: {item.minQuantity})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Insumos ou Histórico de Movimentações */}
      {activeSubTab === 'inventory' ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar insumo por nome ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    categoryFilter === c ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {c === 'all' ? 'Todos' : c}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-700 font-semibold">
                  <th className="py-3 px-4">Item / Insumo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  <th className="py-3 px-4 text-center">Quantidade Atual</th>
                  <th className="py-3 px-4 text-center">Mínimo</th>
                  <th className="py-3 px-4 text-right">Custo Unitário</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Consumir / Ajustar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((item) => {
                  const isLow = item.quantity <= item.minQuantity;
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        {item.category}
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        {item.supplier || '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-stone-900 tabular-nums">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center text-stone-700 tabular-nums">
                        {item.minQuantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
                        {formatCurrencyBRL(item.unitCost)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isLow ? 'Repor Urgente' : 'Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuickAdjustQuantity(item, -1)}
                            className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                            title="Consumir 1 unidade com log de auditoria"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleQuickAdjustQuantity(item, 1)}
                            className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold text-xs flex items-center justify-center cursor-pointer"
                            title="Adicionar 1 unidade"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tabela de Movimentações */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-stone-900">Histórico de Consumos e Ajustes de Estoque</span>
            </div>
            <span className="text-xs text-stone-500 font-medium">{inventoryMovements.length} registro(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-700 font-semibold">
                  <th className="py-3 px-4">Data e Hora</th>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4 text-center">Quantidade</th>
                  <th className="py-3 px-4">Motivo / Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {inventoryMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-500">
                      Nenhuma movimentação de estoque registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  inventoryMovements.map((m) => {
                    const item = inventory.find((i) => i.id === m.inventoryItemId);
                    return (
                      <tr key={m.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 text-stone-600">
                          {new Date(m.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 font-bold text-stone-900">
                          {item?.name || m.inventoryItemId}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.type === 'consumption'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {m.type === 'consumption' ? 'Consumo' : 'Entrada'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold tabular-nums">
                          {m.type === 'consumption' ? `-${m.quantity}` : `+${m.quantity}`} {item?.unit || 'un'}
                        </td>
                        <td className="py-3 px-4 text-stone-700">
                          {m.reason}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Cadastrar Insumo */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-stone-900 text-base">
              Cadastrar Insumo no Estoque
            </h3>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Top Coat No-Wipe Vòlia 12ml"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria</label>
                  <select
                    aria-label="Categoria"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  >
                    {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Unidade</label>
                  <select
                    aria-label="Unidade"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  >
                    <option value="frasco">Frasco</option>
                    <option value="pacote">Pacote</option>
                    <option value="un">Unidade (un)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="g">Grama (g)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Estoque Mín.</label>
                  <input
                    type="number"
                    required
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Fornecedor</label>
                <input
                  type="text"
                  placeholder="Ex: Distribuidora de produtos profissionais"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-xs"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
