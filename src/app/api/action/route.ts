import { NextRequest, NextResponse } from "next/server";
import {
  Transaction,
  PublicKey,
  SystemProgram,
  Connection,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
} from "@solana/actions";
import { nftMint } from "@/utils/mintNFT";
import { getCompletedAction, getNextAction } from "../../helper";
import { config } from "dotenv";
import { statics } from "@/app/statics";
import { stat } from "fs";
// import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';

config();

// const connection = new Connection(
//   "https://devnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395"
// );
const secureRpcUrl = process.env.Helius_SECURE_RPC_URLs as string;
const connection = new Connection(secureRpcUrl.split(",")[0]);
// const connection = new Connection(secureRpcUrl);
// const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395");

//entry to blink
export async function GET(req: NextRequest) {
  const data = new URL(req.url);
  //set metaData
  let response: ActionGetResponse = {
    type: "action",
    icon: statics.icon,
    title: statics.title,
    description: statics.description,
    label: "Action A Label",
    links: {
      actions: [
        {
          label: statics.label,
          // href: "http://localhost:3000/api/action",
          // Alternative using env variable
          href: `${process.env.URL}/api/action`,
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
      return new Response("Account not provided", {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }
    const senderaddress = body.account;
    const sender = new PublicKey(senderaddress);

    //get image (for NFT) url and referrer if any
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("Url") as string;
    const referralAccount = searchParams.get("ref");

    //if url exists then mint NFT
    if (url != null) {
      const check = url.substring(0, 50);
      console.log(url, "check");
      if (check === "https://res.cloudinary.com/dy075nvxm/image/upload/") {

        const tx = await nftMint(sender, url);
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
        return new Response("An error occured", {
          status: 400,
          headers: ACTIONS_CORS_HEADERS,
        });
      }
    }

    //if no URL, fetch user's transactions and show user the Image
    const response = await fetch(`${process.env.URL}/api/generateImage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
        toPubkey: referralAccount
          ? new PublicKey(referralAccount)
          : new PublicKey("6PvsTRA31mU3k6uMZ5kWqXH31CtUFpJV5t8Cv8DbZEmN"),
        lamports: LAMPORTS_PER_SOL * 0.001,
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
            data.memo_count
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
    console.log("Error in POST /api/action", err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
}
