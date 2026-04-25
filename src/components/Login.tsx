/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { useToast } from './ToastContext';
import { Gem, Lock, User as UserIcon, ArrowRight, AlertCircle, X, ShieldCheck, Key, Eye, EyeOff, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export default function Login({ onLogin, users, setUsers }: LoginProps) {
  const { showToast } = useToast();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'login' | 'verify' | 'reset'>('login');
  const [recoveryUser, setRecoveryUser] = useState<User | null>(null);
  const [masterKey, setMasterKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const config = JSON.parse(localStorage.getItem('dlx_config') || '{"appName": "DELUX PDV", "appSubtitle": "Sistema de Gestão de Vendas", "masterKey": "DELUX-2026"}');

  useEffect(() => {
    const saved = localStorage.getItem('dlx_remember');
    if (saved) {
      const { login: savedLogin, password: savedPassword } = JSON.parse(saved);
      setLogin(savedLogin);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rememberMe) {
      localStorage.setItem('dlx_remember', JSON.stringify({ login, password }));
    } else {
      localStorage.removeItem('dlx_remember');
    }

    // First access logic: if no users exist, create a default admin
    if (users.length === 0) {
      const defaultAdmin: User = {
        id: 1,
        nome: "Administrador",
        login: login || "admin",
        senha: password || "admin",
        nivel: "gerente"
      };
      setUsers([defaultAdmin]);
      onLogin(defaultAdmin);
      return;
    }

    const user = users.find(u => u.login === login && u.senha === password);
    if (user) {
      onLogin(user);
      showToast(`Bem-vindo, ${user.nome}!`, 'info');
    } else {
      setError('Usuário ou senha incorretos.');
      showToast('Falha no login. Verifique suas credenciais.', 'error');
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (recoveryStep === 'login') {
      const found = users.find(u => u.login.toLowerCase() === login.toLowerCase());
      if (found) {
        setRecoveryUser(found);
        setRecoveryStep('verify');
      } else {
        setRecoveryError('Usuário não encontrado.');
      }
    } else if (recoveryStep === 'verify') {
      if (masterKey === config.masterKey) {
        setRecoveryStep('reset');
      } else {
        setRecoveryError('Chave Mestra incorreta.');
      }
    } else if (recoveryStep === 'reset') {
      if (newPassword.length < 4) {
        setRecoveryError('A senha deve ter pelo menos 4 caracteres.');
        return;
      }
      
      const updatedUsers = users.map(u => 
        u.id === recoveryUser?.id ? { ...u, senha: newPassword } : u
      );
      setUsers(updatedUsers);
      showToast('Senha redefinida com sucesso!', 'success');
      setLogin(recoveryUser?.login || '');
      setPassword(newPassword);
      setShowRecovery(false);
      setRecoveryStep('login');
      setRecoveryUser(null);
      setMasterKey('');
      setNewPassword('');
      alert('Senha alterada com sucesso!');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 overflow-hidden transition-colors">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/5 dark:bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 border border-transparent dark:border-slate-800 transition-colors"
      >
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 text-white rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl shadow-indigo-600/20 overflow-hidden">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <>
                <Gem size={32} className="sm:hidden" />
                <Gem size={40} className="hidden sm:block" />
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{config.appName}</h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">{config.appSubtitle || 'Sistema de Gestão de Vendas'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Usuário</label>
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none p-5 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                placeholder="Digite seu login"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type={showPass ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none p-5 pl-12 pr-12 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl"
                aria-label={showPass ? "Esconder senha" : "Mostrar senha"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer appearance-none w-5 h-5 border-2 border-slate-200 dark:border-slate-800 rounded-lg checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                />
                <svg 
                  className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Lembrar-me</span>
            </label>
            
            <button 
              type="button"
              onClick={() => setShowRecovery(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30"
            >
              <AlertCircle size={18} />
              <span className="text-sm font-bold">{error}</span>
            </motion.div>
          )}

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            ENTRAR NO SISTEMA
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          {users.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
              Primeiro acesso? Digite qualquer login e senha para criar o administrador.
            </p>
          ) : (
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); showToast('Redirecionando para o suporte...', 'info'); }}
              className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs font-bold group"
            >
              <LifeBuoy size={14} className="group-hover:rotate-12 transition-transform" />
              CENTRAL DE AJUDA & SUPORTE TÉCNICO
            </a>
          )}
        </div>
      </motion.div>

      {/* Recovery Modal */}
      <AnimatePresence>
        {showRecovery && (
          <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-transparent dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Recuperar Senha</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Siga os passos para resetar.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRecovery(false);
                    setRecoveryStep('login');
                    setRecoveryError('');
                  }}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRecovery} className="p-8 space-y-6 bg-white dark:bg-slate-900">
                {recoveryStep === 'login' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Informe seu **login** para localizarmos sua conta no sistema.
                    </p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Seu Login</label>
                      <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                          type="text" 
                          value={login}
                          onChange={(e) => setLogin(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                          placeholder="Ex: admin"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {recoveryStep === 'verify' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-4">
                      <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">
                        Usuário encontrado: <span className="font-black underline">{recoveryUser?.nome}</span>
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Para sua segurança, insira a **Chave Mestra** do sistema ou peça ao gerente.
                    </p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Chave Mestra</label>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                          type="password" 
                          value={masterKey}
                          onChange={(e) => setMasterKey(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Dica: Se você não sabe a chave, consulte o administrador do sistema.</p>
                  </div>
                )}

                {recoveryStep === 'reset' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      Verificação concluída! Agora defina sua **nova senha**.
                    </p>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                          placeholder="Mínimo 4 caracteres"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {recoveryError && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30"
                  >
                    <AlertCircle size={18} />
                    <span className="text-sm font-bold">{recoveryError}</span>
                  </motion.div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-3 group border border-transparent dark:border-slate-700"
                >
                  {recoveryStep === 'login' ? 'VERIFICAR USUÁRIO' : recoveryStep === 'verify' ? 'VALIDAR CHAVE' : 'ALTERAR SENHA'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
