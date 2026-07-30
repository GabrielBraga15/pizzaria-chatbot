import { createServerFn } from '@tanstack/react-start';
import { db } from '@/lib/db';

export interface EmpresaUsuario {
  id: number;
  nome_empresa: string;
  email: string;
  telefone: string;
  telefone_comercial: string;
  pix: string;
  created_at: string;
}

export const loginFn = createServerFn({ method: 'POST' })
  .validator((data: { email: string; senha: string }) => data)
  .handler(async ({ data }) => {
    try {
      const { email, senha } = data;

      // Busca a empresa pelo e-mail
      const empresa = await db<EmpresaUsuario & { senha: string }>('empresas')
        .where({ email: email.trim() })
        .first();

      if (!empresa) {
        return { success: false, message: 'Email ou senha incorretos.' };
      }

      // Valida a senha
      if (empresa.senha !== senha) {
        return { success: false, message: 'Email ou senha incorretos.' };
      }

      // Oculta a senha antes de retornar os dados
      const { senha: _, ...empresaSemSenha } = empresa;

      return {
        success: true,
        empresa: empresaSemSenha,
      };
    } catch (error: any) {
      console.error('Erro de banco de dados na loginFn:', error);
      return {
        success: false,
        message: 'Não foi possível conectar ao banco de dados. Verifique a conexão com o container.',
      };
    }
  });