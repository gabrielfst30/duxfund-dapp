import { NextResponse } from "next/server";
import { client } from "@/services/xrpl/client"
import { xrpToDrops } from "xrpl";
import { Wallet } from "xrpl";
import { prismaClient } from "@/prisma";


export async function POST() {

    await client.connect()

    /**--------------TRANSACIONANDO ENTRE DUAS WALLETS--------------**/

    //Criando uma user wallet com fundos
    const createUserWallet = await client.fundWallet()
    console.log("USER:", createUserWallet)

    //Criando uma dux wallet zerada
    const createDuxWallet: Wallet = Wallet.generate()
    console.log("DUX:", createDuxWallet)

    //Pegando propriedades da wallet
    const userWallet = createUserWallet.wallet; //acessando wallet
    const duxWallet = createDuxWallet; //dux wallet

    //Preparando transação
    const preparedTransaction = await client.autofill({
        "TransactionType": "Payment",
        "Account": userWallet.classicAddress, //remetente
        "Amount": xrpToDrops("9"), //1000000 drops = 1 xrp
        "Destination": duxWallet.classicAddress
    })

    //Assinando tx com carteira do remetente
    const signed = userWallet.sign(preparedTransaction)

    //Enviando tx com assinatura
    const txResult = await client.submitAndWait(signed.tx_blob);


    /**--------------MINTANDO NFT--------------**/

    //1. Pegando o hash da transação para usar no NFT
    const txHash = txResult.result.tx_json.hash as string || txResult.result.hash as string


    //2. Codificando o hash em hexadecimal para o campo URI
    function stringToHex(uri: string) {
        return Buffer.from(uri, 'utf8').toString('hex');
    }

    const uriHex = stringToHex(txHash);


    //Mintando NFT
    const mintNFT = await client.autofill({
        "TransactionType": "NFTokenMint",
        "Account": userWallet.classicAddress, //remetente
        "NFTokenTaxon": 0, // obrigatório, pode ser 0
        "URI": uriHex //identidade do NFT
    })

    //Assinando o NFT com a carteira do remetente
    const signerMint = userWallet.sign(mintNFT)
    const mintResult = await client.submitAndWait(signerMint.tx_blob);

    console.log(txResult)


    //Sempre desconectar após operações
    client.disconnect()

    // 1) Cria a transação
    const transaction = await prismaClient.payments.create({
        data: {
            hash: txResult.result.hash,
            ledger_index: Number(txResult.result.ledger_index),
            type: txResult.result.tx_json.TransactionType,
            account: txResult.result.tx_json.Account,
            delivered_amount: typeof txResult.result.meta === "object" && txResult.result.meta !== null && "delivered_amount" in txResult.result.meta
                ? (txResult.result.meta as any).delivered_amount
                : null,
            account_destination: typeof txResult.result.tx_json.Destination === "string"
                ? txResult.result.tx_json.Destination
                : "",
            validated: Boolean(txResult.result.validated),
            result_code: "tesSUCCESS",
        }
    });

    // 2) Cria o NFT relacionado à transação
    const nft = await prismaClient.nftMints.create({
        data: {
            nft_hash: String(mintResult.result.tx_json.NFTokenID),
            tx_hash: mintResult.result.hash,
            payment_hash: transaction.hash,
            type: mintResult.result.tx_json.TransactionType,
            uri: uriHex,
            taxon: Number(mintResult.result.tx_json.NFTokenTaxon),
           
            
        },
    });

    return NextResponse.json({
        transaction,
        nft
    }, { status: 200 });
}