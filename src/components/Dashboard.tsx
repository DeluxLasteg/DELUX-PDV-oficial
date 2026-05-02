/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Product, Sale, User } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  user: User;
  theme?: 'light' | 'dark';
}

export default function Dashboard({ products, sales, user, theme = 'light' }: DashboardProps) {
  const isDark = theme === 'dark';

  const stats = useMemo(() => {
    const today = new Date();
    const todaySales = sales.filter(s => isSameDay(new Date(s.id), today));
    const totalToday = todaySales.reduce((acc, s) => acc + s.total, 0);
    
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.venda * p.estoque), 0);
    const totalStock = products.reduce((acc, p) => acc + p.estoque, 0);
    const criticalItems = products.filter(p => p.estoque > 0 && p.estoque <= p.estoqueMinimo).length;
    const zeroItems = products.filter(p => p.estoque <= 0).length;
    
    const totalProfit = sales.reduce((acc, s) => acc + s.lucro, 0);

    return {
      todaySales: totalToday,
      inventoryValue: totalInventoryValue,
      totalStock,
      criticalItems,
      zeroItems,
      totalProfit
    };
  }, [products, sales]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    return last7Days.map(dateStr => {
      const daySales = sales.filter(s => s.dataCurta === format(parseISO(dateStr), 'dd/MM/yyyy'));
      return {
        name: format(parseISO(dateStr), 'EEE', { locale: ptBR }),
        vendas: daySales.reduce((acc, s) => acc + s.total, 0),
        lucro: daySales.reduce((acc, s) => acc + s.lucro, 0),
      };
    });
  }, [sales]);

  const stockData = useMemo(() => [
    { name: 'Saudável', value: products.length - stats.criticalItems - stats.zeroItems, color: '#10b981' },
    { name: 'Crítico', value: stats.criticalItems, color: '#f59e0b' },
    { name: 'Zerado', value: stats.zeroItems, color: '#ef4444' },
  ], [products.length, stats]);

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Visão Geral</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Bem-vindo de volta, {user.nome}!</p>
        </div>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4" aria-label="Estatísticas rápidas">
        <StatCard 
          title="Vendas Hoje" 
          value={formatCurrency(stats.todaySales)} 
          icon={TrendingUp} 
          color="blue" 
        />
        {user.nivel === 'gerente' && (
          <StatCard 
            title="Lucro Total" 
            value={formatCurrency(stats.totalProfit)} 
            icon={DollarSign} 
            color="emerald" 
          />
        )}
        <StatCard 
          title="Produtos" 
          value={products.length.toString()} 
          icon={Package} 
          color="indigo" 
        />
        <StatCard 
          title="Total Estoque" 
          value={stats.totalStock.toString()} 
          icon={BarChart3} 
          color="purple" 
        />
        <StatCard 
          title="Estoque Crítico" 
          value={stats.criticalItems.toString()} 
          icon={AlertTriangle} 
          color="orange" 
          alert={stats.criticalItems > 0}
        />
        <StatCard 
          title="Itens Zerados" 
          value={stats.zeroItems.toString()} 
          icon={XCircle} 
          color="red" 
          alert={stats.zeroItems > 0}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors" aria-label="Gráfico de vendas">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fluxo de Vendas (7 dias)</h3>
          </div>
          <div className="h-[300px] w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: isDark ? '#0f172a' : '#fff', 
                    color: isDark ? '#fff' : '#1e293b', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ color: isDark ? '#fff' : '#1e293b' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVendas)" 
                />
                {user.nivel === 'gerente' && (
                  <Area 
                    type="monotone" 
                    dataKey="lucro" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorLucro)" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col transition-colors" aria-label="Status do estoque">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Status do Estoque</h3>
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="h-[250px] w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      backgroundColor: isDark ? '#0f172a' : '#fff', 
                      color: isDark ? '#fff' : '#1e293b', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                    }}
                    itemStyle={{ color: isDark ? '#fff' : '#1e293b' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            {stockData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" aria-hidden="true" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.value} itens</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, alert }: { title: string, value: string, icon: any, color: string, alert?: boolean }) {
  const colors: Record<string, string> = {
    blue: "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20",
    emerald: "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20",
    indigo: "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20",
    purple: "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20",
    orange: "border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20",
    red: "border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20",
  };

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border-b-4 transition-transform hover:-translate-y-1",
      colors[color] || "border-slate-500"
    )}>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={cn("p-1.5 sm:p-2 rounded-lg sm:rounded-xl", colors[color])}>
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </div>
        {alert && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
        )}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate" title={title}>{title}</p>
      <h3 className="text-xl sm:text-2xl font-black mt-1 tracking-tight text-slate-800 dark:text-white truncate">{value}</h3>
    </div>
  );
}
