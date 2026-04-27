/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemConfig } from '../types';
import { useToast } from './ToastContext';
import { Settings, Save, RefreshCcw, Image as ImageIcon, Type, Info, ShieldAlert, Key, Sun, Moon, Printer } from 'lucide-react';
import { motion } from 'motion/react';

interface SystemSettingsProps {
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
}

export default function SystemSettings({ config, setConfig }: SystemSettingsProps) {
  const { showToast } = useToast();
  const [selectedTheme, setSelectedTheme] = React.useState<'light' | 'dark'>(config.theme || 'light');
  const [selectedPrinterWidth, setSelectedPrinterWidth] = React.useState<'58mm' | '80mm' | 'A4'>(config.printerWidth || '80mm');

  React.useEffect(() => {
    setSelectedTheme(config.theme || 'light');
  }, [config.theme]);

  React.useEffect(() => {
    setSelectedPrinterWidth(config.printerWidth || '80mm');
  }, [config.printerWidth]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setSelectedTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePrinterWidthChange = (width: '58mm' | '80mm' | 'A4') => {
    setSelectedPrinterWidth(width);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newConfig: SystemConfig = {
      appName: formData.get('appName') as string,
      appSubtitle: formData.get('appSubtitle') as string,
      version: formData.get('version') as string,
      logoUrl: formData.get('logoUrl') as string || undefined,
      masterKey: formData.get('masterKey') as string,
      theme: selectedTheme,
      companyName: formData.get('companyName') as string || undefined,
      cnpjCpf: formData.get('cnpjCpf') as string || undefined,
      ieRg: formData.get('ieRg') as string || undefined,
      address: formData.get('address') as string || undefined,
      addressNumber: formData.get('addressNumber') as string || undefined,
      neighborhood: formData.get('neighborhood') as string || undefined,
      city: formData.get('city') as string || undefined,
      state: formData.get('state') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      email: formData.get('email') as string || undefined,
      printerWidth: selectedPrinterWidth,
      autoPrint: formData.get('autoPrint') === 'on',
      blockKeyboard: formData.get('blockKeyboard') === 'on',
    };

    setConfig(newConfig);
    showToast('Configurações do sistema salvas!', 'success');
  };

  const resetToDefault = () => {
    if (confirm("Deseja realmente resetar as configurações para o padrão?")) {
      const defaultConfig: SystemConfig = {
        appName: 'DELUX PDV',
        appSubtitle: 'Delux Vendas',
        version: '1.0.0-stable',
        masterKey: 'DELUX-2026',
        theme: 'light',
        printerWidth: '80mm',
        autoPrint: false,
      };
      setConfig(defaultConfig);
      setSelectedTheme('light');
      setSelectedPrinterWidth('80mm');
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Configurações Gerais</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Personalize a identidade e informações do sistema.</p>
        </div>
        
        <button 
          onClick={resetToDefault}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RefreshCcw size={20} />
          Resetar Padrão
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Settings className="text-indigo-600" size={24} />
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Identidade Visual</h3>
              </div>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8 bg-white dark:bg-slate-900">
              <div className="space-y-6">
                <div className="space-y-4 pt-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Sun size={12} /> Tema do Sistema
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
                        selectedTheme === 'light'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 shadow-lg shadow-indigo-600/10'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <Sun size={32} />
                      <span className="font-bold">Claro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`flex-1 flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
                        selectedTheme === 'dark'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 shadow-lg shadow-indigo-600/10'
                          : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <Moon size={32} />
                      <span className="font-bold">Escuro</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Type size={12} /> Nome do Aplicativo
                    </label>
                    <input 
                      type="text" 
                      name="appName" 
                      defaultValue={config.appName} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Info size={12} /> Subtítulo / Slogan
                    </label>
                    <input 
                      type="text" 
                      name="appSubtitle" 
                      defaultValue={config.appSubtitle} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Settings size={12} /> Versão do Sistema
                    </label>
                    <input 
                      type="text" 
                      name="version" 
                      defaultValue={config.version} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={12} /> URL do Logo (Opcional)
                    </label>
                    <input 
                      type="text" 
                      name="logoUrl" 
                      defaultValue={config.logoUrl} 
                      placeholder="https://..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <Info className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Dados da Empresa / Emitente</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Razão Social / Nome</label>
                    <input type="text" name="companyName" defaultValue={config.companyName} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CNPJ / CPF</label>
                      <input type="text" name="cnpjCpf" defaultValue={config.cnpjCpf} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">IE / RG</label>
                      <input type="text" name="ieRg" defaultValue={config.ieRg} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 col-span-1 md:col-span-2">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Endereço (Rua/Av)</label>
                      <input type="text" name="address" defaultValue={config.address} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nº</label>
                      <input type="text" name="addressNumber" defaultValue={config.addressNumber} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-1 md:col-span-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Bairro</label>
                      <input type="text" name="neighborhood" defaultValue={config.neighborhood} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cidade</label>
                      <input type="text" name="city" defaultValue={config.city} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estado (UF)</label>
                      <input type="text" name="state" defaultValue={config.state} maxLength={2} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white text-center uppercase" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Telefone de Contato</label>
                    <input type="text" name="phone" defaultValue={config.phone} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email de Contato</label>
                    <input type="email" name="email" defaultValue={config.email} className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-slate-800 dark:text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <Printer className="text-indigo-600" size={20} />
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Configuração de Impressão</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Largura da Bobina (Papel)</label>
                    <div className="flex gap-4 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handlePrinterWidthChange('58mm')}
                        className={`flex-1 min-w-[80px] flex items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedPrinterWidth === '58mm' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 shadow-lg shadow-indigo-600/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:border-slate-200'}`}
                      >
                        <span className="font-bold">58mm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrinterWidthChange('80mm')}
                        className={`flex-1 min-w-[80px] flex items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedPrinterWidth === '80mm' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 shadow-lg shadow-indigo-600/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:border-slate-200'}`}
                      >
                        <span className="font-bold">80mm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrinterWidthChange('A4')}
                        className={`flex-1 min-w-[80px] flex items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedPrinterWidth === 'A4' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 shadow-lg shadow-indigo-600/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:border-slate-200'}`}
                      >
                        <span className="font-bold">A4</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Comportamento</label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <input 
                        type="checkbox" 
                        name="autoPrint" 
                        id="autoPrint"
                        defaultChecked={config.autoPrint}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                      <label htmlFor="autoPrint" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Imprimir comprovante automaticamente após venda
                      </label>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <input 
                        type="checkbox" 
                        name="blockKeyboard" 
                        id="blockKeyboard"
                        defaultChecked={config.blockKeyboard}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                      <label htmlFor="blockKeyboard" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Bloquear teclado virtual no PDV (Recomendado p/ Leitores)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldAlert className="text-red-500" size={20} />
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Segurança do Sistema</h3>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-3xl border border-red-100 dark:border-red-900/30 mb-6">
                  <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    **Atenção:** A Chave Mestra é utilizada para recuperar senhas de qualquer usuário. Mantenha-a em local seguro e não a compartilhe com funcionários não autorizados.
                  </p>
                </div>

                <div className="max-w-md space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Key size={12} /> Nova Chave Mestra
                  </label>
                  <input 
                    type="text" 
                    name="masterKey" 
                    defaultValue={config.masterKey} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none font-mono font-bold text-red-600" 
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button 
                  type="submit" 
                  className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save size={20} />
                  Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] p-8 text-slate-800 dark:text-white shadow-sm dark:shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="text-xl font-black mb-6 relative z-10">Prévia do Cabeçalho</h3>
            
            <div className="flex items-center gap-4 bg-white/50 dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <Settings className="text-white" size={24} />
                )}
              </div>
              <div>
                <h4 className="font-bold text-lg leading-tight text-slate-800 dark:text-white">{config.appName}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">{config.appSubtitle}</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Versão Atual:</span>
                <span className="font-mono text-indigo-500 dark:text-indigo-400">{config.version}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <span className="text-emerald-500 dark:text-emerald-400 font-bold">Online</span>
              </div>
            </div>
          </motion.div>

          <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-[2.5rem] p-8 border border-indigo-100 dark:border-indigo-900/30">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400 mb-2 flex items-center gap-2">
              <Info size={18} /> Dica de Customização
            </h4>
            <p className="text-sm text-indigo-700/70 dark:text-indigo-300/70 leading-relaxed">
              As alterações feitas aqui serão refletidas em todo o sistema, incluindo a barra lateral, o cabeçalho e os relatórios de vendas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}