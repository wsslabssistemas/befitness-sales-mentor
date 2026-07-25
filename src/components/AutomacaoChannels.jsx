import { useState } from 'react';
import { MessageCircle, Facebook, Zap, Clock, ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';

export default function AutomacaoChannels() {
  const [copied, setCopied] = useState(false);
  const verifyToken = 'befitness_verify_2024';
  // URL do webhook é a URL da função backend
  const webhookUrl = 'https://api.base44.com/functions/whatsappWebhook';

  const copyToken = () => {
    navigator.clipboard.writeText(verifyToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-5 h-5 text-orange-400" />
        <h2 className="font-semibold text-foreground">Canais de Automação</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        O sistema opera em modo híbrido: atendimento manual (recepcionista) + automação por canal. Cada canal tem regras próprias de segurança anti-bloqueio.
      </p>

      {/* Proativas */}
      <ChannelCard
        icon={Zap}
        color="orange"
        title="Mensagens Proativas"
        subtitle="Nós iniciamos o contato com o cliente"
        rules={[
          'Dispara quando a "próxima ação" do cliente vence (data passada).',
          'Respeita janela de horário (9h–19h, fuso SP) — nunca manda fora do expediente.',
          'Cooldown de 24h (sem resposta) ou 48h (após o cliente responder).',
          'Para de incomodar após 3 não-respostas consecutivas.',
          'Limite diário de mensagens + orçamento mensal em créditos.',
          'Modos: Desligado / Simulação (só revisa) / Automático (envia).',
        ]}
      />

      {/* Facebook */}
      <ChannelCard
        icon={Facebook}
        color="blue"
        title="Auto-resposta Facebook (DM)"
        subtitle="Responde mensagens recebidas na Página do Facebook"
        rules={[
          'Roda a cada 30 minutos (workflow agendado).',
          'SÓ responde fora do horário comercial (após 19h/antes das 9h) — no expediente a recepcionista assume.',
          'Lê conversas não lidas das últimas 24h (janela do Meta).',
          'Dedup: não responde 2x a mesma conversa (checa últimas 12h).',
          'Cria o cliente no CRM com origem "Facebook" se for novo.',
          'Respeita limite diário + orçamento mensal (compartilhado com proativas).',
        ]}
        status="Ativo"
      />

      {/* WhatsApp */}
      <ChannelCard
        icon={MessageCircle}
        color="emerald"
        title="WhatsApp (Webhook Cloud API)"
        subtitle="Responde em tempo real mensagens recebidas no WhatsApp"
        rules={[
          'Webhook recebe a mensagem do cliente em tempo real (Meta → nossa API).',
          'Responde imediatamente, 24h/dia — cliente iniciou o contato, então não há bloqueio.',
          'Usa a mesma IA e biblioteca comercial das proativas.',
          'Cria o cliente no CRM se for novo (origem "WhatsApp").',
          'Dedup: ignora reenvios do Meta em até 2 min.',
          'Fora da janela de 24h do Meta, é necessário template aprovado (follow-ups de trial).',
        ]}
        status="Em configuração"
      />

      {/* Setup WhatsApp */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-foreground">Como ativar o WhatsApp</h3>
        </div>
        <ol className="space-y-2.5 text-sm text-muted-foreground list-decimal list-inside">
          <li>
            Acesse{' '}
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-1">
              Meta for Developers <ExternalLink className="w-3 h-3" />
            </a>{' '}
            e crie um app do tipo <b className="text-foreground">Business</b> → adicione o produto <b className="text-foreground">WhatsApp</b>.
          </li>
          <li>Em <b className="text-foreground">API Setup</b>, gere um <b className="text-foreground">token de acesso permanente</b> e copie o <b className="text-foreground">Phone Number ID</b>.</li>
          <li>Em <b className="text-foreground">App Settings → Basic</b>, copie o <b className="text-foreground">App Secret</b>.</li>
          <li>
            Defina os 4 secrets no painel (Configurações → Variáveis de Ambiente):{' '}
            <code className="text-orange-400 bg-secondary px-1.5 py-0.5 rounded text-xs">WHATSAPP_TOKEN</code>,{' '}
            <code className="text-orange-400 bg-secondary px-1.5 py-0.5 rounded text-xs">WHATSAPP_PHONE_NUMBER_ID</code>,{' '}
            <code className="text-orange-400 bg-secondary px-1.5 py-0.5 rounded text-xs">WHATSAPP_APP_SECRET</code> e{' '}
            <code className="text-orange-400 bg-secondary px-1.5 py-0.5 rounded text-xs">WHATSAPP_VERIFY_TOKEN</code>.
          </li>
          <li>
            Em <b className="text-foreground">Configuration → Webhook</b>, cadastre a URL abaixo com o Verify Token e inscreva em <b className="text-foreground">messages</b>:
          </li>
        </ol>

        <div className="mt-3 space-y-2">
          <div className="bg-secondary/50 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Callback URL do webhook:</p>
            <code className="text-xs text-emerald-400 break-all">{webhookUrl}</code>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 border border-border flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Verify Token (copie este valor):</p>
              <code className="text-xs text-orange-400 break-all">{verifyToken}</code>
            </div>
            <button onClick={copyToken} className="flex-shrink-0 p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          ⚠️ O número precisa estar verificado e o template de mensagens fora da janela de 24h deve ser aprovado pela Meta. Os follow-ups de trial (dias 2/6/8) usarão templates aprovados.
        </p>
      </div>
    </div>
  );
}

const COLORS = {
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

function ChannelCard({ icon: Icon, color, title, subtitle, rules, status }) {
  const c = COLORS[color] || COLORS.orange;
  return (
    <div className={`bg-card rounded-xl border ${c.border} p-5`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {status && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.bg} ${c.text} border ${c.border}`}>
                {status}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {rules.map((r, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text', 'bg')} mt-1.5 flex-shrink-0`} style={{ backgroundColor: 'currentColor' }} />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}