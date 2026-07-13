import { useState } from 'react';
import { Download, X, Monitor, Smartphone, Chrome } from 'lucide-react';

export default function InstallAppModal() {
  const [open, setOpen] = useState(false);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all"
      >
        <Download className="w-5 h-5 flex-shrink-0" />
        <span className="hidden lg:inline">Instalar App</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ background: 'hsl(229,22%,10%)', border: '1px solid hsl(229,20%,18%)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-orange-400" /> Instalar Be Fitness
              </h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-5">
              Adicione o Be Fitness à sua tela inicial para acessar rapidamente sem abrir o navegador.
            </p>

            <div className="space-y-4">
              {(isIOS) && (
                <div className="rounded-xl p-4" style={{ background: 'hsl(229,20%,14%)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-semibold text-sm">iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
                    <li>Toque no ícone de <strong className="text-slate-300">compartilhar</strong> (quadrado com seta ↑) no Safari</li>
                    <li>Role e toque em <strong className="text-slate-300">"Adicionar à Tela Inicial"</strong></li>
                    <li>Confirme tocando em <strong className="text-slate-300">"Adicionar"</strong></li>
                  </ol>
                </div>
              )}

              {(isAndroid) && (
                <div className="rounded-xl p-4" style={{ background: 'hsl(229,20%,14%)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-semibold text-sm">Android (Chrome)</span>
                  </div>
                  <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
                    <li>Toque no menu <strong className="text-slate-300">⋮</strong> (três pontinhos) no Chrome</li>
                    <li>Toque em <strong className="text-slate-300">"Adicionar à tela inicial"</strong> ou <strong className="text-slate-300">"Instalar app"</strong></li>
                    <li>Confirme tocando em <strong className="text-slate-300">"Adicionar"</strong></li>
                  </ol>
                </div>
              )}

              {(!isMobile) && (
                <>
                  <div className="rounded-xl p-4" style={{ background: 'hsl(229,20%,14%)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Chrome className="w-4 h-4 text-orange-400" />
                      <span className="text-white font-semibold text-sm">Chrome (Windows / Mac)</span>
                    </div>
                    <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
                      <li>Clique no ícone de <strong className="text-slate-300">instalação</strong> (⊕) na barra de endereço</li>
                      <li>Ou acesse o menu <strong className="text-slate-300">⋮ → Salvar e compartilhar → Instalar página como app</strong></li>
                      <li>Confirme clicando em <strong className="text-slate-300">"Instalar"</strong></li>
                    </ol>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: 'hsl(229,20%,14%)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="w-4 h-4 text-orange-400" />
                      <span className="text-white font-semibold text-sm">Edge (Windows)</span>
                    </div>
                    <ol className="text-slate-400 text-sm space-y-1 list-decimal list-inside">
                      <li>Clique no menu <strong className="text-slate-300">… → Aplicativos → Instalar este site como um aplicativo</strong></li>
                      <li>Confirme clicando em <strong className="text-slate-300">"Instalar"</strong></li>
                    </ol>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}