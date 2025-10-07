import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "@/prisma";

export async function GET() {
    const allNfts = await prismaClient.nftMints.findMany({
        orderBy: {
            created_at: "desc"
        },
        select: {
            id: true,
            tx_hash: true,
            nft_hash: true,
            payment_hash: true,
            type: true,
            uri: true,
            taxon: true,
            created_at: true,
            // Incluindo dados da tabela payment através da relação
            payments: {
                select: {
                    delivered_amount: true,
                    // outros campos que você precisar da tabela payment
                }
            }
        }
    })

    if (!allNfts) {
        return NextResponse.json({ error: "Não existe NFTs registrados" }, { status: 500 });
    }

    return NextResponse.json(allNfts)
}