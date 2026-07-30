import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import jwt from 'jsonwebtoken';

export const getMe = createServerFn({ method: 'GET' }).handler(async () => {
  // Pega o objeto da requisição HTTP atual
  const request = getRequest();
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Valida o JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta') as {
      id: string;
      nome: string;
      email: string;
    };

    // Aqui você pode buscar no banco de dados se preferir, ou retornar direto do token
    return {
      id: decoded.id,
      nome: decoded.nome,
      email: decoded.email,
    };
  } catch (error) {
    throw new Error('UNAUTHORIZED');
  }
});