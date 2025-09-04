// src/app/api/check-mint-signature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { xumm } from "@/services/xumm/xummClient";
import { client } from "@/services/xrpl/client";
import { prismaClient } from "@/prisma";

export async function POST(req: NextRequest) {
  const { mintUuid, paymentHash } = await req.json();

  console.log("mintUuid:", mintUuid);
  console.log("paymentHash:", paymentHash);

  const payload = await xumm.payload.get(mintUuid);

  //Verificando se o nft foi assinado pelo usuário
  if (!payload?.meta?.signed) {
    return NextResponse.json({ resolved: false });
  }

  // pegando id do mint
  const mintTxId = payload.response.txid;

  // validação se o mint ja foi processado
  if (!mintTxId) {
    return NextResponse.json({ error: "Mint ainda não processado." });
  }

  // conecta à XRPL se necessário
  if (!client.isConnected()) await client.connect();

  // busca os dados da transação
  const xrplResult = await client.request({
    command: "tx",
    transaction: mintTxId,
  });


  console.log(xrplResult)


  const txValidated = xrplResult.result.validated;
  if (!txValidated) {
    return NextResponse.json({ resolved: false });
  }

  const tx = xrplResult.result;
  const meta = tx.meta as any;

  const nftID = meta.nftoken_id;
  console.log("------NFTOKENID= ", nftID)
  const URIHex = tx.tx_json.URI || tx.tx_json?.URI || null;
  const account = tx.tx_json.Account || tx.tx_json.Account;

  // Verificando se o NFToken Id existe
  if (!nftID) {
    return NextResponse.json({ error: "NFTokenID não encontrado." }, { status: 500 });
  }

  //Verificando se o URI e a Account existem
  if (!URIHex || !account) {
    return NextResponse.json({ error: "Não foi possível extrair dados do NFT." }, { status: 500 });
  }

  // Verificar se a transação existe antes de criar o NFT
  const existingTransaction = await prismaClient.payments.findUnique({
    where: { hash: paymentHash }
  });

  if (!existingTransaction) {
    return NextResponse.json({ error: "Transação de pagamento não encontrada, não é possível gerar o NFT." }, { status: 500 });
  }

  const savedNFT = await prismaClient.nftMints.create({
    data: {
      nft_hash: nftID,
      tx_hash: mintTxId,
      payment_hash: paymentHash,
      type: "NFTokenMint",
      uri: String(URIHex),
      taxon: 0,
    },
  });

  console.log(savedNFT)

  return NextResponse.json({ resolved: true, savedNFT });
}
