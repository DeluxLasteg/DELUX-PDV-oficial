/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, User } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useToast } from './ToastContext';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  MoreVertical,
  Package,
  Filter,
  X,
  LayoutGrid,
  List,
  StretchHorizontal,
  Layout,
  TableProperties,
  Monitor,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  user: User;
}

type ViewMode = 'extra-large' | 'large' | 'medium' | 'small' | 'list' | 'details' | 'tiles' | 'content';

export default function Inventory({ products, setProducts, user }: InventoryProps) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('dlx_inv_view') as ViewMode) || 'large';
  });
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dlx_inv_view', mode);
    setIsViewMenuOpen(false);
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.nome.toLowerCase().includes(term) || 
      p.barcode.includes(term) ||
      p.cat.toLowerCase().includes(term)
    );
  }, [searchTerm, products]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData: Product = {
      id: editingProduct ? editingProduct.id : Date.now(),
      nome: formData.get('nome') as string,
      barcode: formData.get('barcode') as string,
      cat: formData.get('cat') as string,
      custo: Number(formData.get('custo')),
      venda: Number(formData.get('venda')),
      estoque: Number(formData.get('estoque')),
      estoqueMinimo: Number(formData.get('estoqueMinimo')),
      img: formData.get('img') as string || undefined,
      specs: formData.get('specs') as string || undefined,
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
      showToast('Produto atualizado com sucesso!');
    } else {
      setProducts(prev => [...prev, productData]);
      showToast('Novo produto cadastrado!', 'success');
    }

    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setProducts(prev => prev.filter(p => p.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      showToast('Produto excluído do estoque.', 'warning');
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  return (    <div className="space-y-8 pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Estoque</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie seus produtos e níveis de estoque.</p>
        </div>
        
        {user.nivel === 'gerente' && (
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        )}
      </header>

      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Filtrar produtos..." 
            className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 pl-12 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Filtrar produtos"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            className="h-14 bg-slate-50 dark:bg-slate-950 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 whitespace-nowrap"
          >
            <LayoutGrid size={20} className="text-indigo-600" />
            <span className="hidden sm:inline">Visualização</span>
            <ChevronDown size={16} className={cn("transition-transform", isViewMenuOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isViewMenuOpen && (
              <>
                <button 
                  className="fixed inset-0 z-40 bg-transparent cursor-default" 
                  onClick={() => setIsViewMenuOpen(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-16 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden py-3"
                >
                  {[
                    { id: 'extra-large', label: 'Ícones extra grandes', icon: Monitor },
                    { id: 'large', label: 'Ícones grandes', icon: LayoutGrid },
                    { id: 'medium', label: 'Ícones médios', icon: LayoutGrid },
                    { id: 'small', label: 'Ícones pequenos', icon: LayoutGrid },
                    { id: 'list', label: 'Lista', icon: List },
                    { id: 'details', label: 'Detalhes', icon: TableProperties },
                    { id: 'tiles', label: 'Blocos', icon: Layout },
                    { id: 'content', label: 'Conteúdo', icon: StretchHorizontal },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => handleViewModeChange(mode.id as ViewMode)}
                      className={cn(
                        "w-full flex items-center gap-3 px-6 py-3 text-sm font-bold transition-all group relative text-left",
                        viewMode === mode.id 
                          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" 
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                    >
                      {viewMode === mode.id && (
                        <motion.div layoutId="viewActive" className="absolute left-0 w-1.5 h-6 bg-indigo-600 rounded-r-full" />
                      )}
                      <mode.icon size={18} className={cn(viewMode === mode.id ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600 transition-colors")} />
                      {mode.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <section className={cn(
        "grid gap-6 transition-all duration-300",
        viewMode === 'extra-large' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
        viewMode === 'large' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        viewMode === 'medium' && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        viewMode === 'small' && "grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9",
        (viewMode === 'list' || viewMode === 'details') && "grid-cols-1",
        viewMode === 'tiles' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3",
        viewMode === 'content' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
      )} aria-label="Lista de produtos">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => {
            const ProductActions = user.nivel === 'gerente' && (
              <div className={cn(
                "flex gap-1 transition-all duration-300",
                (viewMode === 'extra-large' || viewMode === 'large' || viewMode === 'medium' || viewMode === 'small') && "opacity-0 group-hover:opacity-100",
                viewMode === 'small' && "absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] items-center justify-center rounded-2xl z-10",
                (viewMode === 'list' || viewMode === 'details' || viewMode === 'tiles' || viewMode === 'content') && "opacity-100"
              )}>
                <button 
                  onClick={(e) => { e.stopPropagation(); openEdit(product); }}
                  className={cn(
                    "p-2 transition-all active:scale-90 shadow-sm",
                    viewMode === 'small' 
                      ? "bg-white text-indigo-600 rounded-full hover:bg-indigo-50" 
                      : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl"
                  )}
                  aria-label="Editar produto"
                >
                  <Edit3 size={viewMode === 'small' ? 14 : 18} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                  className={cn(
                    "p-2 transition-all active:scale-90 shadow-sm",
                    viewMode === 'small' 
                      ? "bg-white text-red-600 rounded-full hover:bg-red-50" 
                      : "text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                  )}
                  aria-label="Excluir produto"
                >
                  <Trash2 size={viewMode === 'small' ? 14 : 18} />
                </button>
              </div>
            );

            return (
              <motion.article 
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedProduct(product)}
                className={cn(
                  "bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 transition-all cursor-pointer group relative overflow-hidden",
                  
                  // Card shapes
                  (viewMode === 'extra-large' || viewMode === 'large' || viewMode === 'medium') && "rounded-[2.5rem] flex flex-col",
                  viewMode === 'small' && "rounded-2xl aspect-square flex flex-col items-center justify-center p-3 text-center",
                  viewMode === 'list' && "rounded-xl flex items-center p-2 gap-3",
                  viewMode === 'details' && "rounded-lg flex items-center p-3 gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  viewMode === 'tiles' && "rounded-2xl flex items-center p-3 gap-4",
                  viewMode === 'content' && "rounded-3xl flex items-center p-4 gap-4",

                  // Hover effects
                  viewMode !== 'details' && "hover:shadow-xl hover:-translate-y-1"
                )}
              >
                {/* Small View Mode Actions Overlay */}
                {viewMode === 'small' && ProductActions}

                {/* Image Section */}
                <div className={cn(
                  "bg-slate-100 dark:bg-slate-800 shrink-0 relative overflow-hidden transition-all duration-500",
                  viewMode === 'extra-large' && "h-72 w-full",
                  viewMode === 'large' && "h-48 w-full",
                  viewMode === 'medium' && "h-32 w-full",
                  viewMode === 'small' && "w-16 h-16 rounded-xl mb-2",
                  viewMode === 'list' && "w-8 h-8 rounded-md",
                  viewMode === 'details' && "w-10 h-10 rounded-lg",
                  viewMode === 'tiles' && "w-14 h-14 rounded-xl",
                  viewMode === 'content' && "w-20 h-20 rounded-2xl"
                )}>
                  <img 
                    src={product.img || `https://picsum.photos/seed/${product.id}/400/300`} 
                    alt={product.nome} 
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-700",
                      (viewMode === 'extra-large' || viewMode === 'large' || viewMode === 'medium') && "group-hover:scale-110"
                    )}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Status Badges - only for larger cards */}
                  {(viewMode === 'extra-large' || viewMode === 'large') && (
                    <>
                      {product.estoque <= product.estoqueMinimo && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-xl shadow-lg animate-pulse">
                          <AlertTriangle size={16} />
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                        {product.cat}
                      </div>
                    </>
                  )}
                </div>

                {/* Info Section */}
                <div className={cn(
                  "transition-all min-w-0",
                  (viewMode === 'extra-large' || viewMode === 'large' || viewMode === 'medium') && "p-6",
                  viewMode === 'small' && "w-full",
                  (viewMode === 'list' || viewMode === 'details' || viewMode === 'tiles' || viewMode === 'content') && "flex-1"
                )}>
                  {/* Layout: List/Details/Tiles/Content (Horizontal) */}
                  {(viewMode === 'list' || viewMode === 'details' || viewMode === 'tiles' || viewMode === 'content') && (
                    <div className="flex items-center justify-between gap-3 sm:gap-4 h-full">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <h4 className={cn(
                          "font-bold text-slate-800 dark:text-slate-100 truncate leading-tight",
                          viewMode === 'content' ? "text-lg" : "text-sm",
                          viewMode === 'list' && "text-xs"
                        )}>
                          {product.nome}
                        </h4>
                        {(viewMode === 'tiles' || viewMode === 'content') && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{product.cat}</p>
                        )}
                        {viewMode === 'details' && (
                          <div className="flex items-center gap-4 mt-1">
                            <span className="hidden lg:inline text-[10px] font-mono text-slate-400 truncate max-w-[120px]">{product.barcode || 'N/A'}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{product.cat}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-auto">
                        {viewMode === 'details' && (
                          <div className="hidden sm:flex flex-col items-end w-24 sm:w-32 border-l border-slate-100 dark:border-slate-800 pl-3 sm:pl-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Estoque</span>
                            <span className={cn(
                              "text-xs font-black",
                              product.estoque <= product.estoqueMinimo ? "text-red-500" : "text-emerald-500"
                            )}>
                              {product.estoque} <span className="text-slate-400 font-medium">/ {product.estoqueMinimo}</span>
                            </span>
                          </div>
                        )}

                        <div className="text-right">
                          <p className={cn(
                            "font-black text-indigo-600 dark:text-indigo-400",
                            viewMode === 'content' ? "text-xl" : "text-sm"
                          )}>
                            {formatCurrency(product.venda)}
                          </p>
                          {viewMode !== 'details' && (
                            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap truncate max-w-[110px]">
                              {product.estoque} <span className="hidden sm:inline">em estoque</span><span className="sm:hidden">dispon.</span>
                            </p>
                          )}
                        </div>

                        {/* Actions for Horizontal Modes */}
                        <div className={cn(
                          "border-l border-slate-100 dark:border-slate-800 pl-3",
                          viewMode === 'list' && "pl-1"
                        )}>
                          {ProductActions}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Layout: Small (Compact Grid) */}
                  {viewMode === 'small' && (
                    <div className="w-full">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-[10px] truncate w-full" title={product.nome}>
                        {product.nome}
                      </h4>
                      <p className="font-black text-indigo-600 dark:text-indigo-400 text-[10px] mt-0.5">{formatCurrency(product.venda)}</p>
                    </div>
                  )}

                  {/* Layout: Extra Large, Large, Medium (Standard Grid) */}
                  {(viewMode === 'extra-large' || viewMode === 'large' || viewMode === 'medium') && (
                    <>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className={cn(
                          "font-bold text-slate-800 dark:text-slate-100 truncate flex-1",
                          viewMode === 'extra-large' ? "text-2xl" : "text-lg"
                        )} title={product.nome}>
                          {product.nome}
                        </h4>
                        <p className={cn(
                          "font-black text-indigo-600 dark:text-indigo-400 shrink-0",
                          viewMode === 'extra-large' ? "text-2xl" : "text-lg"
                        )}>
                          {formatCurrency(product.venda)}
                        </p>
                      </div>
                      
                      {viewMode !== 'medium' && (
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-4">{product.barcode || 'SEM CÓDIGO'}</p>
                      )}

                      <div className={cn(
                        "flex items-center justify-between border-t border-slate-50 dark:border-slate-800",
                        viewMode === 'extra-large' ? "pt-6" : "pt-4"
                      )}>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Estoque</span>
                          <span className={cn(
                            "font-black",
                            viewMode === 'extra-large' ? "text-xl" : "text-sm",
                            product.estoque <= product.estoqueMinimo ? "text-red-500" : "text-emerald-500"
                          )}>
                            {product.estoque} <small className="text-[10px] text-slate-400 font-medium whitespace-nowrap">/ {product.estoqueMinimo} min</small>
                          </span>
                        </div>
                        
                        {ProductActions}
                      </div>
                    </>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </section>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Preencha as informações do item.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
              <form id="productForm" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome do Produto</label>
                  <input 
                    type="text" 
                    name="nome" 
                    defaultValue={editingProduct?.nome} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Código de Barras</label>
                  <input 
                    type="text" 
                    name="barcode" 
                    defaultValue={editingProduct?.barcode} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Categoria</label>
                  <input 
                    type="text" 
                    name="cat" 
                    defaultValue={editingProduct?.cat} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Preço de Custo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="custo" 
                    defaultValue={editingProduct?.custo} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Preço de Venda (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="venda" 
                    defaultValue={editingProduct?.venda} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estoque Atual</label>
                  <input 
                    type="number" 
                    name="estoque" 
                    defaultValue={editingProduct?.estoque} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estoque Mínimo</label>
                  <input 
                    type="number" 
                    name="estoqueMinimo" 
                    defaultValue={editingProduct?.estoqueMinimo || 5} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">URL da Imagem</label>
                  <input 
                    type="text" 
                    name="img" 
                    defaultValue={editingProduct?.img} 
                    placeholder="https://..." 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Especificações do Item</label>
                  <textarea 
                    name="specs" 
                    defaultValue={editingProduct?.specs} 
                    rows={4}
                    placeholder="Descreva as especificações técnicas, detalhes ou observações do produto..." 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium resize-none dark:text-white" 
                  />
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="productForm" 
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                Salvar Produto
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Product Detail Highlight Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[300] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-slate-200 dark:border-slate-800"
            >
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-slate-800 relative">
                <img 
                  src={selectedProduct.img || `https://picsum.photos/seed/${selectedProduct.id}/800/600`} 
                  alt={selectedProduct.nome} 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-6 left-6 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-2xl transition-all md:hidden"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col bg-white dark:bg-slate-900">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2 block">
                      {selectedProduct.cat}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight">
                      {selectedProduct.nome}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="hidden md:flex p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X size={28} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço de Venda</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedProduct.venda)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estoque</p>
                    <p className={cn(
                      "text-2xl font-black",
                      selectedProduct.estoque <= selectedProduct.estoqueMinimo ? "text-red-500" : "text-emerald-500"
                    )}>
                      {selectedProduct.estoque} <small className="text-xs text-slate-400">un</small>
                    </p>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package size={14} /> Especificações Técnicas
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 min-h-[150px]">
                    {selectedProduct.specs ? (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedProduct.specs}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic font-medium">
                        Nenhuma especificação cadastrada para este item.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">COD: {selectedProduct.barcode || 'N/A'}</p>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="px-10 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Excluir Produto?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Deseja realmente excluir o produto "{products.find(p => p.id === deleteConfirmId)?.nome}"? Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
