/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Client, Sale, SaleItem, User, Payment, SystemConfig } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { useToast } from './ToastContext';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle, 
  User as UserIcon,
  CreditCard,
  Banknote,
  QrCode,
  Camera,
  X,
  XCircle,
  List,
  Printer,
  Receipt,
  FileText,
  Maximize,
  Minimize,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';

interface PDVProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  clients: Client[];
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  user: User;
  users: User[];
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;
}

export default function PDV({ products, setProducts, clients, sales, setSales, user, users, config, setConfig }: PDVProps) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>(() => {
    const saved = localStorage.getItem(`dlx_cart_${user.login}`);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedClient, setSelectedClient] = useState<string | number>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('Dinheiro');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | ''>('');
  const [currentInstallments, setCurrentInstallments] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [previewType, setPreviewType] = useState<'sale' | 'quote'>('sale');
  const [showProductList, setShowProductList] = useState(false);
  const [lastSaleChange, setLastSaleChange] = useState(0);
  const [lastSaleSeqId, setLastSaleSeqId] = useState('');
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [authPass, setAuthPass] = useState('');
  const [isDiscountAuthorized, setIsDiscountAuthorized] = useState(user.nivel === 'gerente');
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerFullscreen, setIsScannerFullscreen] = useState(false);
  const [scanFlash, setScanFlash] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1 });
  const [currentZoom, setCurrentZoom] = useState(1);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastScannedCode = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);
  const lastGlobalScanTime = useRef<number>(0);
  const lastNotFoundTime = useRef<number>(0);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.error("Erro ao tocar beep:", err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Erro ao parar scanner:", err);
      }
    }
    setIsScanning(false);
    setIsScannerFullscreen(false);
    lastScannedCode.current = null;
    setScanFlash(false);
    setZoomRange({ min: 1, max: 1 });
    setCurrentZoom(1);
    setHasTorch(false);
    setIsTorchOn(false);
  };

  const startScanner = async () => {
    setIsScanning(true);
    lastScannedCode.current = null;
    lastScannedTime.current = 0;
    lastGlobalScanTime.current = 0;
    lastNotFoundTime.current = 0;
    setScanFlash(false);
    setZoomRange({ min: 1, max: 1 });
    setCurrentZoom(1);
    setHasTorch(false);
    setIsTorchOn(false);
    
    // Use a slightly longer timeout to ensure DOM and layout are ready
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        
        const config = {
          fps: 30, // Higher FPS for better tracking
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            // More focused box for small barcodes
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const width = Math.floor(viewfinderWidth * 0.75); 
            const height = Math.floor(minEdge * 0.35); 
            return { width, height };
          },
          aspectRatio: window.innerWidth < 768 ? 1.0 : 1.777778,
          disableFlip: false,
          videoConstraints: {
            facingMode: { exact: "environment" },
            // Ultra-wide/high res for detail
            width: { min: 1280, ideal: 1920, max: 2560 },
            height: { min: 720, ideal: 1080, max: 1440 },
          },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            const now = Date.now();
            
            // Global cooldown: ignore ANY scan result within 800ms of the previous one
            if ((now - lastGlobalScanTime.current) < 800) {
              return;
            }

            // Specific debounce for same code: 2.5 seconds
            if (decodedText === lastScannedCode.current && (now - lastScannedTime.current) < 2500) {
              return;
            }

            lastScannedCode.current = decodedText;
            lastScannedTime.current = now;
            lastGlobalScanTime.current = now;

            const product = products.find(p => p.barcode === decodedText);
            if (product) {
              playBeep();
              setScanFlash(true);
              setTimeout(() => setScanFlash(false), 300);
              addToCart(product, 'scanner');
            } else {
              // Throttle any "not registered" message of any code to once per 3s
              if (decodedText.length >= 4 && (now - lastNotFoundTime.current) > 3000) {
                lastNotFoundTime.current = now;
                showToast(`Código ${decodedText} não cadastrado`, "warning");
              }
            }
          },
          () => {}
        );

        // Access capabilities for zoom after start
        setTimeout(async () => {
          try {
            const track = (scanner as any).getRunningTrack();
            if (track) {
              const capabilities = track.getCapabilities() as any;
              if (capabilities.zoom) {
                setZoomRange({
                  min: capabilities.zoom.min || 1,
                  max: capabilities.zoom.max || 1
                });
                
                // Auto-apply a slight zoom (1.5x or midway) if supported to help with small codes
                const initialZoom = Math.min(1.5, capabilities.zoom.max || 1);
                if (initialZoom > (capabilities.zoom.min || 1)) {
                  handleZoomChange(initialZoom);
                } else {
                  setCurrentZoom(capabilities.zoom.min || 1);
                }
              }

              if (capabilities.torch) {
                setHasTorch(true);
              }
            }
          } catch (err) {
            console.warn("Camera capabilities not accessible:", err);
          }
        }, 1500);

      } catch (err) {
        console.error("Erro ao iniciar scanner:", err);
        showToast("Erro ao abrir câmera", "error");
        setIsScanning(false);
      }
    }, 400);
  };

  useEffect(() => {
    localStorage.setItem(`dlx_cart_${user.login}`, JSON.stringify(cart));
  }, [cart, user.login]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleZoomChange = async (val: number) => {
    setCurrentZoom(val);
    if (scannerRef.current) {
      try {
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ zoom: val }] as any
        });
      } catch (err) {
        console.error("Erro ao aplicar zoom:", err);
      }
    }
  };

  const toggleTorch = async () => {
    if (scannerRef.current) {
      try {
        const nextState = !isTorchOn;
        await scannerRef.current.applyVideoConstraints({
          advanced: [{ torch: nextState }] as any
        });
        setIsTorchOn(nextState);
      } catch (err) {
        console.error("Erro ao alternar lanterna:", err);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.nome.toLowerCase().includes(term) || 
      p.barcode.includes(term) ||
      p.cat.toLowerCase().includes(term)
    );
  }, [searchTerm, products]);

  const subtotal = useMemo(() => {
    const sum = cart.reduce((acc, item) => acc + (item.venda * item.qtd), 0);
    return Math.round(sum * 100) / 100;
  }, [cart]);

  const total = useMemo(() => {
    const val = Math.max(0, subtotal - discount);
    return Math.round(val * 100) / 100;
  }, [subtotal, discount]);

  const totalPaid = useMemo(() => {
    const sum = payments.reduce((acc, p) => acc + p.valor, 0);
    return Math.round(sum * 100) / 100;
  }, [payments]);

  const remainingAmount = useMemo(() => {
    const val = Math.max(0, total - totalPaid);
    return Math.round(val * 100) / 100;
  }, [total, totalPaid]);

  const addPayment = () => {
    const amount = Number(currentPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Insira um valor válido para o pagamento", "error");
      return;
    }

    const newPayment: Payment = {
      metodo: currentPaymentMethod,
      valor: Math.round(amount * 100) / 100,
      parcelas: currentPaymentMethod === 'Crédito' ? currentInstallments : undefined
    };

    setPayments([...payments, newPayment]);
    setCurrentPaymentAmount('');
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const addToCart = (product: Product, origin: 'input' | 'scanner' | 'manual' = 'input') => {
    if (product.estoque <= 0) {
      showToast("Produto sem estoque!", "error");
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      if (existing.qtd < product.estoque) {
        setCart(prev => prev.map(item => 
          item.id === product.id ? { ...item, qtd: item.qtd + 1 } : item
        ));
        showToast(`+1 ${product.nome} adicionado`, "info");
      } else {
        showToast("Limite de estoque atingido!", "warning");
      }
    } else {
      setCart(prev => [...prev, { ...product, qtd: 1 }]);
      showToast(`${product.nome} adicionado ao carrinho`, "success");
    }

    if (origin === 'input') {
      setSearchTerm('');
      if (!config.blockKeyboard) {
        searchInputRef.current?.focus();
      }
    }
  };

  const updateQtd = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQtd = item.qtd + delta;
        const original = products.find(p => p.id === id);
        if (newQtd > 0 && original && newQtd <= original.estoque) {
          return { ...item, qtd: newQtd };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleDiscountChange = (val: number) => {
    const safeVal = Math.max(0, Math.min(val, subtotal));
    if (safeVal > 0 && user.nivel === 'funcionario' && !isDiscountAuthorized) {
      setShowAuthModal(true);
    } else {
      setDiscount(Math.round(safeVal * 100) / 100);
    }
  };

  const confirmAuth = () => {
    // Validate against real managers in the system
    const isAuthorized = users.some(u => u.nivel === 'gerente' && u.senha === authPass);
    
    if (isAuthorized) {
      setIsDiscountAuthorized(true);
      setShowAuthModal(false);
      setAuthPass('');
      showToast("Desconto autorizado com sucesso!", "success");
    } else {
      showToast("Senha de gerente inválida!", "error");
      setAuthPass('');
    }
  };

  const finalizeSale = () => {
    if (cart.length === 0) return;
    
    if (totalPaid < total) {
      showToast(`Valor incompleto! Faltam ${formatCurrency(total - totalPaid)}`, "error");
      return;
    }

    const seqId = (sales.length + 1).toString().padStart(2, '0');
    const now = new Date();
    
    // Create summary string for 'forma'
    const paymentSummary = payments.map(p => 
      p.metodo === 'Crédito' ? `${p.metodo} ${p.parcelas}x` : p.metodo
    ).filter((v, i, a) => a.indexOf(v) === i).join(' + ');

    const sale: Sale = {
      seqId,
      id: Date.now(),
      data: now.toLocaleString('pt-BR'),
      dataCurta: now.toLocaleDateString('pt-BR'),
      clienteId: selectedClient ? Number(selectedClient) : "",
      cliente: selectedClient ? (clients.find(c => c.id === Number(selectedClient))?.nome || "Consumidor") : "Consumidor Final",
      forma: paymentSummary,
      pagamentos: payments,
      subtotal,
      desconto: discount,
      total,
      lucro: Math.round((total - cart.reduce((acc, item) => acc + (item.custo * item.qtd), 0)) * 100) / 100,
      itens: JSON.parse(JSON.stringify(cart)),
      operador: user.nome
    };

    // Update inventory
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) {
        return { ...p, estoque: p.estoque - cartItem.qtd };
      }
      return p;
    }));

    setSales(prev => [...prev, sale]);
    showToast(`Venda #${seqId} finalizada!`, "success");
    
    const change = Math.round(Math.max(0, totalPaid - total) * 100) / 100;
    setLastSaleChange(change);
    setLastSaleSeqId(seqId);
    setLastCompletedSale(sale);
    setPreviewType('sale');
    setShowSuccessModal(true);

    if (config.autoPrint) {
      setTimeout(() => {
        setShowReceiptPreview(true);
        setTimeout(() => {
          window.print();
        }, 500);
      }, 300);
    }

    setCart([]);
    setDiscount(0);
    setPayments([]);
    setCurrentPaymentAmount('');
    setSelectedClient('');
    setIsDiscountAuthorized(user.nivel === 'gerente');
  };

  const handlePrintQuote = () => {
    if (cart.length === 0) {
      showToast("Adicione itens ao carrinho para gerar um orçamento", "error");
      return;
    }

    const now = new Date();
    const quote: Sale = {
      seqId: "ORÇAM.",
      id: Date.now(),
      data: now.toLocaleString('pt-BR'),
      dataCurta: now.toLocaleDateString('pt-BR'),
      clienteId: selectedClient ? Number(selectedClient) : "",
      cliente: selectedClient ? (clients.find(c => c.id === Number(selectedClient))?.nome || "Consumidor") : "Consumidor Final",
      forma: "ORÇAMENTO",
      pagamentos: [],
      subtotal,
      desconto: discount,
      total,
      lucro: 0,
      itens: JSON.parse(JSON.stringify(cart)),
      operador: user.nome
    };

    setLastSaleChange(0);
    setLastSaleSeqId("ORÇ.");
    setLastCompletedSale(quote);
    setPreviewType('quote');
    setShowSuccessModal(true);
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
            body { 
              margin: 0; 
              padding: 0; 
              background: white !important; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            #thermal-receipt { 
              margin: 0 auto !important; 
              padding: 4mm !important; 
              box-shadow: none !important; 
              border: none !important;
              width: ${config.printerWidth === 'A4' ? '100%' : config.printerWidth} !important;
              max-width: ${config.printerWidth === 'A4' ? '210mm' : config.printerWidth} !important;
              height: auto !important;
              min-height: 0 !important;
              visibility: visible !important;
              display: block !important;
              position: static !important;
              overflow: hidden !important;
            }
            .no-print { display: none !important; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); }, 500)">
          ${receipt.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 5000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-full lg:overflow-hidden">
      {/* Left Column: Search and Cart */}
      <section className="flex-1 flex flex-col gap-6 min-w-0" aria-label="Carrinho de compras">
        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 shrink-0 transition-colors">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Escaneie ou digite o nome..." 
                inputMode={config.blockKeyboard ? "none" : "text"}
                className="w-full bg-slate-50 dark:bg-slate-950 border-none p-4 sm:p-5 pl-12 sm:pl-14 rounded-xl sm:rounded-2xl text-base sm:text-lg focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar produto"
              />
              
              <AnimatePresence>
                {searchTerm && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute z-[100] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl mt-2 max-h-[60vh] overflow-y-auto custom-scrollbar"
                  >
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(p => (
                        <button 
                          key={p.id}
                          onClick={() => addToCart(p, 'manual')}
                          className="w-full p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                              <img src={p.img || 'https://picsum.photos/seed/product/100/100'} alt={p.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100">{p.nome}</p>
                              <p className={cn(
                                "text-xs font-bold",
                                p.estoque <= p.estoqueMinimo ? "text-red-500" : "text-slate-400 dark:text-slate-500"
                              )}>
                                Estoque: {p.estoque} un
                              </p>
                            </div>
                          </div>
                          <span className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{formatCurrency(p.venda)}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <p className="font-medium">Nenhum produto encontrado</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => isScanning ? stopScanner() : startScanner()}
              className="bg-indigo-600 text-white p-4 sm:p-5 rounded-xl sm:rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 font-bold shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-500"
              title="Escanear Código de Barras"
            >
              <Camera size={22} className="sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Escanear</span>
            </button>

            <button 
              onClick={() => setShowProductList(true)}
              className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 p-4 sm:p-5 rounded-xl sm:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 font-bold shadow-sm border border-slate-200 dark:border-slate-700"
              title="Ver todos os produtos"
            >
              <List size={22} className="sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Produtos</span>
            </button>
          </div>
        </div>

        {/* Mobile FAB Scanner */}
        {!isScanning && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={startScanner}
            className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] flex items-center justify-center active:scale-90 transition-transform sm:hidden border border-indigo-400/50 backdrop-blur-sm"
          >
            <Camera size={28} />
          </motion.button>
        )}

        {/* Cart List */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-colors">
          <header className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 
              Itens no Carrinho ({cart.length})
            </h3>
            <button 
              onClick={() => setCart([])}
              className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} />
              Limpar
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
            <AnimatePresence>
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ 
                    opacity: 1, 
                    height: isScannerFullscreen ? '100vh' : 'auto',
                    position: isScannerFullscreen ? 'fixed' : 'relative',
                    top: isScannerFullscreen ? 0 : 'auto',
                    left: isScannerFullscreen ? 0 : 'auto',
                    width: isScannerFullscreen ? '100vw' : '100%',
                    zIndex: isScannerFullscreen ? 50 : 0
                  }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`${isScannerFullscreen ? 'bg-slate-950 p-0' : 'overflow-hidden'}`}
                >
                  <div className={`${isScannerFullscreen ? 'h-[100dvh] w-screen rounded-none flex items-center justify-center' : 'bg-slate-900 rounded-3xl border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/10 mb-6 min-h-[300px] sm:min-h-[400px]'} overflow-hidden relative`}>
                    <div id="reader" className="w-full h-full bg-black flex items-center justify-center"></div>
                    
                    {/* Viewfinder Overlay - Improved centering */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                      <motion.div 
                        animate={{ 
                          borderColor: scanFlash ? '#22c55e' : '#6366f1',
                          scale: scanFlash ? 1.05 : 1,
                          filter: scanFlash ? 'brightness(1.2)' : 'brightness(1)'
                        }}
                        className="w-[85%] max-w-[500px] aspect-[2/1] border-2 rounded-2xl relative overflow-hidden transition-all duration-150 shadow-[0_0_0_2000px_rgba(0,0,0,0.6)]"
                      >
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,1)]"></div>
                        
                        {/* Success semi-transparent overlay */}
                        <AnimatePresence>
                          {scanFlash && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.4 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-green-500"
                            />
                          )}
                        </AnimatePresence>

                        {/* Corner Accents */}
                        <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-white"></div>
                        <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-white"></div>
                        <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-white"></div>
                        <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-white"></div>
                      </motion.div>
                    </div>

                    {/* Controls */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
                      <button 
                        onClick={() => setIsScannerFullscreen(!isScannerFullscreen)}
                        className="bg-black/20 text-white p-3 rounded-xl backdrop-blur-md active:scale-90 transition-all border border-white/10 hover:bg-black/40"
                        title={isScannerFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                      >
                        {isScannerFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                      </button>

                      {hasTorch && (
                        <button 
                          onClick={toggleTorch}
                          className={`${isTorchOn ? 'bg-yellow-500/80' : 'bg-black/20'} text-white p-3 rounded-xl backdrop-blur-md active:scale-90 transition-all border border-white/10 hover:opacity-80`}
                          title={isTorchOn ? "Desligar lanterna" : "Ligar lanterna"}
                        >
                          <Zap size={20} fill={isTorchOn ? "currentColor" : "none"} />
                        </button>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 z-20">
                      <button 
                        onClick={stopScanner}
                        className="bg-red-500/80 text-white p-3 rounded-xl backdrop-blur-md active:scale-90 transition-all border border-white/10 hover:bg-red-600"
                        title="Fechar camera"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Zoom Slider */}
                    {zoomRange.max > zoomRange.min && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-20 w-[60%] max-w-[250px] z-20 bg-black/40 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] text-white/60 font-bold">ZOOM</span>
                          <span className="text-[10px] text-indigo-400 font-bold">{currentZoom.toFixed(1)}x</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Minus size={14} className="text-white/40" />
                          <input 
                            type="range"
                            min={zoomRange.min}
                            max={zoomRange.max}
                            step={0.1}
                            value={currentZoom}
                            onChange={(e) => handleZoomChange(Number(e.target.value))}
                            className="flex-1 accent-indigo-500 h-1 rounded-lg appearance-none cursor-pointer bg-white/10"
                          />
                          <Plus size={14} className="text-white/40" />
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-md text-white px-5 py-2 rounded-full text-[9px] sm:text-xs font-black tracking-[0.2em] flex items-center gap-2 shadow-xl border border-white/5 z-10 uppercase">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                      Aponte p/ o código
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {cart.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 py-10 sm:py-20"
                >
                  <ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-[10px] sm:text-xs">Carrinho Vazio</p>
                </motion.div>
              ) : (
                cart.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center hover:shadow-md transition-all group cursor-pointer"
                    onClick={() => setSelectedProductForDetail(item)}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0">
                        <img src={item.img || 'https://picsum.photos/seed/product/100/100'} alt={item.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm sm:text-base">{item.nome}</h4>
                        <p className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-bold">{formatCurrency(item.venda)} / un</p>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors sm:hidden"
                        aria-label="Remover item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto sm:ml-auto gap-4">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl" onClick={(e) => e.stopPropagation()}>
                         <button 
                          onClick={() => updateQtd(item.id, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:text-red-500 transition-colors dark:text-slate-300"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 sm:w-10 text-center font-black text-xs sm:text-sm text-slate-700 dark:text-slate-200">{item.qtd}</span>
                        <button 
                          onClick={() => updateQtd(item.id, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:text-indigo-600 transition-colors dark:text-slate-300"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
  
                      <div className="text-right min-w-[80px] sm:min-w-[100px]">
                        <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tighter">Subtotal</p>
                        <p className="font-black text-sm sm:text-base text-slate-800 dark:text-slate-100">{formatCurrency(item.venda * item.qtd)}</p>
                      </div>
  
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                        className="hidden sm:block p-2 text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Remover item"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Right Column: Checkout */}
      <aside className="w-full lg:w-[400px] flex flex-col gap-4 shrink-0 h-full overflow-y-auto pr-2 custom-scrollbar pb-8" aria-label="Finalização de venda">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
          <div>
            <label htmlFor="client-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                id="client-select"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none text-sm dark:text-white"
              >
                <option value="">Consumidor Final</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Formas de Pagamento</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {[
                  { id: 'Dinheiro', icon: Banknote, label: 'Dinheiro' },
                  { id: 'Pix', icon: QrCode, label: 'Pix' },
                  { id: 'Débito', icon: CreditCard, label: 'Débito' },
                  { id: 'Crédito', icon: CreditCard, label: 'Crédito' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setCurrentPaymentMethod(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1",
                      currentPaymentMethod === method.id 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                        : "bg-slate-50 dark:bg-slate-950 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <method.icon size={16} />
                    <span className="text-[8px] font-bold uppercase">{method.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
                    <input 
                      type="number" 
                      value={currentPaymentAmount}
                      onChange={(e) => setCurrentPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={remainingAmount.toFixed(2)}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-sm dark:text-white"
                      aria-label="Valor do pagamento"
                    />
                  </div>
                </div>
                {currentPaymentMethod === 'Crédito' && (
                  <select 
                    value={currentInstallments}
                    onChange={(e) => setCurrentInstallments(Number(e.target.value))}
                    className="w-20 p-2.5 bg-slate-50 dark:bg-slate-950 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-xs dark:text-white"
                    aria-label="Parcelas"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}x</option>
                    ))}
                  </select>
                )}
                <button 
                  onClick={addPayment}
                  className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                  aria-label="Adicionar pagamento"
                >
                  <Plus size={20} />
                </button>
              </div>

              {payments.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1 mb-3">
                  {payments.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                          {p.metodo === 'Dinheiro' && <Banknote size={16} />}
                          {p.metodo === 'Pix' && <QrCode size={16} />}
                          {(p.metodo === 'Débito' || p.metodo === 'Crédito') && <CreditCard size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                            {p.metodo} {p.parcelas ? `${p.parcelas}x` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatCurrency(p.valor)}</span>
                        <button 
                          onClick={() => removePayment(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          aria-label="Remover pagamento"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400 dark:text-slate-500">Total Pago</span>
                <span className="text-emerald-600 dark:text-emerald-500">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-400 dark:text-slate-500">Restante</span>
                <span className={cn(remainingAmount > 0 ? "text-red-500" : "text-slate-400 dark:text-slate-600")}>
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
              {totalPaid > total && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-emerald-600 dark:text-emerald-500">Troco</span>
                  <span className="text-emerald-700 dark:text-emerald-300 text-lg">{formatCurrency(totalPaid - total)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 dark:bg-slate-900 border-none dark:border dark:border-slate-800 text-white p-6 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden shrink-0 transition-colors">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-3 mb-6 relative z-10">
            <div className="flex justify-between text-indigo-100 dark:text-slate-400 text-xs font-medium">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-100 dark:text-slate-400 text-xs font-medium">
              <label htmlFor="discount-input">Desconto</label>
              <div className="flex items-center bg-white/10 dark:bg-slate-800 rounded-xl px-3 py-1 border border-white/20 dark:border-slate-700">
                <span className="text-[10px] mr-2">R$</span>
                <input 
                  id="discount-input"
                  type="number" 
                  value={discount}
                  onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  className="w-16 bg-transparent border-none p-0 text-right text-white font-bold focus:ring-0 outline-none text-xs" 
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/20 dark:border-slate-800">
              <p className="text-[10px] font-bold text-white/70 dark:text-indigo-400 uppercase mb-1 tracking-widest">Total a Pagar</p>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tighter flex items-baseline gap-1">
                <span className="text-xl font-bold text-white/40 dark:text-slate-500">R$</span>
                {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <button 
            onClick={finalizeSale}
            disabled={cart.length === 0 || totalPaid < total}
            className={cn(
              "group relative w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden",
              cart.length > 0 && totalPaid >= total
                ? "bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white" 
                : "bg-indigo-700/50 dark:bg-slate-800 text-indigo-300 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            <span className="relative z-10">FECHAR PEDIDO</span>
            <CheckCircle className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
          </button>

          <button 
            onClick={handlePrintQuote}
            disabled={cart.length === 0}
            className={cn(
              "mt-3 w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2",
              cart.length > 0
                ? "bg-indigo-500/20 text-indigo-100 hover:bg-indigo-500/30 border border-indigo-400/30" 
                : "bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-700/30"
            )}
          >
            <FileText size={18} />
            <span>IMPRIMIR ORÇAMENTO</span>
          </button>

          <p className="text-center text-indigo-200/50 dark:text-slate-500 text-[9px] mt-3 font-bold tracking-widest uppercase">Atalho: Tecla F2</p>
        </div>
      </aside>

      {/* Auth Modal for Discounts */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <XCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ação Restrita</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Insira a senha de um Gerente para aplicar desconto.</p>
              
              <input 
                type="password" 
                value={authPass}
                onChange={(e) => setAuthPass(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border-none p-5 rounded-2xl text-center text-3xl tracking-[0.5em] mb-6 focus:ring-4 focus:ring-orange-500/10 outline-none dark:text-white"
                autoFocus
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAuth}
                  className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-colors"
                >
                  Autorizar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Modal with Change and Receipt Option */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8 text-center bg-white dark:bg-slate-900">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {previewType === 'sale' ? <CheckCircle size={32} /> : <FileText size={32} />}
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                {previewType === 'sale' ? 'Venda Finalizada!' : 'Orçamento Gerado!'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {previewType === 'sale' ? `Venda #${lastSaleSeqId} concluída com sucesso.` : 'Orçamento pronto para impressão.'}
              </p>
              
              {previewType === 'sale' && lastSaleChange > 0 && (
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Banknote size={48} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Troco do Cliente</p>
                  <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tighter">
                    {formatCurrency(lastSaleChange)}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowReceiptPreview(true)}
                  className="w-full py-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-all flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-900/30"
                >
                  <Printer size={20} />
                  {previewType === 'sale' ? 'EMITIR CUPOM' : 'IMPRIMIR ORÇAMENTO'}
                </button>
                <button 
                  onClick={() => {
                    setShowSuccessModal(false);
                    setLastCompletedSale(null);
                    if (previewType === 'quote') {
                      // Don't clear cart if it was just a quote? Or maybe clear it?
                      // Usually budgets don't clear the cart in some systems, but let's see.
                      // The previous implementation didn't clear the cart.
                    }
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  {previewType === 'sale' ? 'NOVA VENDA' : 'VOLTAR AO PDV'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Product List Modal */}
      <AnimatePresence>
        {showProductList && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <List size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Lista de Produtos</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Selecione um item para adicionar ao carrinho.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProductList(false)}
                  className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {
                        addToCart(p, 'manual');
                        setShowProductList(false);
                      }}
                      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-4 flex flex-col gap-4 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group text-left relative overflow-hidden"
                    >
                      <div className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
                        <img src={p.img || 'https://picsum.photos/seed/product/200/200'} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            p.estoque <= p.estoqueMinimo ? "text-red-500" : "text-emerald-500 dark:text-emerald-400"
                          )}>
                            {p.estoque} em estoque
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{p.cat}</p>
                        <h4 className="font-black text-slate-800 dark:text-slate-100 leading-tight mb-2 line-clamp-2">{p.nome}</h4>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(p.venda)}</span>
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Plus size={18} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                <button 
                  onClick={() => setShowProductList(false)}
                  className="px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-900/20 border border-slate-800"
                >
                  Fechar Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {showReceiptPreview && lastCompletedSale && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                   {previewType === 'sale' ? <Receipt className="text-indigo-600" /> : <FileText className="text-indigo-600" />}
                   <h3 className="text-xl font-black text-slate-800 dark:text-white">
                     {previewType === 'sale' ? 'Cupom de Venda' : 'Orçamento / Proposta'}
                   </h3>
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

                {/* The actual "Paper" - Print Friendly Design */}
                <div id="thermal-receipt" 
                  className="bg-white text-slate-900 w-full shadow-lg font-mono text-[10px] leading-[1.2] border-t-8 border-slate-900 relative p-4 sm:p-8 no-scrollbar transition-all duration-300"
                  style={{ 
                    maxWidth: config.printerWidth === '58mm' ? '220px' : config.printerWidth === '80mm' ? '320px' : '800px',
                    minHeight: '450px'
                  } as any}
                >
                   <div className="text-center mb-6">
                      <h4 className="text-xl font-black mb-1 uppercase break-words px-2">{config.companyName || config.appName}</h4>
                      {previewType === 'quote' && <p className="text-[8px] font-black uppercase text-indigo-600 tracking-[0.2em] mb-2 leading-none">ORÇAMENTO / PROPOSTA COMERCIAL</p>}
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
                         <span className="font-bold">#{lastCompletedSale.seqId}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="font-bold">DATA:</span>
                         <span>{lastCompletedSale.data}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="font-bold shrink-0">CLIENTE:</span>
                         <span className="truncate ml-2">{lastCompletedSale.cliente}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="font-bold">VENDEDOR:</span>
                         <span className="truncate ml-2">{lastCompletedSale.operador}</span>
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
                         {lastCompletedSale.itens.map((item, i) => (
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
                         <span>{previewType === 'sale' ? 'SUBTOTAL' : 'VALOR BRUTO'}:</span>
                         <span>{formatCurrency(lastCompletedSale.subtotal)}</span>
                      </div>
                      {lastCompletedSale.desconto > 0 && (
                         <div className="flex justify-between font-bold">
                            <span>DESCONTO:</span>
                            <span>-{formatCurrency(lastCompletedSale.desconto)}</span>
                         </div>
                      )}
                      <div className="flex justify-between text-lg font-black border-t-2 border-slate-900 pt-2 mt-2">
                         <span>{previewType === 'sale' ? 'TOTAL' : 'TOTAL ESTIMADO'}:</span>
                         <span>{formatCurrency(lastCompletedSale.total)}</span>
                      </div>
                   </div>

                   {previewType === 'sale' ? (
                     <>
                       <div className="border-t border-dashed border-slate-300 my-4" />
                       
                       <div className="space-y-1 mb-6 text-[9px]">
                          <p className="font-black mb-2 flex items-center gap-1 uppercase border-b border-slate-100 pb-1">
                            Pagamento
                          </p>
                          {lastCompletedSale.pagamentos.map((p, i) => (
                            <div key={i} className="flex justify-between uppercase">
                               <span>{p.metodo} {p.parcelas ? `(${p.parcelas}X)` : ''}</span>
                               <span>{formatCurrency(p.valor)}</span>
                            </div>
                          ))}
                       </div>
                     </>
                   ) : (
                     <div className="mt-6 border border-slate-200 p-4 text-center text-[8px] italic leading-tight uppercase opacity-70">
                       Este documento não é um comprovante de venda e não possui valor fiscal. 
                       Preços sujeitos a alteração sem aviso prévio.
                     </div>
                   )}

                   <div className="text-center mt-10 space-y-4">
                      <div className="flex flex-col items-center gap-1">
                        <p className="font-black italic text-xs">Obrigado pela preferência!</p>
                        <p className="text-[8px] uppercase tracking-widest opacity-60">Sempre com você</p>
                      </div>
                      
                      {previewType === 'sale' && (
                        <div className="flex justify-center opacity-70 p-3 bg-slate-50 rounded-2xl mx-auto w-fit">
                           <QrCode size={48} strokeWidth={1} />
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {previewType === 'sale' && (
                          <p className="text-[7px] opacity-40 uppercase tracking-widest leading-normal mb-1">
                            Consulte sua nota física ou no site oficial
                          </p>
                        )}
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
                  {previewType === 'sale' ? 'IMPRIMIR CUPOM' : 'IMPRIMIR ORÇAMENTO'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProductForDetail && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[300] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-slate-200 dark:border-slate-800"
            >
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-slate-800 relative">
                <img 
                  src={selectedProductForDetail.img || `https://picsum.photos/seed/${selectedProductForDetail.id}/800/600`} 
                  alt={selectedProductForDetail.nome} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button 
                  onClick={() => setSelectedProductForDetail(null)}
                  className="absolute top-6 left-6 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-2xl transition-all md:hidden"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col bg-white dark:bg-slate-900">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2 block">
                      {selectedProductForDetail.cat}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white leading-tight">
                      {selectedProductForDetail.nome}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedProductForDetail(null)}
                    className="hidden md:flex p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X size={28} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço de Venda</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedProductForDetail.venda)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estoque</p>
                    <p className={cn(
                      "text-2xl font-black",
                      selectedProductForDetail.estoque <= selectedProductForDetail.estoqueMinimo ? "text-red-500" : "text-emerald-500"
                    )}>
                      {selectedProductForDetail.estoque} <small className="text-xs text-slate-400">un</small>
                    </p>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     Especificações Técnicas
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 min-h-[150px]">
                    {selectedProductForDetail.specs ? (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                        {selectedProductForDetail.specs}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic font-medium">
                        Nenhuma especificação cadastrada para este item.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">COD: {selectedProductForDetail.barcode || 'N/A'}</p>
                  <button 
                    onClick={() => setSelectedProductForDetail(null)}
                    className="px-10 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
