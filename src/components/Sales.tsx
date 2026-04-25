/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Sale, Product, User } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useToast } from './ToastContext';
import { 
  Search, 
  Printer, 
  RotateCcw, 
  Calendar, 
  User as UserIcon,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  X,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SalesProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  user: User;
}

export default function Sales({ sales, setSales, products, setProducts, user }: SalesProps) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [saleToRefund, setSaleToRefund] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sales.filter(s => 
      s.seqId.includes(term) || 
      s.cliente.toLowerCase().includes(term) ||
      s.operador.toLowerCase().includes(term) ||
      s.data.includes(term)
    ).reverse();
  }, [searchTerm, sales]);

  const handleRefund = (sale: Sale) => {
    setSaleToRefund(sale);
  };

  const confirmRefund = () => {
    if (!saleToRefund) return;

    const sale = saleToRefund;
    // Restore stock
    setProducts(prev => prev.map(p => {
      const saleItem = sale.itens.find(item => item.id === p.id);
      if (saleItem) {
        return { ...p, estoque: p.estoque + saleItem.qtd };
      }
      return p;
    }));

    // Remove sale
    setSales(prev => prev.filter(s => s.id !== sale.id));
    showToast(`Venda #${sale.seqId} estornada com sucesso!`, 'warning');
    setSaleToRefund(null);
  };

  const handlePrint = (sale: Sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Erro ao abrir janela de impressão. Verifique se o bloqueador de popups está ativo.', 'error');
      return;
    }

    const itemsHtml = sale.itens.map(item => `
      <tr>
        <td style="padding: 5px 0;">${item.nome}</td>
        <td style="text-align: center;">${item.qtd}</td>
        <td style="text-align: right;">${formatCurrency(item.venda * item.qtd)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Cupom de Venda #${sale.seqId}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0 auto; padding: 10px; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 14px; }
            .total-row { font-weight: bold; border-top: 1px solid #000; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin: 0;">DELUX PDV</h2>
            <p style="margin: 5px 0;">Venda #${sale.seqId}</p>
            <p style="margin: 0; font-size: 12px;">Data: ${sale.data}</p>
          </div>
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left;">Item</th>
                <th>Qtd</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="margin-top: 10px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal:</span>
              <span>${formatCurrency(sale.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Desconto:</span>
              <span>-${formatCurrency(sale.desconto)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 5px;">
              <span>TOTAL:</span>
              <span>${formatCurrency(sale.total)}</span>
            </div>
          </div>
          <div style="margin-top: 10px; font-size: 12px;">
            <p style="margin: 2px 0;">Cliente: ${sale.cliente}</p>
            <div style="margin: 5px 0;">
              <p style="margin: 0 0 2px 0; font-weight: bold;">Pagamentos:</p>
              ${sale.pagamentos ? sale.pagamentos.map(p => `
                <div style="display: flex; justify-content: space-between;">
                  <span>${p.metodo} ${p.parcelas ? `${p.parcelas}x` : ''}</span>
                  <span>${formatCurrency(p.valor)}</span>
                </div>
              `).join('') : `<span>${sale.forma}</span>`}
            </div>
            <p style="margin: 2px 0;">Operador: ${sale.operador}</p>
          </div>
          <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>www.deluxpdv.com.br</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast(`Preparando impressão da venda #${sale.seqId}`, 'info');
  };

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Vendas</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Histórico detalhado de todas as transações.</p>
        </div>
        
        <button 
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Download size={20} />
          Exportar Relatório
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Filtrar por ID, cliente, operador ou data..." 
            className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Filtrar vendas"
          />
        </div>
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden" aria-label="Histórico de vendas">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Venda ID / Data</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cliente / Operador</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Pagamento</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredSales.length > 0 ? (
                  filteredSales.map(sale => (
                    <React.Fragment key={sale.id}>
                      <motion.tr 
                        layout
                        className={cn(
                          "border-b border-slate-50 dark:border-slate-800 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30",
                          expandedSale === sale.id && "bg-indigo-50/30 dark:bg-indigo-950/20"
                        )}
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shadow-sm">
                              #{sale.seqId}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sale.dataCurta}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{sale.data.split(' ')[1]}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sale.cliente}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">Op: {sale.operador}</p>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                            {sale.forma}
                          </span>
                        </td>
                        <td className="p-6">
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(sale.total)}</p>
                          {sale.desconto > 0 && (
                            <p className="text-[10px] text-emerald-500 font-bold">-{formatCurrency(sale.desconto)} desc</p>
                          )}
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                            >
                              {expandedSale === sale.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            <button 
                              onClick={() => handlePrint(sale)}
                              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                            >
                              <Printer size={18} />
                            </button>
                            {user.nivel === 'gerente' && (
                              <button 
                                onClick={() => handleRefund(sale)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                              >
                                <RotateCcw size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                      
                      {expandedSale === sale.id && (
                        <tr className="bg-indigo-50/30 dark:bg-indigo-950/10">
                          <td colSpan={5} className="p-0">
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                  <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Itens da Venda</h5>
                                  <div className="space-y-3">
                                    {sale.itens.map((item, i) => (
                                      <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                            {item.qtd}x
                                          </div>
                                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.nome}</p>
                                        </div>
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(item.venda * item.qtd)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="space-y-6">
                                  <div>
                                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Resumo Financeiro</h5>
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(sale.subtotal)}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Desconto</span>
                                        <span className="font-bold text-emerald-500">-{formatCurrency(sale.desconto)}</span>
                                      </div>
                                      <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">Total</span>
                                        <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(sale.total)}</span>
                                      </div>
                                      {user.nivel === 'gerente' && (
                                        <div className="pt-3 flex justify-between text-xs">
                                          <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Lucro Estimado</span>
                                          <span className="font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(sale.lucro)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
 
                                  {sale.pagamentos && sale.pagamentos.length > 0 && (
                                    <div>
                                      <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Detalhamento de Pagamento</h5>
                                      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
                                        {sale.pagamentos.map((p, idx) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-slate-500 dark:text-slate-400">{p.metodo} {p.parcelas ? `${p.parcelas}x` : ''}</span>
                                            <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(p.valor)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-300 dark:text-slate-700">
                      <ShoppingBag size={64} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-xs">Nenhuma venda encontrada</p>
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </section>

      {/* Refund Confirmation Modal */}
      <AnimatePresence>
        {saleToRefund && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <RotateCcw size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Estornar Venda?</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                  Deseja realmente estornar a venda <span className="font-bold text-slate-800 dark:text-slate-100">#{saleToRefund.seqId}</span>?<br/>
                  O estoque dos itens será devolvido e esta transação será removida permanentemente.
                </p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setSaleToRefund(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmRefund}
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                  >
                    Confirmar Estorno
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
