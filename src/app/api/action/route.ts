import { NextRequest, NextResponse } from 'next/server';
import {
  Transaction,
  PublicKey,
  SystemProgram,
  Connection,
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
import { statics } from '@/app/statics';
import { stat } from 'fs';

config();

const secureRpcUrl = process.env.Helius_SECURE_RPC_URLs as string;
const connection = new Connection(secureRpcUrl.split(',')[0]);

//entry to blink
export async function GET(req: NextRequest) {
  const data = new URL(req.url);
  const { searchParams } = new URL(req.url);
  const referralAccount = searchParams.get('ref') as string;
  //set metaData
  let response: ActionGetResponse = {
    type: 'action',
    icon: statics.icon,
    title: statics.title,
    description: statics.description,
    label: 'Action A Label',
    links: {
      actions: [
        {
          label: statics.label,
          href: `${process.env.URL}/api/action?ref=${referralAccount}`,
        },
      ],
    },
  };

  //point to POST
  return NextResponse.json(response, {
    headers: ACTIONS_CORS_HEADERS,
  });
}

// ensures cors
export const OPTIONS = GET;

//get user transaction data first, then mint NFT second time
export async function POST(req: NextRequest) {
  try {
    //get the pubkey of user
    const body = (await req.json()) as { account: string; signature: string };

    if (!body.account) {
      return new Response('Account not provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }
    const senderaddress = body.account;
    const sender = new PublicKey(senderaddress);

    //get image (for NFT) url and referrer if any
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('Url') as string;
    const rarity = searchParams.get('Rarity') as string;
    const referralAccount = searchParams.get('ref') as string;
    console.log(referralAccount);

    //if url exists then mint NFT
    if (url != null) {
      const check = url.substring(0, 50);
      console.log(url, 'check');
      if (check === 'https://res.cloudinary.com/dwcdwoua9/image/upload/') {
        const tx = await nftMint(sender, url, rarity, referralAccount);

        const payload = await createPostResponse({
          fields: {
            links: {
              next: getCompletedAction(url),
            },
            transaction: tx,
            message: `Done!`,
          },
        });

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

    //if no URL, fetch user's transactions and show user the Image
    const response = await fetch(`${process.env.URL}/api/generateImage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: senderaddress,
        ref: referralAccount,
      }),
    });
    const data = await response.json();
    //if referral account exists, send 0.001 SOL to that account otherwise we make monies
    const tx: Transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sender,
        toPubkey: new PublicKey('6PvsTRA31mU3k6uMZ5kWqXH31CtUFpJV5t8Cv8DbZEmN'),
        lamports: LAMPORTS_PER_SOL * 0.00001,
      })
    );

    tx.feePayer = sender;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const payload = await createPostResponse({
      fields: {
        links: {
          next: getNextAction(
            data.url,
            data.maxStreak,
            data.maxTransactions,
            data.userLevel,
            data.number_of_txns,
            data.walletAddress,
            data.userSolanaScore,
            referralAccount
          ),
        },
        transaction: tx,
        message: `Done!`,
      },
    });

    //returns response to allow user to mint NFT
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
