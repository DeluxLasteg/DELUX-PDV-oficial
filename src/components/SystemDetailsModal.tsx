/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Gem, Server, Database, ShieldCheck, Clock, HardDrive } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { User, SystemConfig } from '../types';

interface SystemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  totalSales: number;
  totalProducts: number;
  config: SystemConfig;
}

export default function SystemDetailsModal({ isOpen, onClose, user, totalSales, totalProducts, config }: SystemDetailsModalProps) {
  const systemInfo = [
    { label: 'Nome do Sistema', value: config.appName, icon: Gem },
    { label: 'Versão', value: config.version, icon: Info },
    { label: 'Ambiente', value: 'Produção (Cloud)', icon: Server },
    { label: 'Banco de Dados', value: 'Firestore (Ativo)', icon: Database },
    { label: 'Licença', value: 'Enterprise Delux', icon: ShieldCheck },
    { label: 'Última Atualização', value: new Date().toLocaleDateString('pt-BR'), icon: Clock },
  ];

  const stats = [
    { label: 'Total de Vendas', value: totalSales, icon: HardDrive },
    { label: 'Produtos Cadastrados', value: totalProducts, icon: Gem },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Info size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white">Detalhes do Sistema</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Informações técnicas e estatísticas.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar max-h-[60vh] bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemInfo.map((info, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                      <info.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{info.label}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{info.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Estatísticas Atuais</h4>
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                      <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                      <stat.icon className="mb-4 opacity-50" size={24} />
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{stat.label}</p>
                      <p className="text-3xl font-black">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl p-6 text-white border border-slate-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center font-black text-xl">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{user.nome}</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{user.nivel}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Sessão iniciada em:</span>
                  <span className="font-mono text-indigo-400">{new Date().toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={onClose}
                className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-900/20 border border-slate-800"
              >
                Fechar Detalhes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
