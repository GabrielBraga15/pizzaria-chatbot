// src/lib/bot.ts
import { createServerFn } from '@tanstack/react-start';
import { db } from '@/lib/db';

const EVOLUTION_URL = (process.env.EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'SUA_CHAVE_EVOLUTION';

/**
 * 1. Solicita o QR Code / Pairing Code para a Evolution API
 */
export const solicitarQrCodeFn = createServerFn({ method: 'POST' })
  .validator((data: { empresaId: number }) => data)
  .handler(async ({ data }) => {
    const { empresaId } = data;
    const instanceName = `empresa_${empresaId}`;

    try {
      // 1. Tenta buscar o QR Code na Evolution API
      const response = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          apikey: EVOLUTION_KEY,
          'Content-Type': 'application/json',
        },
      });

      // Captura o texto bruto primeiro para tratar eventuais retornos HTML
      const responseText = await response.text();

      if (!response.ok) {
        console.error(`❌ Erro Evolution API (${response.status}):`, responseText);
        return {
          success: false,
          message: `A Evolution API retornou status ${response.status}. Verifique as chaves e a instância.`,
        };
      }

      let resData;
      try {
        resData = JSON.parse(responseText);
      } catch (e) {
        console.error('❌ Resposta inválida da Evolution API (não-JSON):', responseText);
        return {
          success: false,
          message: 'Resposta inválida recebida da Evolution API.',
        };
      }

      // Se retornou imagem/base64 do QR Code ou código
      if (resData.base64 || resData.code) {
        return {
          success: true,
          status: 'CONNECTING',
          qrCodeBase64: resData.base64 || resData.code,
          pairingCode: resData.pairingCode || null,
        };
      }

      // Se a instância já estiver aberta/conectada
      if (resData.instance?.state === 'open') {
        await db('empresas')
          .where({ id: empresaId })
          .update({ bot_status: 'CONNECTED' });

        return { success: true, status: 'CONNECTED' };
      }

      return { success: false, message: 'Não foi possível gerar o QR Code no momento.' };
    } catch (error) {
      console.error('❌ Erro na ServerFn solicitarQrCodeFn:', error);
      return { success: false, message: 'Erro de comunicação no servidor do WhatsApp.' };
    }
  });

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