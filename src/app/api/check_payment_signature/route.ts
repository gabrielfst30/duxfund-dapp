import { NextRequest, NextResponse } from "next/server";
import { xumm } from "@/services/xumm/xummClient";
import { client } from "@/services/xrpl/client";
import { prismaClient } from "@/prisma";

export async function POST(req: NextRequest) {
    const { uuid } = await req.json(); //req

    try {
        // pegando o uuid do payload
        const payload = await xumm.payload.get(uuid)

        // VALIDATION 1
        // verifica se a tx foi assinada no payload, caso não tenha sido, o request não sera enviado
        if (!payload?.meta?.signed) {
            return NextResponse.json({ resolved: false })
        }

        // armazenando o id da tx caso tenha sido assinada 
        const txid = payload.response.txid

        console.log("UUID", txid);

        // VALIDATION 2
        // validando se o id da tx caso tenha sido assinada 
        if (!txid) {
            return NextResponse.json({ error: "Transação ainda não processada." })
        }

        // Conectar à XRPL se ainda não estiver
        if (!client.isConnected()) await client.connect();

        // Criando request para a XRPL
        const xrplResult = await client.request({
            command: "tx",
            transaction: txid,
        });

        const txValidated = xrplResult.result?.validated ?? false;
        if (!txValidated) {
            return NextResponse.json({ resolved: false }); // ainda aguardando ser validada na ledger
        }

        console.log("XRPL RESULT:", xrplResult)

        // Função para converter drops para XRP
        const dropsToXrp = (drops: string | number) => {
            const numDrops = typeof drops === 'string' ? parseInt(drops) : drops;
            return (numDrops / 1_000_000).toFixed(6);
        };

        // Extraindo o delivered_amount da resposta da XRPL
        let deliveredAmountInDrops = null;
        if (typeof xrplResult.result.meta === "object" && xrplResult.result.meta !== null && "delivered_amount" in xrplResult.result.meta) {
            deliveredAmountInDrops = (xrplResult.result.meta as any).delivered_amount;
        }

        // Convertendo drops para XRP antes de salvar
        const deliveredAmountInXrp = deliveredAmountInDrops ? dropsToXrp(deliveredAmountInDrops) : "0.000000";

        console.log("Delivered amount in drops:", deliveredAmountInDrops);
        console.log("Delivered amount in XRP:", deliveredAmountInXrp);

        // Pegando dados do request e salvando no banco
        const txResult = await prismaClient.payments.create({
            data: {
                hash: xrplResult.result.hash,
                ledger_index: Number(xrplResult.result.ledger_index),
                type: xrplResult.result.tx_json.TransactionType,
                account: xrplResult.result.tx_json.Account,
                delivered_amount: deliveredAmountInXrp, // Salvando em XRP
                account_destination: typeof xrplResult.result.tx_json.Destination === "string"
                    ? xrplResult.result.tx_json.Destination
                    : "",
                validated: Boolean(xrplResult.result.validated),
                result_code: "tesSUCCESS",
            }
        });

        const signedBy = payload.response.account;  // carteira do usuário

        return NextResponse.json({ resolved: true, tx: txResult, account: signedBy });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

}