import { NextRequest, NextResponse } from 'next/server';
import { ReactNode } from 'react';
import Image from 'next/image';
import {
  Transaction,
  PublicKey,
  SystemProgram,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
} from '@solana/actions';
import { nftMint } from '@/utils/mintNFT';
import { getCompletedAction, getNextAction } from '../../helper';
import { config } from 'dotenv';
// import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';

config();

// const connection = new Connection("https://devnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395");
const secureRpcUrl = process.env.Helius_SECURE_RPC_URL as string;
const connection = new Connection(secureRpcUrl);
// const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395");

export async function GET(req: NextRequest) {
  let response: ActionGetResponse = {
    type: 'action',
    icon: `https://i.postimg.cc/CxNfSWrc/cover.png`,
    title: 'View Your Solana Score and Mint an Exclusive NFT!',
    description:
      'Generate a graph of your Solana activity and mint a NFT based on your daily transactions. Show the world your degen side!',
    label: 'Action A Label',
    links: {
      actions: [
        {
          label: `Check Solana Score`,
          // href: `http://localhost:3000/api/action`, // this href will have a text input
          href: `${process.env.URL}/api/action`, // this href will have a text input
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

    const sender = new PublicKey(body.account);
    const senderaddress = sender.toBase58();

    const { searchParams } = new URL(req.url);
    const url = searchParams.get('Url') as string;

    if (url != null) {
      const check = url.substring(0, 50);
      if (check === 'https://res.cloudinary.com/dy075nvxm/image/upload/') {

        // const Metadata = {
        //   name: `Solana Stats ${1}`,
        //   symbol: "SOLSTATS",
        //   description: "Flex your ion cahin activities",
        //   image: url
        // }

        const tx = await nftMint(sender, url);

        const payload = await createPostResponse({
          fields: {
            links: {
              // any condition to determine the next action
              next: getCompletedAction(url),
            },
            transaction: tx,
            message: `Done!`,
          },
        })

        return NextResponse.json(payload, {
          headers: ACTIONS_CORS_HEADERS,
        });

      } else {
        return new Response('An error occured', {
          status: 400,
          headers: ACTIONS_CORS_HEADERS,
        });
      }
    }

    const tx: Transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: new PublicKey('6PvsTRA31mU3k6uMZ5kWqXH31CtUFpJV5t8Cv8DbZEmN'),
        lamports: LAMPORTS_PER_SOL * 0.001,
      })
    );
    tx.feePayer = sender;

    const response = await fetch(`${process.env.URL}/api/generateImage`, {
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
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const payload = await createPostResponse({
      fields: {
        links: {
          // any condition to determine the next action
          next: getNextAction(data.url, data.maxStreak, data.maxTransactions, data.memo_count),
        },
        transaction: tx,
        message: `Done!`,
      },
    });

    return NextResponse.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log('Error in POST /api/action', err);
    let message = 'An unknown error occurred';
    if (typeof err == 'string') message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
}
