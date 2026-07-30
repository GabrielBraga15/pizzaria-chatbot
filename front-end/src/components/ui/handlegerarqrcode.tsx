import { useState, useEffect } from 'react';
import { solicitarQrCodeFn, obterStatusBotFn } from '@/lib/bot';

export function ModalConectarBot({ empresaId }: { empresaId: number }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [carregando, setCarregando] = useState(false);

  // Função para solicitar o QR Code
  async function handleGerarQrCode() {
    setCarregando(true);
    const res = await solicitarQrCodeFn({ data: { empresaId } });
    setCarregando(false);

    if (res.success) {
      if (res.status === 'CONNECTED') {
        setStatus('CONNECTED');
      } else if (res.qrCodeBase64) {
        setQrCode(res.qrCodeBase64);
        setStatus('CONNECTING');
      }
    } else {
      alert(res.message);
    }
  }

  // Polling a cada 3 segundos enquanto estiver aguardando a leitura do QR Code
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (status === 'CONNECTING') {
      timer = setInterval(async () => {
        const res = await obterStatusBotFn({ data: { empresaId } });

        if (res.success && res.status === 'CONNECTED') {
          setStatus('CONNECTED');
          setQrCode(null);
          clearInterval(timer);
        }
      }, 3000);
    }

    return () => clearInterval(timer);
  }, [status, empresaId]);

  return (
    <div className="p-6 bg-white rounded-lg border max-w-md mx-auto text-center">
      <h3 className="text-lg font-bold mb-4">Conectar WhatsApp do Cardápio</h3>

      {status === 'DISCONNECTED' && (
        <button
          onClick={handleGerarQrCode}
          disabled={carregando}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-md transition"
        >
          {carregando ? 'Gerando QR Code...' : 'Gerar QR Code'}
        </button>
      )}

      {status === 'CONNECTING' && qrCode && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-gray-600">
            Abra o WhatsApp no celular &gt; Aparelhos Conectados &gt; Escaneie a imagem abaixo:
          </p>
          <img
            src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
            alt="QR Code WhatsApp"
            className="w-60 h-60 border p-2 rounded"
          />
          <span className="text-xs text-gray-400 animate-pulse">Aguardando leitura do celular...</span>
        </div>
      )}

      {status === 'CONNECTED' && (
        <div className="text-green-600 font-semibold p-4 bg-green-50 rounded-md">
          <p className="text-2xl mb-1">✅</p>
          <p>WhatsApp Conectado com Sucesso!</p>
          <p className="text-xs text-gray-500 mt-1">Seu atendente com IA já está respondendo os clientes.</p>
        </div>
      )}
    </div>
  );
}