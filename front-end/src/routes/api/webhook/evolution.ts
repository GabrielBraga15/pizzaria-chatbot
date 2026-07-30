// src/routes/api/webhook/evolution.ts
import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/lib/db';

export const Route = createFileRoute('/api/webhook/evolution')({
  // No TanStack Start, requisições HTTP brutas (como webhooks) são tratadas via handler
  loader: async () => {
    return { message: 'Webhook endpoint ready' };
  },
});

// Handler para requisições POST brutas na rota
export const POST = async ({ request }: { request: Request }) => {
  try {
    const body = await request.json();
    const { event, instance, data } = body;

    if (event === 'connection.update') {
      const state = data?.state;
      const empresaId = instance?.replace('empresa_', '');

      if (empresaId) {
        if (state === 'open') {
          const numeroConectado = data?.wwebid ? data.wwebid.split('@')[0] : null;

          await db('empresas')
            .where({ id: empresaId })
            .update({
              bot_status: 'CONNECTED',
              whatsapp_num: numeroConectado,
              updated_at: db.fn.now(),
            });
        } else if (state === 'close') {
          await db('empresas')
            .where({ id: empresaId })
            .update({
              bot_status: 'DISCONNECTED',
              updated_at: db.fn.now(),
            });
        }
      }
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro no webhook Evolution:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};