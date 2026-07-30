// src/lib/cadastro.ts
import { createServerFn } from '@tanstack/react-start';
import { db } from '@/lib/db';

export const cadastrarEmpresaFn = createServerFn({ method: 'POST' })
  .validator((data: any) => data)
  .handler(async ({ data }) => {
    // Lógica do banco...
    const { nomeEmpresa, email, senha, telefone, telefoneComercial, pix, cardapio } = data;

    const resultado = await db.transaction(async (tx) => {
      const [empresa] = await tx('empresas')
        .insert({
          nome_empresa: nomeEmpresa,
          email,
          senha,
          telefone,
          telefone_comercial: telefoneComercial,
          pix,
        })
        .returning('*');

      if (cardapio && cardapio.length > 0) {
        const itensFormatados = cardapio.map((item: any) => ({
          empresa_id: empresa.id,
          categoria: item.categoria,
          item_nome: item.item_nome,
          descricao: item.descricao || '',
          preco: item.preco,
          disponivel: item.disponivel ?? true,
        }));

        await tx('cardapio').insert(itensFormatados);
      }

      return empresa;
    });

    return { success: true, empresaId: resultado.id };
  });