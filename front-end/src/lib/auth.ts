import { createServerFn } from '@tanstack/react-start';
import { db } from '@/lib/db';

export interface EmpresaUsuario {
  id: string | number;
  nomeEmpresa: string;
  email: string;
  telefone: string;
  telefoneComercial: string;
  pix: string;
  statusAssinatura: 'active' | 'canceled';
  proximaCobranca: string;
  criadoEm: string;
}

export const getUsuarioLogado = createServerFn({ method: 'GET' })
  .validator((empresaId?: string | number) => empresaId ?? 1)
  .handler(async ({ data: empresaId }) => {
    try {
      const idNumerico = Number(empresaId) || 1;

      const usuario = await db('empresas')
        .where({ id: idNumerico })
        .first();

      if (!usuario) {
        return null;
      }

      return {
        id: usuario.id,
        nomeEmpresa: usuario.nome_empresa || usuario.nomeEmpresa || 'Minha Empresa',
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        telefoneComercial: usuario.telefone_comercial || usuario.telefoneComercial || '',
        pix: usuario.pix || '',
        statusAssinatura: usuario.status_assinatura || usuario.statusAssinatura || 'active',
        proximaCobranca: usuario.proxima_cobranca || usuario.proximaCobranca || new Date().toISOString(),
        criadoEm: usuario.criado_em || usuario.criadoEm || new Date().toISOString(),
      } as EmpresaUsuario;
    } catch (error) {
      console.error('Erro interno no servidor ao buscar usuário:', error);
      return null;
    }
  });

export const AUTH_KEY = 'empresa_id';

/**
 * Salva a sessão do usuário no localStorage
 */
export function markSignedIn(empresaId: string | number = 1) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, String(empresaId));
  }
}

/**
 * Remove a sessão do usuário
 */
export function markSignedOut() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}

/**
 * Verifica se existe uma sessão ativa no client
 */
export function isSignedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(AUTH_KEY));
}

/**
 * Registra localmente os dados da conta cadastrada
 */
export function registerAccount(dados: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dados_empresa', JSON.stringify(dados));
  }
}