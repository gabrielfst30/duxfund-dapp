// src/app/api/create-mint-payload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { xumm } from "@/services/xumm/xummClient";

export async function POST(req: NextRequest) {
  try {
    const { account, txHash } = await req.json();

    // validação dos parametros da req
    if (!account || !txHash) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    // transforma hash da tx em URI hex
    const uriHex = Buffer.from(txHash, "utf8").toString("hex").toUpperCase();

    // cria payload para o usuário assinar o mint
    const mintPayload = await xumm.payload.create({
      TransactionType: "NFTokenMint",
      Account: account,
      Flags: 8, // tfTransferable
      NFTokenTaxon: 0,
      URI: uriHex,
    });

    // valida se veio tudo certo
    if (!mintPayload?.uuid || !mintPayload?.next?.always) {
      throw new Error("Falha ao gerar payload de mint.");
    }

    return NextResponse.json({
      mintUuid: mintPayload.uuid,
      mintNext: mintPayload.next.always,
    });

  } catch (error: any) {
    console.error("Erro ao criar payload do NFT:", error.message);
    return NextResponse.json(
      { error: "Erro ao criar payload do NFT: " + error.message },
      { status: 500 }
    );
  }
}
