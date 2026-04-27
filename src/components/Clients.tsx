/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client, Sale, User } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  History, 
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  X,
  ShoppingBag,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  sales: Sale[];
  user: User;
}

export default function Clients({ clients, setClients, sales, user }: ClientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.nome.toLowerCase().includes(term) || 
      c.fone.includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  }, [searchTerm, clients]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const clientData: Client = {
      id: editingClient ? editingClient.id : Date.now(),
      nome: formData.get('nome') as string,
      fone: formData.get('fone') as string,
      email: formData.get('email') as string || undefined,
      rua: formData.get('rua') as string || undefined,
      numero: formData.get('numero') as string || undefined,
      bairro: formData.get('bairro') as string || undefined,
      cidade: formData.get('cidade') as string || undefined,
      estado: formData.get('estado') as string || undefined,
      obs: formData.get('obs') as string || undefined,
    };

    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? clientData : c));
    } else {
      setClients(prev => [...prev, clientData]);
    }

    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleDelete = (id: number) => {
    const hasSales = sales.some(s => Number(s.clienteId) === Number(id));
    if (hasSales) {
      setErrorMessage("Não é possível excluir este cliente pois ele possui vendas vinculadas.");
      return;
    }

    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setClients(prev => prev.filter(c => c.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const clientHistory = useMemo(() => {
    if (!historyClient) return [];
    return sales.filter(s => Number(s.clienteId) === Number(historyClient.id)).reverse();
  }, [historyClient, sales]);

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Clientes</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie sua base de clientes e histórico de compras.</p>
        </div>
        
        <button 
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Filtrar por nome, telefone ou email..." 
            className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Filtrar clientes"
          />
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Lista de clientes">
        <AnimatePresence mode="popLayout">
          {filteredClients.map(client => (
            <motion.article 
              key={client.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold text-xl border border-indigo-100 dark:border-indigo-900/30">
                  {client.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setHistoryClient(client)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                    title="Histórico"
                    aria-label="Ver histórico do cliente"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    onClick={() => { setEditingClient(client); setIsModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                    title="Editar"
                    aria-label="Editar cliente"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(client.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                    title="Excluir"
                    aria-label="Excluir cliente"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{client.nome}</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                    <Phone size={14} className="text-slate-400" />
                    <span className="font-medium">{client.fone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                      <Mail size={14} className="text-slate-400" />
                      <span className="font-medium truncate">{client.email}</span>
                    </div>
                  )}
                  {(client.rua || client.cidade) && (
                    <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-sm">
                      <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                      <span className="font-medium line-clamp-2">
                        {client.rua}{client.numero ? `, ${client.numero}` : ''}
                        {client.bairro ? ` - ${client.bairro}` : ''}
                        {(client.rua || client.bairro) && client.cidade ? ' | ' : ''}
                        {client.cidade}{client.estado ? `/${client.estado}` : ''}
                      </span>
                    </div>
                  )}
                  {client.obs && (
                    <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-sm italic">
                      <FileText size={14} className="text-slate-400 mt-1 shrink-0" />
                      <span className="line-clamp-2">{client.obs}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Compras</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                    {sales.filter(s => Number(s.clienteId) === Number(client.id)).length} pedidos
                  </span>
                </div>
                <button 
                  onClick={() => setHistoryClient(client)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
                >
                  Ver Detalhes
                </button>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </section>

      {/* Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Informações de contato do cliente.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar max-h-[60vh]">
              <form id="clientForm" onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome Completo</label>
                  <input 
                    type="text" 
                    name="nome" 
                    defaultValue={editingClient?.nome} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    name="fone" 
                    defaultValue={editingClient?.fone} 
                    required 
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email</label>
                   <input 
                    type="email" 
                    name="email" 
                    defaultValue={editingClient?.email} 
                    placeholder="email@exemplo.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Rua</label>
                    <input 
                      type="text" 
                      name="rua" 
                      defaultValue={editingClient?.rua} 
                      placeholder="Nome da rua"
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nº</label>
                    <input 
                      type="text" 
                      name="numero" 
                      defaultValue={editingClient?.numero} 
                      placeholder="00"
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Bairro</label>
                  <input 
                    type="text" 
                    name="bairro" 
                    defaultValue={editingClient?.bairro} 
                    placeholder="Nome do bairro"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cidade</label>
                    <input 
                      type="text" 
                      name="cidade" 
                      defaultValue={editingClient?.cidade} 
                      placeholder="Cidade"
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estado</label>
                    <input 
                      type="text" 
                      name="estado" 
                      defaultValue={editingClient?.estado} 
                      placeholder="UF"
                      maxLength={2}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white text-center uppercase" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Observações</label>
                  <textarea 
                    name="obs" 
                    defaultValue={editingClient?.obs} 
                    placeholder="Notas adicionais sobre o cliente..."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white resize-none" 
                  />
                </div>
              </form>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="clientForm" 
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* History Modal */}
      {historyClient && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold border border-indigo-200 dark:border-indigo-800/50">
                  {historyClient.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">{historyClient.nome}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Histórico de Compras</p>
                </div>
              </div>
              <button 
                onClick={() => setHistoryClient(null)}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-white dark:bg-slate-900">
              {clientHistory.length > 0 ? (
                clientHistory.map(sale => (
                  <div key={sale.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:bg-white dark:hover:bg-slate-900 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Venda #{sale.seqId}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{sale.data}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{formatCurrency(sale.total)}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{sale.forma}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {sale.itens.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                              {item.qtd}x
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.nome}</p>
                              <p className="text-[10px] text-slate-400">{formatCurrency(item.venda)} / un</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(item.venda * item.qtd)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 py-20">
                  <ShoppingBag size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">Nenhuma compra registrada</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => setHistoryClient(null)} 
                className="px-10 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Excluir Cliente?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Deseja realmente excluir o cliente "{clients.find(c => c.id === deleteConfirmId)?.nome}"? Esta ação não pode ser desfeita.
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

      {/* Error Message Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ação Não Permitida</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{errorMessage}</p>
              
              <button 
                onClick={() => setErrorMessage(null)}
                className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
