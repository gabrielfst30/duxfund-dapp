import { xumm } from "@/services/xumm/xummClient";
import { NextResponse, NextRequest } from "next/server";
import { XummSdk } from 'xumm-sdk';
import { XummGetPayloadResponse, XummJsonTransaction, XummPostPayloadResponse } from "xumm-sdk/dist/src/types";


export async function POST(req: NextRequest) {

    // Entrada de dados da req
    const { amount } = await req.json();

    // Request de pagamento
    const txjson: XummJsonTransaction = {
        TransactionType: 'Payment',
        Destination: String(process.env.DUX_WALLET), // carteira da DUX
        Amount: String(Math.floor(Number(amount) * 1_000_000)), // XRP para drops
    };

    // Enviando requisição
    const createdPayload = await xumm.payload.createAndSubscribe(
        txjson,
        async event => { // escutando a requisição
            if (event.data.signed) {
                // pegando o uuid quando a assinatura for concluída
                const uuid = event.data.payload_uuidv4;

                // pegando o payload/response completo com verificação de null
                const payloadDetails = await xumm.payload.get(uuid);

                if (!payloadDetails) {
                    console.log("Payload sem retorno")
                    return;
                }

                // pegando a tx pela xumm
                const txid = payloadDetails.response.txid;

                // verificando se a transação foi gerada
                if (!txid) {
                    throw new Error("TxID não encontrado no payload");
                }

                // pegando a conta que assinou
                const signedBy = payloadDetails.response.account;

                return {
                    uuid,
                    txid,
                    signedBy,
                };

            }
        }
    );

    // response
    return NextResponse.json({
        uuid: createdPayload.created.uuid, // uuid do payload/request
        next: createdPayload.created.next.always, // deep link ou QR
    });
}