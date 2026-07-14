import { useState } from 'react';
import {
  GraduationCap, Users, MessageSquare, BookOpen, BarChart3, FileText,
  Clock, ChevronDown, ChevronUp, Lightbulb, Target, ArrowRight, CheckCircle2,
  AlertTriangle, Zap, Phone, Calendar, TrendingUp, Sparkles
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'inicio',
    title: 'Primeiros Passos',
    icon: GraduationCap,
    color: 'orange',
    description: 'Entenda a filosofia do sistema e como ele funciona',
    steps: [
      { title: 'O que é o BeFitness Sales Mentor?', content: 'É uma plataforma inteligente que padroniza o atendimento comercial da academia. Você não precisa decorar respostas — o sistema sugere o que dizer com base em técnicas de venda comprovadas, no perfil do cliente e no histórico de conversas.' },
      { title: 'Sua jornada como vendedor aqui', content: 'Em vez de apenas "atender", você vira um consultor especialista. O sistema te diz qual a próxima ação de cada cliente, sugere respostas personalizadas e te alerta quando alguém está esquecido. Seu trabalho é executar com qualidade — não inventar do zero.' },
      { title: 'Fluxo diário recomendado', content: '1) Abra a aba Clientes e veja quem está "Urgente" no topo.\n2) Atenda os clientes pendentes, colando a conversa na aba Atendimento.\n3) Use a resposta sugerida pela IA no WhatsApp.\n4) Registre o resultado da conversa.\n5) No fim do dia, confira o Resumo Diário.' },
    ]
  },
  {
    id: 'clientes',
    title: 'Gerenciando Clientes',
    icon: Users,
    color: 'blue',
    description: 'Como navecar pela lista de leads e priorizar',
    steps: [
      { title: 'Indicadores de urgência', content: 'No topo da lista você vê três contadores:\n• 🔴 Urgente — clientes com próxima ação atrasada\n• 🟡 Aguardando — esperando resposta do cliente\n• 🟢 Em Dia — sem pendências\n\nSempre comece pelos Urgentes — são os que mais esfriam.' },
      { title: 'Como criar um novo lead', content: 'Clique em "Novo Cliente". Preencha pelo menos o Nome e o Telefone (o sistema bloqueia telefones duplicados). Escolha a Origem do Lead (Instagram, WhatsApp, etc.) e o Perfil (iniciante, emagrecer, melhor idade...). Quanto mais detalhes, melhor a IA pode personalizar as respostas.' },
      { title: 'Editando e excluindo', content: 'Clique no nome do cliente para abrir a página de detalhes. Lá você vê toda a jornada, histórico de interações e pode editar o status, adicionar observações ou excluir o cliente.' },
      { title: 'Status do cliente', content: 'Cada cliente passa por etapas:\nNovo Contato → Descobrindo Necessidade → Proposta Enviada → Semana Experimental → Matriculado.\nO status avança automaticamente conforme você registra os resultados das conversas.' },
    ]
  },
  {
    id: 'atendimento',
    title: 'Usando o Atendimento com IA',
    icon: MessageSquare,
    color: 'purple',
    description: 'O coração do sistema: sugestões de resposta inteligentes',
    steps: [
      { title: 'Como funciona', content: 'Quando um cliente manda uma mensagem no WhatsApp, você seleciona o cliente na aba Atendimento, cola a mensagem dele no campo de conversa e clica em "Analisar com IA". O sistema lê o contexto, consulta a biblioteca comercial e sugere a melhor resposta.' },
      { title: 'O que a IA retorna', content: 'A IA te entrega:\n• 📋 Resposta Sugerida — pronta para copiar e enviar\n• 🎯 Objetivo daquela resposta\n• 💡 Explicação do porquê essa abordagem funciona\n• 🎯 Técnica de venda utilizada (Belfort, Hormozi, Tracy...)\n• ➡️ Próximo passo recomendado\n\nCopie a resposta com um clique, envie no WhatsApp e registre o resultado.' },
      { title: 'Registrando o resultado', content: 'Após enviar a mensagem, marque o resultado: Respondeu, Marcou Visita, Iniciou Trial, Matriculou, Não Respondeu ou Desistiu. O sistema atualiza automaticamente o status e a próxima ação do cliente.\n\nSe marcou visita, o sistema pede a data para agendar no calendário.' },
      { title: 'Avanço automático de jornada', content: 'Quando a IA detecta pela conversa que o cliente está pronto para avançar (ex: aceitou o trial), ela te sugere o novo status com um botão "Atualizar Jornada". Um clique e pronto.' },
    ]
  },
  {
    id: 'biblioteca',
    title: 'Biblioteca Comercial',
    icon: BookOpen,
    color: 'emerald',
    description: 'Base de conhecimento que alimenta a IA',
    steps: [
      { title: 'O que é a Biblioteca', content: 'É a base de conhecimento do sistema: perguntas frequentes, objeções comuns, respostas padrão e técnicas de venda. A IA consulta essa biblioteca para sugerir respostas alinhadas com a abordagem da academia.' },
      { title: 'Como pesquisar', content: 'Use a barra de busca para encontrar rapidamente como responder a uma dúvida específica (preço, horário, estacionamento, etc.). As categorias organizam os temas: Objeções, Informações da Academia, Técnicas de Fechamento, etc.' },
      { title: 'Quando consultar', content: 'A biblioteca é seu material de estudo. Leia nas horas vagas para dominar a abordagem. Em atendimento real, prefira usar a IA — ela já consulta a biblioteca automaticamente e personaliza a resposta para o cliente.' },
    ]
  },
  {
    id: 'indicadores',
    title: 'Indicadores e Relatórios',
    icon: BarChart3,
    color: 'amber',
    description: 'Acompanhe seu desempenho e resultados',
    steps: [
      { title: 'Página de Indicadores', content: 'Mostra sua performance: quantos clientes em cada status, taxa de conversão, resultados das interações por semana, distribuição por vendedor e por origem de lead. Use para entender onde está acertando e onde pode melhorar.' },
      { title: 'Resumo Diário', content: 'No fim do dia, confira o Resumo Diário: quantos atendimentos você fez, quais resultados, quem ainda está pendente. É seu checklist de fechamento do dia.' },
      { title: 'Relatório Mensal', content: 'Visão consolidada do mês: matrículas, conversões, leads esfriando e desempenho por vendedor. Útil para reuniões e planejamento.' },
    ]
  },
  {
    id: 'tecnicas',
    title: 'Técnicas de Venda',
    icon: Zap,
    color: 'rose',
    description: 'Os princípios que guiam todas as respostas sugeridas',
    steps: [
      { title: 'Transparência imediata de preços', content: 'Nunca faça o cliente "pedir o preço". Apresente os planos (parcelado e à vista) assim que ele demonstrar interesse. Destaque o desconto do pagamento à vista como argumento de fechamento.' },
      { title: 'Fechamento por Alternativa', content: 'Em vez de perguntas abertas como "o que acha?", ofereça sempre duas opções: "Prefere treinar de manhã ou à noite?" ou "Podemos agendar sua semana experimental terça ou quinta?" — isso conduz o cliente à decisão.' },
      { title: 'Fechamento Pressuposto', content: 'Presuma que a venda vai acontecer: "Quando você quiser começar, já deixo seu cadastro preparado" em vez de "Você quer fazer a matrícula?".' },
      { title: 'Loss Aversion (aversão à perda)', content: 'Enquadre o trial como algo que o cliente está perdendo a cada dia sem aproveitar: "Sua semana experimental já está liberada — a cada dia sem treinar é um dia que você perde do benefício grátis".' },
      { title: 'Puppy Dog Close', content: 'Para leads esfriados: ofereça algo de valor gratuito sem compromisso ("Que tal um dia experimental sem custo nenhum?"). O cliente experimenta e fica mais fácil converter.' },
      { title: 'Grand Slam Offer', content: 'Para leads perdidos há muito tempo: volte com uma oferta irresistível e temporária que cria urgência real de retorno.' },
    ]
  },
  {
    id: 'erros',
    title: 'Erros Comuns a Evitar',
    icon: AlertTriangle,
    color: 'red',
    description: 'O que NÃO fazer no atendimento',
    steps: [
      { title: 'Não use perguntas abertas', content: '❌ "O que você acha?"\n❌ "Quer pensar e me avisa?"\n✅ "Prefere o plano trimestral ou o semestral?"\n✅ "Posso te agendar para terça ou quinta?"' },
      { title: 'Não deixe o lead esfriar', content: 'Se um cliente não responde, não espere dias. O sistema marca como "Urgente" quando a próxima ação vence. Retorne no dia indicado — leads esfriados convertem muito menos.' },
      { title: 'Não mencione visitas passadas com leads novos', content: 'A IA detecta automaticamente se é um Lead ou um Ex-Aluno. Não diga "como foi sua visita?" para alguém que nunca veio. Confie na IA — ela ajusta a mensagem ao contexto.' },
      { title: 'Não esqueça de registrar o resultado', content: 'Sempre marque o resultado após enviar a mensagem. Sem o registro, o sistema não atualiza a jornada nem agenda a próxima ação — e o cliente some da sua lista de prioridades.' },
    ]
  },
];

const COLOR_MAP = {
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-500' },
  red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' },
};

export default function Tutorial() {
  const [openSection, setOpenSection] = useState('inicio');
  const [openStep, setOpenStep] = useState(0);

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id);
    setOpenStep(0);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tutorial do Sistema</h1>
            <p className="text-sm text-muted-foreground">Guia completo para novos vendedores</p>
          </div>
        </div>
        <p className="text-muted-foreground mt-3 leading-relaxed">
          Bem-vindo! Este tutorial vai te ensinar tudo o que precisa para atender com excelência —
          desde o primeiro contato até a matrícula. Leia na ordem ou salte direto para o que precisa.
        </p>
      </div>

      {/* Quick Start Banner */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-1">Comece aqui: Fluxo do dia</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Abra <strong className="text-foreground">Clientes</strong> e atenda os <span className="text-red-400 font-medium">Urgentes</span> primeiro</li>
              <li>Cole a conversa no <strong className="text-foreground">Atendimento</strong> e use a resposta da IA</li>
              <li>Registre o resultado de cada conversa</li>
              <li>Confira o <strong className="text-foreground">Resumo Diário</strong> no fim do dia</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Sections Accordion */}
      <div className="space-y-3">
        {SECTIONS.map((section, sIdx) => {
          const colors = COLOR_MAP[section.color];
          const isOpen = openSection === section.id;
          const Icon = section.icon;

          return (
            <div
              key={section.id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isOpen ? `${colors.border} ${colors.bg}` : 'border-border bg-card'
              }`}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-4 p-4 lg:p-5 text-left hover:bg-white/5 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${colors.text}`}>{String(sIdx + 1).padStart(2, '0')}</span>
                    <h3 className="font-semibold text-foreground truncate">{section.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{section.description}</p>
                </div>
                {isOpen
                  ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
              </button>

              {/* Section Content */}
              {isOpen && (
                <div className="px-4 lg:px-5 pb-5 space-y-3">
                  {section.steps.map((step, stepIdx) => {
                    const isStepOpen = openStep === stepIdx;
                    return (
                      <div key={stepIdx} className="rounded-xl bg-background/50 border border-border overflow-hidden">
                        <button
                          onClick={() => setOpenStep(isStepOpen ? -1 : stepIdx)}
                          className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-white/5 transition-colors"
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            isStepOpen ? `${colors.bg} ${colors.text}` : 'bg-muted text-muted-foreground'
                          }`}>
                            {stepIdx + 1}
                          </div>
                          <span className="flex-1 text-sm font-medium text-foreground">{step.title}</span>
                          {isStepOpen
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        </button>
                        {isStepOpen && (
                          <div className="px-3.5 pb-4 pt-1">
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pl-10">
                              {step.content}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Tips */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-card border border-border p-4">
          <Lightbulb className="w-5 h-5 text-orange-400 mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Dica de Ouro</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            A IA é sua assistente, não seu substituto. Use as respostas sugeridas como base e adapte o tom se necessário — mas mantenha a estrutura de fechamento.
          </p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <Target className="w-5 h-5 text-blue-400 mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Foco Principal</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Levar o cliente à semana experimental. O trial é o melhor caminho para a matrícula — sempre que possível, direcione a conversa para agendar a visita.
          </p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">Sucesso</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Registrar TODA interação no sistema. Sem registro, o sistema não consegue acompanhar a jornada nem te avisar os próximos passos.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Precisa de ajuda? Revise este tutorial ou consulte a Biblioteca Comercial para respostas específicas.
        </p>
      </div>
    </div>
  );
}