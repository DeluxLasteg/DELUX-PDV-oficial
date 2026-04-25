/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Client, Sale, SaleItem, User, Payment } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useToast } from './ToastContext';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle, 
  User as UserIcon,
  CreditCard,
  Banknote,
  QrCode,
  Camera,
  X,
  XCircle,
  List,
  Printer,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PDVProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  clients: Client[];
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  user: User;
  users: User[];
}

export default function PDV({ products, setProducts, clients, sales, setSales, user, users }: PDVProps) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>(() => {
    const saved = localStorage.getItem(`dlx_cart_${user.login}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedClient, setSelectedClient] = useState<string | number>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('Dinheiro');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | ''>('');
  const [currentInstallments, setCurrentInstallments] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [lastSaleChange, setLastSaleChange] = useState(0);
  const [lastSaleSeqId, setLastSaleSeqId] = useState('');
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [authPass, setAuthPass] = useState('');
  const [isDiscountAuthorized, setIsDiscountAuthorized] = useState(user.nivel === 'gerente');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(`dlx_cart_${user.login}`, JSON.stringify(cart));
  }, [cart, user.login]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.nome.toLowerCase().includes(term) || 
      p.barcode.includes(term) ||
      p.cat.toLowerCase().includes(term)
    );
  }, [searchTerm, products]);

  const subtotal = useMemo(() => {
    const sum = cart.reduce((acc, item) => acc + (item.venda * item.qtd), 0);
    return Math.round(sum * 100) / 100;
  }, [cart]);

  const total = useMemo(() => {
    const val = Math.max(0, subtotal - discount);
    return Math.round(val * 100) / 100;
  }, [subtotal, discount]);

  const totalPaid = useMemo(() => {
    const sum = payments.reduce((acc, p) => acc + p.valor, 0);
    return Math.round(sum * 100) / 100;
  }, [payments]);

  const remainingAmount = useMemo(() => {
    const val = Math.max(0, total - totalPaid);
    return Math.round(val * 100) / 100;
  }, [total, totalPaid]);

  const addPayment = () => {
    const amount = Number(currentPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Insira um valor válido para o pagamento", "error");
      return;
    }

    const newPayment: Payment = {
      metodo: currentPaymentMethod,
      valor: Math.round(amount * 100) / 100,
      parcelas: currentPaymentMethod === 'Crédito' ? currentInstallments : undefined
    };

    setPayments([...payments, newPayment]);
    setCurrentPaymentAmount('');
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const addToCart = (product: Product) => {
    if (product.estoque <= 0) {
      showToast("Produto sem estoque!", "error");
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      if (existing.qtd < product.estoque) {
        setCart(prev => prev.map(item => 
          item.id === product.id ? { ...item, qtd: item.qtd + 1 } : item
        ));
        showToast(`+1 ${product.nome} adicionado`, "info");
      } else {
        showToast("Limite de estoque atingido!", "warning");
      }
    } else {
      setCart(prev => [...prev, { ...product, qtd: 1 }]);
      showToast(`${product.nome} adicionado ao carrinho`, "success");
    }

    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateQtd = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQtd = item.qtd + delta;
        const original = products.find(p => p.id === id);
        if (newQtd > 0 && original && newQtd <= original.estoque) {
          return { ...item, qtd: newQtd };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleDiscountChange = (val: number) => {
    const safeVal = Math.max(0, Math.min(val, subtotal));
    if (safeVal > 0 && user.nivel === 'funcionario' && !isDiscountAuthorized) {
      setShowAuthModal(true);
    } else {
      setDiscount(Math.round(safeVal * 100) / 100);
    }
  };

  const confirmAuth = () => {
    // Validate against real managers in the system
    const isAuthorized = users.some(u => u.nivel === 'gerente' && u.senha === authPass);
    
    if (isAuthorized) {
      setIsDiscountAuthorized(true);
      setShowAuthModal(false);
      setAuthPass('');
      showToast("Desconto autorizado com sucesso!", "success");
    } else {
      showToast("Senha de gerente inválida!", "error");
      setAuthPass('');
    }
  };

  const finalizeSale = () => {
    if (cart.length === 0) return;
    
    if (totalPaid < total) {
      showToast(`Valor incompleto! Faltam ${formatCurrency(total - totalPaid)}`, "error");
      return;
    }

    const seqId = (sales.length + 1).toString().padStart(2, '0');
    const now = new Date();
    
    // Create summary string for 'forma'
    const paymentSummary = payments.map(p => 
      p.metodo === 'Crédito' ? `${p.metodo} ${p.parcelas}x` : p.metodo
    ).filter((v, i, a) => a.indexOf(v) === i).join(' + ');

    const sale: Sale = {
      seqId,
      id: Date.now(),
      data: now.toLocaleString('pt-BR'),
      dataCurta: now.toLocaleDateString('pt-BR'),
      clienteId: selectedClient,
      cliente: selectedClient ? (clients.find(c => c.id === Number(selectedClient))?.nome || "Consumidor") : "Consumidor Final",
      forma: paymentSummary,
      pagamentos: payments,
      subtotal,
      desconto: discount,
      total,
      lucro: Math.round((total - cart.reduce((acc, item) => acc + (item.custo * item.qtd), 0)) * 100) / 100,
      itens: JSON.parse(JSON.stringify(cart)),
      operador: user.nome
    };

    // Update inventory
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        return { ...p, estoque: p.estoque - cartItem.qtd };
      }
      return p;
    }));

    setSales(prev => [...prev, sale]);
    showToast(`Venda #${seqId} finalizada!`, "success");
    
    const change = Math.round(Math.max(0, totalPaid - total) * 100) / 100;
    setLastSaleChange(change);
    setLastSaleSeqId(seqId);
    setLastCompletedSale(sale);
    setShowSuccessModal(true);

    setCart([]);
    setDiscount(0);
    setPayments([]);
    setCurrentPaymentAmount('');
    setSelectedClient('');
    setIsDiscountAuthorized(user.nivel === 'gerente');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
      {/* Left Column: Search and Cart */}
      <section className="flex-1 flex flex-col gap-6 min-w-0" aria-label="Carrinho de compras">
        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
          <div className="flex gap-4">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Escaneie o código ou digite o nome do produto..." 
                className="w-full bg-slate-50 dark:bg-slate-950 border-none p-5 pl-14 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar produto"
              />
              
              <AnimatePresence>
                {searchTerm && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-[100] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl mt-2 max-h-[60vh] overflow-y-auto custom-scrollbar"
                  >
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                              <img src={p.img || 'https://picsum.photos/seed/product/100/100'} alt={p.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{p.nome}</p>
                              <p className={cn(
                                "text-xs font-bold",
                                p.estoque <= p.estoqueMinimo ? "text-red-500" : "text-slate-400 dark:text-slate-500"
                              )}>
                                Estoque: {p.estoque} un
                              </p>
                            </div>
                          </div>
                          <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(p.venda)}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <p className="font-medium">Nenhum produto encontrado</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowProductList(true)}
              className="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 p-5 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-950/40 transition-all flex items-center gap-2 font-bold shadow-sm border border-indigo-100 dark:border-indigo-900/30"
              title="Ver todos os produtos"
            >
              <List size={24} />
              <span className="hidden sm:inline">Produtos</span>
            </button>
          </div>
        </div>

        {/* Cart List */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-colors">
          <header className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
              Itens no Carrinho ({cart.length})
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCart([])}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} />
                Limpar
              </button>
              <button className="lg:hidden bg-indigo-600 text-white p-2 rounded-xl">
                <Camera size={20} />
              </button>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <AnimatePresence initial={false}>
              {cart.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 py-20"
                >
                  <ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">Carrinho Vazio</p>
                </motion.div>
              ) : (
                cart.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex gap-4 items-center hover:shadow-md transition-all group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                      <img src={item.img || 'https://picsum.photos/seed/product/100/100'} alt={item.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.nome}</h4>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{formatCurrency(item.venda)} / un</p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                      <button 
                        onClick={() => updateQtd(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:text-red-500 transition-colors dark:text-slate-300"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-black text-slate-700 dark:text-slate-200">{item.qtd}</span>
                      <button 
                        onClick={() => updateQtd(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:text-indigo-600 transition-colors dark:text-slate-300"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">Subtotal</p>
                      <p className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(item.venda * item.qtd)}</p>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                      aria-label="Remover item"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Right Column: Checkout */}
      <aside className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0 h-full overflow-y-auto pr-2 custom-scrollbar pb-8" aria-label="Finalização de venda">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
          <div>
            <label htmlFor="client-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                id="client-select"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none text-sm dark:text-white"
              >
                <option value="">Consumidor Final</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Formas de Pagamento</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { id: 'Dinheiro', icon: Banknote, label: 'Dinheiro' },
                  { id: 'Pix', icon: QrCode, label: 'Pix' },
                  { id: 'Débito', icon: CreditCard, label: 'Débito' },
                  { id: 'Crédito', icon: CreditCard, label: 'Crédito' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setCurrentPaymentMethod(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1",
                      currentPaymentMethod === method.id 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                        : "bg-slate-50 dark:bg-slate-950 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <method.icon size={16} />
                    <span className="text-[8px] font-bold uppercase">{method.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                    <input 
                      type="number" 
                      value={currentPaymentAmount}
                      onChange={(e) => setCurrentPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={remainingAmount.toFixed(2)}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm dark:text-white"
                      aria-label="Valor do pagamento"
                    />
                  </div>
                </div>
                {currentPaymentMethod === 'Crédito' && (
                  <select 
                    value={currentInstallments}
                    onChange={(e) => setCurrentInstallments(Number(e.target.value))}
                    className="w-20 p-2.5 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-xs dark:text-white"
                    aria-label="Parcelas"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}x</option>
                    ))}
                  </select>
                )}
                <button 
                  onClick={addPayment}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                  aria-label="Adicionar pagamento"
                >
                  <Plus size={20} />
                </button>
              </div>

              {payments.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1 mb-3">
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                          {p.metodo === 'Dinheiro' && <Banknote size={16} />}
                          {p.metodo === 'Pix' && <QrCode size={16} />}
                          {(p.metodo === 'Débito' || p.metodo === 'Crédito') && <CreditCard size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {p.metodo} {p.parcelas ? `${p.parcelas}x` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(p.valor)}</span>
                        <button 
                          onClick={() => removePayment(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          aria-label="Remover pagamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400 dark:text-slate-500">Total Pago</span>
                <span className="text-emerald-600 dark:text-emerald-500">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400 dark:text-slate-500">Restante</span>
                <span className={cn(remainingAmount > 0 ? "text-red-500" : "text-slate-400 dark:text-slate-600")}>
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
              {totalPaid > total && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-emerald-600 dark:text-emerald-500">Troco</span>
                  <span className="text-emerald-700 dark:text-emerald-300 text-lg">{formatCurrency(totalPaid - total)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 dark:bg-slate-900 border-none dark:border dark:border-slate-800 text-white p-6 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden shrink-0 transition-colors">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3 mb-6 relative z-10">
            <div className="flex justify-between text-indigo-100 dark:text-slate-400 text-xs font-medium">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-100 dark:text-slate-400 text-xs font-medium">
              <label htmlFor="discount-input">Desconto</label>
              <div className="flex items-center bg-white/10 dark:bg-slate-800 rounded-xl px-3 py-1 border border-white/20 dark:border-slate-700">
                <span className="text-[10px] mr-2">R$</span>
                <input 
                  id="discount-input"
                  type="number" 
                  value={discount}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  className="w-16 bg-transparent border-none p-0 text-right text-white font-bold focus:ring-0 outline-none text-xs" 
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/20 dark:border-slate-800">
              <p className="text-[10px] font-bold text-white/70 dark:text-indigo-400 uppercase mb-1 tracking-widest">Total a Pagar</p>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tighter flex items-baseline gap-1">
                <span className="text-xl font-bold text-white/40 dark:text-slate-500">R$</span>
                {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <button 
            onClick={finalizeSale}
            disabled={cart.length === 0 || totalPaid < total}
            className={cn(
              "group relative w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden",
              cart.length > 0 && totalPaid >= total
                ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white" 
                : "bg-indigo-700/50 dark:bg-slate-800 text-indigo-300 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            <span className="relative z-10">FECHAR PEDIDO</span>
            <CheckCircle className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
          </button>
          <p className="text-center text-indigo-200/50 dark:text-slate-500 text-[9px] mt-3 font-bold tracking-widest uppercase">Atalho: Tecla F2</p>
        </div>
      </aside>

      {/* Auth Modal for Discounts */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ação Restrita</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Insira a senha de um Gerente para aplicar desconto.</p>
              
              <input 
                type="password" 
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border-none p-5 rounded-2xl text-center text-3xl tracking-[0.5em] mb-6 focus:ring-4 focus:ring-orange-500/10 outline-none dark:text-white"
                autoFocus
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAuth}
                  className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-colors"
                >
                  Autorizar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Modal with Change and Receipt Option */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8 text-center bg-white dark:bg-slate-900">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Venda Finalizada!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Venda #{lastSaleSeqId} concluída com sucesso.</p>
              
              {lastSaleChange > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Banknote size={48} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Troco do Cliente</p>
                  <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tighter">
                    {formatCurrency(lastSaleChange)}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowReceiptPreview(true)}
                  className="w-full py-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-900/30"
                >
                  <Receipt size={20} />
                  EMITIR CUPOM
                </button>
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    setLastCompletedSale(null);
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  NOVA VENDA
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Product List Modal */}
      <AnimatePresence>
        {showProductList && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <List size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Lista de Produtos</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Selecione um item para adicionar ao carrinho.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProductList(false)}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {
                        addToCart(p);
                        setShowProductList(false);
                      }}
                      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-4 flex flex-col gap-4 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group text-left relative overflow-hidden"
                    >
                      <div className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
                        <img src={p.img || 'https://picsum.photos/seed/product/200/200'} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            p.estoque <= p.estoqueMinimo ? "text-red-500" : "text-emerald-500 dark:text-emerald-400"
                          )}>
                            {p.estoque} em estoque
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{p.cat}</p>
                        <h4 className="font-black text-slate-800 dark:text-slate-100 leading-tight mb-2 line-clamp-2">{p.nome}</h4>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(p.venda)}</span>
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Plus size={18} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                <button 
                  onClick={() => setShowProductList(false)}
                  className="px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-900/20 border border-slate-800"
                >
                  Fechar Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {showReceiptPreview && lastCompletedSale && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="flex items-center gap-3">
                   <Receipt className="text-indigo-600" />
                   <h3 className="text-xl font-black text-slate-800 dark:text-white">Cupom de Venda</h3>
                </div>
                <button 
                  onClick={() => setShowReceiptPreview(false)}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-slate-950 flex justify-center">
                  {/* The actual "Paper" - Print Friendly Design */}
                  <div id="thermal-receipt" className="bg-white text-slate-900 w-full max-w-[320px] p-8 shadow-lg font-mono text-[10px] leading-tight border-t-8 border-indigo-600 relative">
                     <div className="text-center mb-6">
                        <h4 className="text-xl font-black mb-1">DELUX PDV</h4>
                        <p className="opacity-70">Avenida das Oliveiras, 1234</p>
                        <p className="opacity-70">CNPJ: 00.000.000/0001-00</p>
                        <p className="opacity-70">Telefone: (11) 99999-9999</p>
                     </div>
                     
                     <div className="border-t border-dashed border-slate-300 my-4" />
                     
                     <div className="flex justify-between mb-1">
                        <span>PEDIDO: #{lastCompletedSale.seqId}</span>
                        <span>OP: {lastCompletedSale.operador}</span>
                     </div>
                     <div className="mb-2">
                        DATA: {lastCompletedSale.data}
                     </div>
                     <div className="mb-4 font-bold uppercase truncate">
                        CLIENTE: {lastCompletedSale.cliente}
                     </div>

                     <div className="border-t border-dashed border-slate-300 my-4" />
                     
                     <div className="space-y-3 mb-6">
                        <div className="flex justify-between font-bold border-b border-slate-100 pb-1">
                           <span className="w-12">QTD</span>
                           <span className="flex-1 px-2">ITEM</span>
                           <span className="w-20 text-right">TOTAL</span>
                        </div>
                        {lastCompletedSale.itens.map((item, i) => (
                           <div key={i} className="flex justify-between gap-1">
                              <span className="w-12">{item.qtd}x</span>
                              <span className="flex-1 px-2 truncate uppercase">{item.nome}</span>
                              <span className="w-20 text-right">{formatCurrency(item.venda * item.qtd)}</span>
                           </div>
                        ))}
                     </div>

                     <div className="border-t border-dashed border-slate-300 my-4" />
                     
                     <div className="space-y-1 text-right">
                        <div className="flex justify-between">
                           <span>SUBTOTAL:</span>
                           <span>{formatCurrency(lastCompletedSale.subtotal)}</span>
                        </div>
                        {lastCompletedSale.desconto > 0 && (
                           <div className="flex justify-between text-slate-600">
                              <span>DESCONTO:</span>
                              <span>-{formatCurrency(lastCompletedSale.desconto)}</span>
                           </div>
                        )}
                        <div className="flex justify-between text-base font-black pt-2">
                           <span>TOTAL:</span>
                           <span>{formatCurrency(lastCompletedSale.total)}</span>
                        </div>
                     </div>

                     <div className="border-t border-dashed border-slate-300 my-4" />
                     
                     <div className="space-y-1 mb-6">
                        <p className="font-bold">PAGAMENTO:</p>
                        {lastCompletedSale.pagamentos.map((p, i) => (
                          <div key={i} className="flex justify-between text-[9px]">
                             <span className="uppercase">{p.metodo} {p.parcelas ? `(${p.parcelas}X)` : ''}</span>
                             <span>{formatCurrency(p.valor)}</span>
                          </div>
                        ))}
                     </div>

                     <div className="text-center mt-10 space-y-4">
                        <div className="flex flex-col items-center gap-1">
                          <p className="font-bold italic">Obrigado pela preferência!</p>
                          <p className="text-[8px] uppercase">www.deluxpdv.com.br</p>
                        </div>
                        <div className="flex justify-center opacity-70">
                           <QrCode size={48} strokeWidth={1} />
                        </div>
                        <p className="text-[7px] opacity-50 uppercase tracking-widest">Consulte sua nota física ou no site oficial</p>
                     </div>
                  </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 shrink-0">
                <button 
                  onClick={() => setShowReceiptPreview(false)}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => {
                    window.print();
                    showToast("Comando de impressão enviado!", "info");
                  }}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  IMPRIMIR CUPOM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
