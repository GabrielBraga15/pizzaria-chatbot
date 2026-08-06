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
      const response = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          apikey: EVOLUTION_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // CRUCIAL: Impede cache da requisição
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`❌ Erro Evolution API (${response.status}):`, responseText);
        return {
          success: false,
          message: `A Evolution API retornou status ${response.status}. Verifique se a instância existe.`,
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

      // Se a instância já estiver conectada/aberta
      if (resData.instance?.state === 'open') {
        await db('empresas')
          .where({ id: empresaId })
          .update({ bot_status: 'CONNECTED' });

        return { success: true, status: 'CONNECTED' };
      }

      // Se retornou imagem/base64 do QR Code ou código
      if (resData.base64 || resData.code) {
        await db('empresas')
          .where({ id: empresaId })
          .update({ bot_status: 'CONNECTING' });

        return {
          success: true,
          status: 'CONNECTING',
          qrCodeBase64: resData.base64 || resData.code,
          pairingCode: resData.pairingCode || null,
        };
      }

      return { success: false, message: 'Não foi possível gerar o QR Code no momento.' };
    } catch (error) {
      console.error('❌ Erro na ServerFn solicitarQrCodeFn:', error);
      return { success: false, message: 'Erro de comunicação no servidor do WhatsApp.' };
    }
  });

/**
 * 2. Verifica o status REAL da conexão direto na Evolution API + Sincroniza o Postgres
 */
export const obterStatusBotFn = createServerFn({ method: 'GET' })
  .validator((data: { empresaId: number }) => data)
  .handler(async ({ data }) => {
    const { empresaId } = data;
    const instanceName = `empresa_${empresaId}`;

    try {
      // Checa o estado REAL na Evolution API
      const response = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          apikey: EVOLUTION_KEY,
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // CRUCIAL: Consulta status em tempo real sem cache
      });

      if (!response.ok) {
        // Se a instância não existir ou der erro, marca como DISCONNECTED no banco
        await db('empresas').where({ id: empresaId }).update({ bot_status: 'DISCONNECTED' });
        return { success: true, status: 'DISCONNECTED' };
      }

      const resData = await response.json();
      const state = resData?.instance?.state || resData?.state;

      let statusFormatado: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' = 'DISCONNECTED';

      if (state === 'open') {
        statusFormatado = 'CONNECTED';
      } else if (state === 'connecting') {
        statusFormatado = 'CONNECTING';
      } else {
        statusFormatado = 'DISCONNECTED';
      }

      // Sincroniza o banco com o estado verdadeiro da Evolution
      await db('empresas')
        .where({ id: empresaId })
        .update({ bot_status: statusFormatado });

      const empresa = await db('empresas')
        .select('whatsapp_num')
        .where({ id: empresaId })
        .first();

      return {
        success: true,
        status: statusFormatado,
        whatsappNum: empresa?.whatsapp_num || null,
      };
    } catch (error) {
      console.error('❌ Erro ao consultar status na Evolution API:', error);

      // Em caso de falha de rede/API offline, assume deslogado
      await db('empresas').where({ id: empresaId }).update({ bot_status: 'DISCONNECTED' });

      return {
        success: true,
        status: 'DISCONNECTED',
      };
    }
  });

/**
 * 3. Desconecta / Encerra a sessão na Evolution API
 */
export const desconectarBotFn = createServerFn({ method: 'POST' })
  .validator((data: { empresaId: number }) => data)
  .handler(async ({ data }) => {
    const { empresaId } = data;
    const instanceName = `empresa_${empresaId}`;

    try {
      await fetch(`${EVOLUTION_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          apikey: EVOLUTION_KEY,
        },
      });

      await db('empresas')
        .where({ id: empresaId })
        .update({ bot_status: 'DISCONNECTED' });

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao desconectar bot:', error);
      return { success: false, message: 'Erro ao encerrar sessão na Evolution API.' };
    }
  });