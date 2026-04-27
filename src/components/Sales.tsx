/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Sale, Product, User, SystemConfig } from '../types';
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
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SalesProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  user: User;
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
}

export default function Sales({ sales, setSales, products, setProducts, user, config, setConfig }: SalesProps) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [saleToRefund, setSaleToRefund] = useState<Sale | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedSaleForPreview, setSelectedSaleForPreview] = useState<Sale | null>(null);

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
    setSelectedSaleForPreview(sale);
    setShowReceiptPreview(true);
  };

  const handleDirectPrint = () => {
    const receipt = document.getElementById('thermal-receipt');
    if (!receipt) {
      showToast("Erro: Cupom não encontrado para impressão.", "error");
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Imprimir - ${config.appName}</title>
          ${styles}
          <style>
            @page { margin: 0; size: auto; }
            body { margin: 0; padding: 0; background: white; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            #thermal-receipt { 
              margin: 0 !important; 
              padding: 5mm !important; 
              box-shadow: none !important; 
              border: none !important;
              width: 100% !important;
              max-width: none !important;
              height: auto !important;
              min-height: 0 !important;
              visibility: visible !important;
              display: block !important;
            }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          ${receipt.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 500);
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

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {showReceiptPreview && selectedSaleForPreview && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                   <ShoppingBag className="text-indigo-600" />
                   <h3 className="text-xl font-black text-slate-800 dark:text-white">Reimpressão de Cupom</h3>
                </div>
                <button 
                  onClick={() => setShowReceiptPreview(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white flex flex-col items-center gap-6 custom-scrollbar">
                {/* Quick Settings Bar */}
                <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between no-print mb-2">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                         <Printer size={20} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Impressora</p>
                         <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{config.printerWidth}</p>
                      </div>
                   </div>
                   
                   <div className="flex gap-2">
                      {['58mm', '80mm', 'A4'].map((w) => (
                        <button
                          key={w}
                          onClick={() => setConfig({ ...config, printerWidth: w as any })}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                            config.printerWidth === w
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                          )}
                        >
                          {w}
                        </button>
                      ))}
                   </div>
                </div>

                <div id="thermal-receipt" 
                  className="bg-white text-slate-900 w-full shadow-lg font-mono text-[10px] leading-[1.2] border-t-8 border-slate-900 relative p-4 sm:p-8 no-scrollbar transition-all duration-300"
                  style={{ 
                    maxWidth: config.printerWidth === '58mm' ? '220px' : config.printerWidth === '80mm' ? '320px' : '800px',
                    minHeight: '450px'
                  } as any}
                >
                   <div className="text-center mb-6">
                      <h4 className="text-xl font-black mb-1 uppercase break-words px-2">{config.companyName || config.appName}</h4>
                      {config.appSubtitle && <p className="text-[8px] font-bold uppercase mb-1 opacity-60 tracking-wider font-sans">{config.appSubtitle}</p>}
                      
                      <div className="space-y-0.5 mt-3 border-t border-slate-100 pt-3">
                        {config.address && (
                          <p className="opacity-70 text-[9px] uppercase">{config.address}{config.addressNumber ? `, ${config.addressNumber}` : ''}</p>
                        )}
                        {(config.neighborhood || config.city) && (
                          <p className="opacity-70 text-[9px] uppercase">{config.neighborhood}{config.city ? ` - ${config.city}` : ''}{config.state ? `/${config.state}` : ''}</p>
                        )}
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 mt-1">
                          {config.cnpjCpf && <p className="opacity-70 text-[9px]">CNPJ/CPF: {config.cnpjCpf}</p>}
                          {config.ieRg && <p className="opacity-70 text-[9px]">IE/RG: {config.ieRg}</p>}
                          {config.phone && <p className="opacity-70 text-[9px]">TEL: {config.phone}</p>}
                          {config.email && <p className="opacity-70 text-[9px]">EMAIL: {config.email}</p>}
                        </div>
                      </div>
                   </div>
                   
                   <div className="border-t border-dashed border-slate-300 my-4" />
                   
                   <div className="space-y-1 mb-4 uppercase text-[9px]">
                      <div className="flex justify-between">
                         <span className="font-bold">PEDIDO:</span>
                         <span className="font-bold">#{selectedSaleForPreview.seqId}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="font-bold">DATA:</span>
                         <span>{selectedSaleForPreview.data}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="font-bold shrink-0">CLIENTE:</span>
                         <span className="truncate ml-2">{selectedSaleForPreview.cliente}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="font-bold">VENDEDOR:</span>
                         <span className="truncate ml-2">{selectedSaleForPreview.operador}</span>
                      </div>
                   </div>

                   <div className="border-t border-dashed border-slate-300 my-4" />
                   
                   <table className="w-full text-[9px] mb-4">
                      <thead>
                         <tr className="border-b border-slate-900">
                            <th className="text-left py-1 font-black w-8">QTD</th>
                            <th className="text-left py-1 font-black px-2">ITEM</th>
                            <th className="text-right py-1 font-black w-20">TOTAL</th>
                         </tr>
                      </thead>
                      <tbody>
                         {selectedSaleForPreview.itens.map((item, i) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0">
                               <td className="py-2 align-top">{item.qtd}x</td>
                               <td className="py-2 px-2 align-top break-words max-w-[100px] uppercase font-medium">{item.nome}</td>
                               <td className="py-2 text-right align-top whitespace-nowrap">{formatCurrency(item.venda * item.qtd)}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>

                   <div className="space-y-1.5 text-[11px] mt-2">
                      <div className="flex justify-between">
                         <span>SUBTOTAL:</span>
                         <span>{formatCurrency(selectedSaleForPreview.subtotal)}</span>
                      </div>
                      {selectedSaleForPreview.desconto > 0 && (
                         <div className="flex justify-between font-bold">
                            <span>DESCONTO:</span>
                            <span>-{formatCurrency(selectedSaleForPreview.desconto)}</span>
                         </div>
                      )}
                      <div className="flex justify-between text-lg font-black border-t-2 border-slate-900 pt-2 mt-2">
                         <span>TOTAL:</span>
                         <span>{formatCurrency(selectedSaleForPreview.total)}</span>
                      </div>
                   </div>

                   <div className="border-t border-dashed border-slate-300 my-4" />
                   
                   <div className="space-y-1 mb-6 text-[9px]">
                      <p className="font-black mb-2 flex items-center gap-1 uppercase border-b border-slate-100 pb-1">
                        Pagamento
                      </p>
                      {selectedSaleForPreview.pagamentos ? selectedSaleForPreview.pagamentos.map((p, i) => (
                        <div key={i} className="flex justify-between uppercase">
                           <span>{p.metodo} {p.parcelas ? `(${p.parcelas}X)` : ''}</span>
                           <span>{formatCurrency(p.valor)}</span>
                        </div>
                      )) : (
                        <div className="flex justify-between uppercase">
                           <span>{selectedSaleForPreview.forma}</span>
                           <span>{formatCurrency(selectedSaleForPreview.total)}</span>
                        </div>
                      )}
                   </div>

                   <div className="text-center mt-10 space-y-4">
                      <div className="flex flex-col items-center gap-1">
                        <p className="font-black italic text-xs">Obrigado pela preferência!</p>
                        <p className="text-[8px] uppercase tracking-widest opacity-60">Sempre com você</p>
                      </div>
                      <div className="flex justify-center opacity-70 p-3 bg-slate-50 rounded-2xl mx-auto w-fit">
                         <QrCode size={48} strokeWidth={1} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[7px] opacity-40 uppercase tracking-widest leading-normal mb-1">
                          Consulte sua nota física ou no site oficial
                        </p>
                        <p className="text-[7px] opacity-20 font-black tracking-tighter uppercase">
                          SISTEMA {config.appName.toUpperCase()} v{config.version} - LICENCIADO
                        </p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row gap-3 shrink-0">
                <button 
                  onClick={() => setShowReceiptPreview(false)}
                  className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleDirectPrint}
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
