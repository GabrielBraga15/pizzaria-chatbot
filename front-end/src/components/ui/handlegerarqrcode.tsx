import { useState, useEffect, useRef } from 'react';
import { solicitarQrCodeFn, obterStatusBotFn } from '@/lib/bot';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  QrCode,
  CheckCircle2,
  Loader2,
  Smartphone,
  WifiOff,
  RefreshCw,
  LogOut,
} from 'lucide-react';

export function ModalConectarBot({ empresaId }: { empresaId: number }) {
  const [open, setOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [carregando, setCarregando] = useState(false);

  // Ref para controlar o interval sem problemas de closure no React
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const limparIntervalo = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Função isolada de checagem de status
  async function checarStatus() {
    if (!empresaId) return;

    try {
      const res = await obterStatusBotFn({ data: { empresaId } });

      if (res.success) {
        const statusAtual = res.status?.toUpperCase();

        if (statusAtual === 'CONNECTED') {
          setStatus('CONNECTED');
          setQrCode(null); // Apaga o QR Code do estado imediatamente
          limparIntervalo(); // Para de fazer polling assim que conecta!
        } else if (statusAtual === 'CONNECTING') {
          setStatus('CONNECTING');
        } else {
          // Desconectado (close / logout)
          setStatus((prev) => {
            if (prev === 'CONNECTED') toast.warning('A sessão do WhatsApp foi encerrada.');
            return 'DISCONNECTED';
          });
          setQrCode(null);
        }
      } else {
        setStatus('DISCONNECTED');
        setQrCode(null);
      }
    } catch {
      setStatus('DISCONNECTED');
      setQrCode(null);
    }
  }

  // Efeito principal: Checa status ao abrir e inicia polling APENAS se não estiver conectado
  useEffect(() => {
    if (open) {
      checarStatus();

      // Só mantém o polling ativo se estiver no processo de conexão ou se o modal estiver aberto
      intervalRef.current = setInterval(() => {
        checarStatus();
      }, 3000);
    } else {
      limparIntervalo();
    }

    return () => limparIntervalo();
  }, [open, empresaId]);

  // Solicita um novo QR Code
  async function handleGerarQrCode() {
    try {
      setCarregando(true);
      setQrCode(null);

      const res = await solicitarQrCodeFn({ data: { empresaId } });

      if (res.success) {
        if (res.status === 'CONNECTED') {
          setStatus('CONNECTED');
          setQrCode(null);
          limparIntervalo();
          toast.success('WhatsApp já está conectado!');
        } else if (res.qrCodeBase64) {
          setQrCode(res.qrCodeBase64);
          setStatus('CONNECTING');
          toast.info('QR Code gerado com sucesso!');
        } else {
          setStatus('CONNECTING');
        }
      } else {
        toast.error(res.message || 'Erro ao gerar QR Code.');
      }
    } catch {
      toast.error('Erro de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="relative border-border/60 bg-card/70 hover:bg-card hover:border-border transition-all"
        >
          <QrCode className="mr-2 h-4 w-4 text-primary" />
          Conectar WhatsApp
          {status === 'CONNECTED' && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary" />
              Conexão do WhatsApp
            </DialogTitle>

            <Badge
              variant={status === 'CONNECTED' ? 'default' : 'outline'}
              className={
                status === 'CONNECTED'
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : status === 'CONNECTING'
                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/30 animate-pulse'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }
            >
              {status === 'CONNECTED' && 'Online'}
              {status === 'CONNECTING' && 'Aguardando Leitura'}
              {status === 'DISCONNECTED' && 'Desconectado'}
            </Badge>
          </div>

          <DialogDescription className="text-xs text-muted-foreground">
            Gerencie a conexão da inteligência artificial ao seu número de WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex flex-col items-center justify-center space-y-4">
          {/* ESTADO 1: DESCONECTADO */}
          {status === 'DISCONNECTED' && (
            <Card className="flex w-full flex-col items-center justify-center border-dashed border-border/80 bg-background/50 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                <WifiOff className="h-6 w-6" />
              </div>
              <h4 className="mt-3 font-semibold text-sm">WhatsApp Desconectado</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-70">
                A sessão está inativa. Clique no botão abaixo para gerar um novo QR Code.
              </p>
              <Button
                onClick={handleGerarQrCode}
                disabled={carregando}
                className="mt-5 bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90 w-full sm:w-auto"
              >
                {carregando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" /> Gerar QR Code
                  </>
                )}
              </Button>
            </Card>
          )}

          {/* ESTADO 2: AGUARDANDO LEITURA DO QR CODE */}
          {status === 'CONNECTING' && (
            <div className="flex flex-col items-center gap-4 text-center w-full">
              {qrCode ? (
                <div className="rounded-xl border border-border/60 bg-white p-3 shadow-md">
                  <img
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    className="h-56 w-56 object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-56 w-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-background/50 p-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Aguardando imagem do QR Code...</p>
                </div>
              )}

              <div className="space-y-1.5 px-4">
                <p className="text-xs font-medium text-foreground">
                  1. Abra o WhatsApp &gt; <b>Aparelhos Conectados</b>
                </p>
                <p className="text-xs text-muted-foreground">
                  2. Escaneie o código acima para reconectar o robô.
                </p>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleGerarQrCode}
                disabled={carregando}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Atualizar QR Code
              </Button>
            </div>
          )}

          {/* ESTADO 3: CONECTADO */}
          {status === 'CONNECTED' && (
            <Card className="flex w-full flex-col items-center justify-center border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h4 className="mt-3 font-semibold text-base text-foreground">WhatsApp Conectado!</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-70">
                A Inteligência Artificial está online e pronta para responder mensagens.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}