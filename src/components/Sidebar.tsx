/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Users, Receipt, Settings, LogOut, Gem, ChevronLeft, ChevronRight, X, Info, Sliders } from 'lucide-react';
import { Section, User, SystemConfig } from '../types';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface SidebarProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  user: User;
  onLogout: () => void;
  onShowDetails: () => void;
  config: SystemConfig;
}

export default function Sidebar({ activeSection, setActiveSection, collapsed, setCollapsed, isMobileOpen, setIsMobileOpen, user, onLogout, onShowDetails, config }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, managerOnly: false },
    { id: 'pdv', label: 'Frente Caixa', icon: ShoppingCart, managerOnly: false },
    { id: 'produtos', label: 'Estoque', icon: Package, managerOnly: false },
    { id: 'clientes', label: 'Clientes', icon: Users, managerOnly: false },
    { id: 'vendas', label: 'Vendas', icon: Receipt, managerOnly: true },
    { id: 'config', label: 'Usuários', icon: Settings, managerOnly: true },
    { id: 'settings', label: 'Configurações', icon: Sliders, managerOnly: true },
  ] as const;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden"
          />
        )}
      </AnimatePresence>

      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "no-print fixed inset-y-0 left-0 z-[70] bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col flex-shrink-0",
          "md:relative md:translate-x-0",
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          !isMobileOpen && (collapsed && !isHovered ? "md:w-20" : "md:w-64")
        )}
      >
        <div className="p-6 flex items-center justify-between overflow-hidden shrink-0 border-b border-slate-50 dark:border-slate-900 md:border-none">
          <div className={cn(
            "flex items-center gap-2 transition-all duration-300", 
            !isMobileOpen && collapsed && !isHovered ? "md:opacity-0 md:w-0 md:translate-x-[-20px]" : "opacity-100 w-auto translate-x-0"
          )}>
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 overflow-hidden">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Gem className="text-white" size={18} />
              )}
            </div>
            <div className="whitespace-nowrap">
              <h1 className="text-sm font-black text-slate-800 dark:text-white leading-tight">{config.appName}</h1>
              <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">{config.appSubtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "hidden md:block p-1 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 rounded-md transition-all duration-300",
              !isMobileOpen && collapsed && !isHovered ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
            )}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
          {navItems.map((item) => {
            if (item.managerOnly && user.nivel !== 'gerente') return null;
            
            const isActive = activeSection === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as Section)}
                className={cn(
                  "w-full flex items-center px-3 py-3 rounded-xl transition-all group relative",
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-indigo-600 dark:hover:text-white",
                  !isMobileOpen && collapsed && !isHovered ? "justify-center" : "justify-start gap-3"
                )}
                title={!isMobileOpen && collapsed && !isHovered ? item.label : undefined}
              >
                <Icon size={22} className={cn("shrink-0", isActive ? "text-white" : "group-hover:text-indigo-600 dark:group-hover:text-indigo-400")} />
                
                {(!collapsed || isMobileOpen || isHovered) && (
                  <span className={cn("font-medium whitespace-nowrap overflow-hidden transition-all duration-300", isActive ? "text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-white")}>
                    {item.label}
                  </span>
                )}

                {!isMobileOpen && collapsed && !isHovered && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[80] hidden md:block">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-900 space-y-2 shrink-0">
          <button 
            onClick={onShowDetails}
            className={cn(
              "w-full flex items-center px-3 py-3 rounded-xl transition-all text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 group relative",
              !isMobileOpen && collapsed && !isHovered ? "justify-center" : "justify-center gap-3"
            )}
          >
            <Info size={22} className="shrink-0" />
            {(!collapsed || isMobileOpen || isHovered) && <span className="font-medium whitespace-nowrap overflow-hidden flex-1 text-center">Sistema</span>}
            {!isMobileOpen && collapsed && !isHovered && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-indigo-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[80] hidden md:block">
                Detalhes do Sistema
              </div>
            )}
          </button>

          <button 
            onClick={onLogout}
            className={cn(
              "w-full flex items-center px-3 py-3 rounded-xl transition-all text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 group relative",
              !isMobileOpen && collapsed && !isHovered ? "justify-center" : "justify-center gap-3"
            )}
          >
            <LogOut size={22} className="shrink-0" />
            {(!collapsed || isMobileOpen || isHovered) && <span className="font-medium whitespace-nowrap overflow-hidden flex-1 text-center">Sair</span>}
            {!isMobileOpen && collapsed && !isHovered && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[80] hidden md:block">
                Sair
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
