import { NextRequest, NextResponse } from "next/server";
import { ReactNode } from "react";
import Image from "next/image";
import {
    Transaction,
    PublicKey,
    SystemProgram,
    Connection,
    clusterApiUrl,
    LAMPORTS_PER_SOL,
    Keypair,
    sendAndConfirmTransaction
} from "@solana/web3.js";
import {
    ACTIONS_CORS_HEADERS,
    createPostResponse,
    ActionGetResponse,
} from "@solana/actions";
import { getCompletedAction } from "../../helper";

const connection = new Connection("https://devnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395");

export async function GET(req: NextRequest) {
    let response: ActionGetResponse = {
        type: "action",
        icon: `https://i.postimg.cc/PxsYgXMp/Screenshot-2024-08-24-155147.png`,
        title: "Check Your Solana Stats",
        description: "",
        label: "Action A Label",
        links: {
            actions: [
                {
                    label: `Calculate for 0.01 SOL`,
                    href: `http://localhost:3000/api/action`, // this href will have a text input
                },
            ],
        },
    };

    return NextResponse.json(response, {
        headers: ACTIONS_CORS_HEADERS,
    });
}

// ensures cors
export const OPTIONS = GET;

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as { account: string; signature: string };

        const { searchParams } = new URL(req.url);

        const sender = new PublicKey(body.account);
        const senderaddress = sender.toBase58();

        const tx: Transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: sender,
                toPubkey: new PublicKey("6PvsTRA31mU3k6uMZ5kWqXH31CtUFpJV5t8Cv8DbZEmN"),
                lamports: LAMPORTS_PER_SOL * 0.01,
            })
        );
        tx.feePayer = sender;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const response = await fetch('http://localhost:3000/api/generateImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                wallet: senderaddress,
            }),
        });
        const data = await response.json();
        console.log(data.url);

        const payload = await createPostResponse({
            fields: {
                links: {
                    // any condition to determine the next action
                    next: getCompletedAction(data.url),
                },
                transaction: tx,
                message: `Done!`,
            },

        });

        return NextResponse.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });


    } catch (err) {
        console.log("Error in POST /api/action", err);
        let message = "An unknown error occurred";
        if (typeof err == "string") message = err;
        return new Response(message, {
            status: 400,
            headers: ACTIONS_CORS_HEADERS,
        });
    }
}
