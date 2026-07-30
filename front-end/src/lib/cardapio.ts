import { createServerFn } from '@tanstack/react-start';
import { db } from '@/lib/db';

export interface ItemCardapio {
  id: string | number;
  empresa_id: string | number;
  categoria: string;
  item_nome: string;
  descricao?: string | null;
  preco: number;
  disponivel: boolean;
  created_at?: string;
}

// 1. BUSCAR CARDÁPIO DA EMPRESA
export const getCardapio = createServerFn({ method: 'GET' })
  .validator((empresaId?: string | number) => empresaId ?? 1)
  .handler(async ({ data: empresaId }) => {
    try {
      const cardapio = await db<ItemCardapio>('cardapio')
        .where({ empresa_id: Number(empresaId) })
        .orderBy('categoria', 'asc')
        .orderBy('item_nome', 'asc');

      return cardapio;
    } catch (error) {
      console.error('Erro ao buscar cardápio:', error);
      throw new Error('Falha ao carregar cardápio do banco.');
    }
  });

// 2. ADICIONAR NOVO ITEM AO CARDÁPIO
export const criarItemCardapio = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      empresaId?: string | number;
      categoria: string;
      item_nome: string;
      descricao?: string;
      preco: number;
      disponivel?: boolean;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const [novoItem] = await db<ItemCardapio>('cardapio')
        .insert({
          empresa_id: Number(data.empresaId ?? 1),
          categoria: data.categoria,
          item_nome: data.item_nome,
          descricao: data.descricao || '',
          preco: data.preco,
          disponivel: data.disponivel ?? true,
        })
        .returning('*');

      return novoItem;
    } catch (error) {
      console.error('Erro ao adicionar item ao cardápio:', error);
      throw new Error('Falha ao salvar produto no banco.');
    }
  });

// 3. ATUALIZAR ITEM EXISTENTE
export const atualizarItemCardapio = createServerFn({ method: 'POST' })
  .validator(
    (data: {
      id: string | number;
      empresaId?: string | number;
      categoria: string;
      item_nome: string;
      descricao?: string;
      preco: number;
      disponivel: boolean;
    }) => data
  )
  .handler(async ({ data }) => {
    try {
      const [itemAtualizado] = await db<ItemCardapio>('cardapio')
        .where({ id: Number(data.id) })
        .update({
          categoria: data.categoria,
          item_nome: data.item_nome,
          descricao: data.descricao || '',
          preco: data.preco,
          disponivel: data.disponivel,
        })
        .returning('*');

      if (!itemAtualizado) {
        throw new Error('Item não encontrado ou sem permissão.');
      }

      return itemAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      throw new Error('Falha ao atualizar produto no banco.');
    }
  });

// 4. ALTERNAR STATUS (DISPONÍVEL / PAUSADO)
export const atualizarStatusItemCardapio = createServerFn({ method: 'POST' })
  .validator((data: { id: string | number; disponivel: boolean }) => data)
  .handler(async ({ data }) => {
    try {
      await db('cardapio')
        .where({ id: Number(data.id) })
        .update({ disponivel: data.disponivel });

      return { success: true };
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      throw new Error('Falha ao alterar status no banco.');
    }
  });

// 5. EXCLUIR ITEM DO CARDÁPIO
export const deletarItemCardapio = createServerFn({ method: 'POST' })
  .validator((data: { id: string | number }) => data)
  .handler(async ({ data }) => {
    try {
      const afetados = await db('cardapio')
        .where({ id: Number(data.id) })
        .del();

      if (afetados === 0) {
        throw new Error('Item não encontrado.');
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar item:', error);
      throw new Error('Falha ao remover item do banco.');
    }
  });