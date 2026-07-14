import {
  Info, Code2, Shield, Zap, Users, MessageSquare, BookOpen,
  BarChart3, CheckCircle2, Mail, Globe, Cpu, Lock, Heart
} from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Gestão de Leads', desc: 'Centralize e priorize clientes por urgência com indicadores visuais em tempo real.' },
  { icon: MessageSquare, title: 'Atendimento com IA', desc: 'Respostas sugeridas baseadas em técnicas de venda comprovadas e no contexto de cada conversa.' },
  { icon: BookOpen, title: 'Biblioteca Comercial', desc: 'Base de conhecimento estruturada que alimenta a IA com a abordagem correta da academia.' },
  { icon: BarChart3, title: 'Indicadores e Relatórios', desc: 'Acompanhe conversão, desempenho por vendedor e relatórios diários e mensais.' },
  { icon: Zap, title: 'Jornada Automatizada', desc: 'Alertas de trial, retenção e reativação de leads perdidos em ciclos programados.' },
  { icon: Cpu, title: 'Detecção de Avanço', desc: 'A IA identifica quando o cliente está pronto para avançar e sugere a próxima etapa.' },
];

const TECH_DETAILS = [
  { icon: Lock, label: 'Segurança', value: 'Dados criptografados e protegidos por autenticação OAuth2' },
  { icon: Shield, label: 'Conformidade', value: 'Aderente à LGPD para tratamento de dados de clientes' },
  { icon: Zap, label: 'Performance', value: 'Sincronização em tempo real via WebSocket' },
  { icon: Globe, label: 'Acessibilidade', value: 'PWA instalável em qualquer dispositivo, online ou offline' },
];

export default function About() {
  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/10 via-card to-purple-500/5 border border-border p-8 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Info className="w-7 h-7 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">WSS Sales Mentor</h1>
              <p className="text-sm text-muted-foreground">Plataforma inteligente de atendimento comercial</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            O WSS Sales Mentor padroniza o atendimento comercial da sua academia, sugerindo respostas
            baseadas em técnicas de venda consultiva e na biblioteca de conhecimento do negócio.
            Transforma recepcionistas em consultores especialistas — sem depender de treinamento manual.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-xs font-medium text-orange-400">
              Versão 1.0
            </span>
            <span className="px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground">
              IA Generativa
            </span>
            <span className="px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground">
              PWA
            </span>
          </div>
        </div>
      </div>

      {/* Fabricante */}
      <div className="rounded-2xl bg-card border border-border p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Code2 className="w-7 h-7 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fabricado por</p>
            <h2 className="text-xl font-bold text-foreground mb-2">WSS Labs</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              A WSS Labs é uma empresa de desenvolvimento de sistemas que cria soluções inteligentes
              para empresas. Especializada em automação comercial, inteligência artificial aplicada
              e plataformas de gestão, a WSS Labs transforma processos manuais em sistemas que pensam.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 border border-border rounded-lg px-3 py-1.5">
                <Mail className="w-3.5 h-3.5" /> contato@wsslabs.com.br
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 border border-border rounded-lg px-3 py-1.5">
                <Globe className="w-3.5 h-3.5" /> www.wsslabs.com.br
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Funcionalidades */}
      <h3 className="text-lg font-semibold text-foreground mb-4">Principais Funcionalidades</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="rounded-xl bg-card border border-border p-5 hover:border-orange-500/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">{f.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalhes técnicos */}
      <h3 className="text-lg font-semibold text-foreground mb-4">Detalhes Técnicos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {TECH_DETAILS.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-card border border-border p-4">
              <Icon className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className="text-sm text-foreground font-medium">{t.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sobre o projeto */}
      <div className="rounded-2xl bg-card border border-border p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Sobre o Projeto</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          O WSS Sales Mentor nasceu da necessidade de padronizar o atendimento comercial em academias
          onde o sucesso das vendas dependia excessivamente do talento individual de cada recepcionista.
          Ao combinar inteligência artificial com técnicas de venda validadas (Belfort, Hormozi, Tracy),
          o sistema coloca o conhecimento de um vendedor experiente à disposição de toda a equipe —
          sugerindo a melhor resposta no momento certo, acompanhando a jornada de cada lead e
          garantindo que nenhum cliente seja esquecido.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Desenvolvido com tecnologia Base44 — backend, IA e infraestrutura escalável.</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-2 border-t border-border">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
          WSS Sales Mentor <span className="text-border">•</span> Feito com <Heart className="w-3.5 h-3.5 text-orange-400 inline" /> pela WSS Labs
        </p>
        <p className="text-xs text-muted-foreground mt-1">© 2026 WSS Labs. Todos os direitos reservados.</p>
      </div>
    </div>
  );
}