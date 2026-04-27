/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Section, User, Product, Client, Sale, SaleItem } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PDV from './components/PDV';
import Inventory from './components/Inventory';
import Clients from './components/Clients';
import Sales from './components/Sales';
import Users from './components/Users';
import Login from './components/Login';
import SystemDetailsModal from './components/SystemDetailsModal';
import SystemSettings from './components/SystemSettings';
import { motion, AnimatePresence } from 'motion/react';
import { SystemConfig } from './types';
import { ToastProvider } from './components/ToastContext';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('dlx_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSystemDetails, setShowSystemDetails] = useState(false);

  // Data State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('dlx_prod');
    return saved ? JSON.parse(saved) : [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('dlx_cli');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('dlx_venda');
    return saved ? JSON.parse(saved) : [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('dlx_user');
    return saved ? JSON.parse(saved) : [];
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('dlx_config');
    const defaultConfig: SystemConfig = {
      appName: 'DELUX PDV',
      appSubtitle: 'Delux Vendas',
      version: '1.0.0-stable',
      masterKey: 'DELUX-2026',
      theme: 'light',
      printerWidth: '80mm',
      autoPrint: false,
      blockKeyboard: false,
    };
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  });

  // Theme support
  useEffect(() => {
    if (systemConfig.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [systemConfig.theme]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('dlx_prod', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('dlx_cli', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('dlx_venda', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('dlx_user', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('dlx_config', JSON.stringify(systemConfig));
  }, [systemConfig]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('dlx_logged_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dlx_logged_user');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    setActiveSection('dashboard');
  };

  if (!user) {
    return (
      <ToastProvider>
        <Login onLogin={setUser} users={users} setUsers={setUsers} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={(s) => {
          setActiveSection(s);
          setIsMobileMenuOpen(false);
        }} 
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        user={user}
        onLogout={handleLogout}
        onShowDetails={() => setShowSystemDetails(true)}
        config={systemConfig}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          user={user} 
          onToggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {activeSection === 'dashboard' && (
                <Dashboard products={products} sales={sales} user={user} theme={systemConfig.theme} />
              )}
              {activeSection === 'pdv' && (
                <PDV 
                  products={products} 
                  setProducts={setProducts}
                  clients={clients} 
                  sales={sales} 
                  setSales={setSales}
                  user={user} 
                  users={users}
                  config={systemConfig}
                  setConfig={setSystemConfig}
                />
              )}
              {activeSection === 'produtos' && (
                <Inventory 
                  products={products} 
                  setProducts={setProducts} 
                  user={user} 
                />
              )}
              {activeSection === 'clientes' && (
                <Clients 
                  clients={clients} 
                  setClients={setClients} 
                  sales={sales}
                  user={user} 
                />
              )}
              {activeSection === 'vendas' && user.nivel === 'gerente' && (
                <Sales 
                  sales={sales} 
                  setSales={setSales}
                  products={products}
                  setProducts={setProducts}
                  user={user} 
                  config={systemConfig}
                  setConfig={setSystemConfig}
                />
              )}
              {activeSection === 'config' && user.nivel === 'gerente' && (
                <Users 
                  users={users} 
                  setUsers={setUsers} 
                  currentUser={user}
                />
              )}
              {activeSection === 'settings' && user.nivel === 'gerente' && (
                <SystemSettings 
                  config={systemConfig}
                  setConfig={setSystemConfig}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <SystemDetailsModal 
        isOpen={showSystemDetails} 
        onClose={() => setShowSystemDetails(false)} 
        user={user}
        totalSales={sales.length}
        totalProducts={products.length}
        config={systemConfig}
      />
    </div>
    </ToastProvider>
  );
}
