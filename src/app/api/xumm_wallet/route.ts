// src/app/api/xumm_wallet/route.ts

import { xumm } from '@/services/xumm/xummClient';
import { NextResponse, NextRequest } from 'next/server';
import { XummSdk } from 'xumm-sdk';

/**
 * POST /api/xumm_wallet
 * ---------------------
 * - Cria um payload de SignIn na primeira requisição (sem `uuid` no body).
 * - Retorna url (deep‐link/QR) e `uuid` para o cliente abrir a XUMM Wallet.
 * - Se receber `{ uuid }` no body, faz polling do status desse payload:
 *    • retorna `{ resolved: false }` enquanto pendente
 *    • retorna `{ resolved: true, account }` quando aprovado
 */
export async function POST(request: NextRequest) {
  // 1) Validar as chaves secretas no ambiente
  const apiKey = process.env.XUMM_API_KEY;
  const apiSecret = process.env.XUMM_API_SECRET;
  if (!apiKey || !apiSecret) {
    // Se faltar qualquer variável, retorna erro 500 com mensagem clara
    return NextResponse.json(
      { error: 'XUMM_API_KEY and XUMM_API_SECRET must be set' },
      { status: 500 }
    );
  }

  // 2) Req Body
  const { uuid } = (await request.json().catch(() => ({}))) as {
    uuid?: string;
  };

  // 3) Se vier `uuid`, executa a verificação do status da conexão do payload
  if (uuid) {
    // 4.a) Buscar o payload existente pelo UUID
    const payload = await xumm.payload.get(uuid);

    // 4.b) Se payload não existir, retornar 404
    if (!payload) {
      return NextResponse.json(
        { error: 'Payload not found' },
        { status: 404 }
      );
    }

    // 4.c) Retornar o estado atual do payload
    // Se a conexão for aprovada pego o response da conexão
    return NextResponse.json({
      uuid,
      resolved: payload.meta.resolved,
      // Se aprovado, incluir o endereço da carteira
      ...(payload.meta.resolved && { account: payload.response.account }),
    });
  }

  // 5) Caso não venha UUID: criar um novo payload de SignIn
  const created = await xumm.payload.create(
    { txjson: { TransactionType: 'SignIn' } },
    true // `true` garante retorno de `next.always` (deep‐link / QR)
  );

  // 5.a) Em caso de falha na criação, retornar erro 500
  if (!created) {
    return NextResponse.json(
      { error: 'Failed to create XUMM payload' },
      { status: 500 }
    );
  }

  // 6) Retornar dados iniciais para o cliente
  return NextResponse.json({
    uuid: created.uuid,        // Identificador do payload (para polling)
    connectUrl: created.next.always, // URL/QR para abrir a XUMM Wallet
    resolved: false,               // Estado inicial: não aprovado
  });
}
