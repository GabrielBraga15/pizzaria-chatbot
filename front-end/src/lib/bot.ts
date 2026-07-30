// src/lib/bot.ts
import { createServerFn } from '@tanstack/react-start';
import { db } from '@/lib/db';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'SUA_CHAVE_EVOLUTION';

/**
 * 1. Solicita o QR Code / Pairing Code para a Evolution API
 */
// src/lib/bot.ts

export async function solicitarQrCode(nomeInstancia: string) {
  const baseUrl = process.env.EVOLUTION_API_URL; // ex: http://localhost:8080 ou URL do seu servidor
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error('Configuração da Evolution API ausente nas variáveis de ambiente.');
  }

  // Certifique-se de que a rota de conexão da Evolution está correta
  // Exemplo padrão da Evolution API v2: /instance/connect/{instance}
  const url = `${baseUrl.replace(/\/$/, '')}/instance/connect/${nomeInstancia}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey,
    },
  });

  // Captura o texto retornado antes de converter para JSON
  const responseText = await response.text();

  if (!response.ok) {
    console.error(`❌ Erro HTTP Evolution (${response.status}):`, responseText);
    throw new Error(`A Evolution API retornou status ${response.status}. Verifique se a URL e a API key estão corretas.`);
  }

  try {
    return JSON.parse(responseText);
  } catch (err) {
    console.error('❌ Resposta recebida da Evolution (não é JSON):', responseText);
    throw new Error('A Evolution API retornou uma resposta inválida (HTML em vez de JSON).');
  }
}
/**
 * 2. Verifica o status da conexão do bot no banco Postgres
 */
export const obterStatusBotFn = createServerFn({ method: 'GET' })
  .validator((data: { empresaId: number }) => data)
  .handler(async ({ data }) => {
    const { empresaId } = data;

    const empresa = await db('empresas')
      .select('bot_status', 'whatsapp_num')
      .where({ id: empresaId })
      .first();

    if (!empresa) {
      return { success: false, message: 'Empresa não encontrada.' };
    }

    return {
      success: true,
      status: empresa.bot_status || 'DISCONNECTED',
      whatsappNum: empresa.whatsapp_num || null,
    };
  });