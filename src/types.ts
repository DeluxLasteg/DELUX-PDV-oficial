/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'gerente' | 'funcionario';

export interface User {
  id: number;
  nome: string;
  login: string;
  senha?: string;
  nivel: UserRole;
}

export interface Product {
  id: number;
  nome: string;
  barcode: string;
  cat: string;
  custo: number;
  venda: number;
  estoque: number;
  estoqueMinimo: number;
  img?: string;
  specs?: string;
}

export interface Client {
  id: number;
  nome: string;
  fone: string;
  email?: string;
}

export interface SaleItem extends Product {
  qtd: number;
}

export interface Payment {
  metodo: string;
  valor: number;
  parcelas?: number;
}

export interface Sale {
  seqId: string;
  id: number;
  data: string;
  dataCurta: string;
  clienteId: string | number;
  cliente: string;
  forma: string;
  pagamentos: Payment[];
  subtotal: number;
  desconto: number;
  total: number;
  lucro: number;
  itens: SaleItem[];
  operador: string;
}

export interface SystemConfig {
  appName: string;
  appSubtitle: string;
  version: string;
  logoUrl?: string;
  masterKey: string;
  theme: 'light' | 'dark';
}

export type Section = 'dashboard' | 'pdv' | 'produtos' | 'clientes' | 'vendas' | 'config' | 'settings';
