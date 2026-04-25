/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  User as UserIcon,
  X,
  Lock,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface UsersProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
}

export default function Users({ users, setUsers, currentUser }: UsersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData: User = {
      id: editingUser ? editingUser.id : Date.now(),
      nome: formData.get('nome') as string,
      login: formData.get('login') as string,
      senha: formData.get('senha') as string,
      nivel: formData.get('nivel') as UserRole,
    };

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? userData : u));
    } else {
      setUsers(prev => [...prev, userData]);
    }

    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = (id: number) => {
    if (id === currentUser.id) {
      setErrorMessage("Você não pode excluir seu próprio usuário.");
      return;
    }

    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.login === 'admin') {
      setErrorMessage("O usuário administrador padrão não pode ser excluído.");
      return;
    }

    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setUsers(prev => prev.filter(u => u.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Equipe</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie os usuários e permissões do sistema.</p>
        </div>
        
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Lista de usuários">
        <AnimatePresence mode="popLayout">
          {users.map(user => (
            <motion.article 
              key={user.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border",
                  user.nivel === 'gerente' 
                    ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" 
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700"
                )}>
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                    title="Editar"
                    aria-label="Editar usuário"
                  >
                    <Edit3 size={18} />
                  </button>
                  {user.id !== currentUser.id && user.login !== 'admin' && (
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                      title="Excluir"
                      aria-label="Excluir usuário"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{user.nome}</h4>
                  {user.id === currentUser.id && (
                    <span className="bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest">Você</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <UserIcon size={14} className="text-slate-400" />
                  <span className="font-medium">Login: {user.login}</span>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  user.nivel === 'gerente' 
                    ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                )}>
                  {user.nivel === 'gerente' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                  {user.nivel}
                </div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </section>

      {/* User Modal */}
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
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Defina as credenciais e permissões.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 bg-white dark:bg-slate-900">
              <form id="userForm" onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nome de Exibição</label>
                  <input 
                    type="text" 
                    name="nome" 
                    defaultValue={editingUser?.nome} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Login de Acesso</label>
                  <input 
                    type="text" 
                    name="login" 
                    defaultValue={editingUser?.login} 
                    required 
                    disabled={editingUser?.login === 'admin'}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium disabled:opacity-50 dark:text-white" 
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      name="senha" 
                      defaultValue={editingUser?.senha} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 pl-12 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium dark:text-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nível de Acesso</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'funcionario', label: 'Funcionário', icon: Shield, desc: 'Acesso ao PDV' },
                      { id: 'gerente', label: 'Gerente', icon: ShieldCheck, desc: 'Acesso Total' },
                    ].map((role) => (
                      <label 
                        key={role.id}
                        className={cn(
                          "relative flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all",
                          (editingUser?.nivel === role.id || (!editingUser && role.id === 'funcionario'))
                            ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-600"
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                        )}
                      >
                        <input 
                          type="radio" 
                          name="nivel" 
                          value={role.id} 
                          defaultChecked={editingUser?.nivel === role.id || (!editingUser && role.id === 'funcionario')}
                          className="sr-only"
                        />
                        <role.icon className={cn(
                          "mb-2",
                          (editingUser?.nivel === role.id || (!editingUser && role.id === 'funcionario'))
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-slate-400"
                        )} size={20} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{role.label}</span>
                        <span className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">{role.desc}</span>
                      </label>
                    ))}
                  </div>
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
                form="userForm" 
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                Salvar
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
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Excluir Usuário?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Deseja realmente excluir o usuário "{users.find(u => u.id === deleteConfirmId)?.nome}"? Esta ação não pode ser desfeita.
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
                <ShieldAlert size={32} />
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
