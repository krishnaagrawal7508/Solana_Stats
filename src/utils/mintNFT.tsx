import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  signerIdentity,
  generateSigner,
  percentAmount,
  createNoopSigner,
  publicKey,
  Instruction,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  toWeb3JsInstruction,
  toWeb3JsKeypair,
} from "@metaplex-foundation/umi-web3js-adapters";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { config } from "dotenv";
import { swapFunds } from "./swapData";

config();

const RPC_ENDPOINTS = process.env.Helius_SECURE_RPC_URLs as string;
const RPC_ENDPOINT = RPC_ENDPOINTS.split(",")[0];
const umi = createUmi(RPC_ENDPOINT)
  .use(mplCore())
  .use(mplTokenMetadata())
  .use(irysUploader());

export const nftMint = async (
  account: PublicKey,
  url: string,
  referralAccount: string | null
): Promise<VersionedTransaction> => {
  try {
    //creates a signer with the account provided by the body
    const accountPublicKey = new PublicKey(account);
    const signer = createNoopSigner(publicKey(accountPublicKey));
    //Using umi generates a mint signer
    const mint = generateSigner(umi);

    // Since we need a payer to create the nft, this instruction gives the payer identity to the account in the body
    umi.use(signerIdentity(signer));

    //Find an recent blockhash
    const blockhash = (await umi.rpc.getLatestBlockhash()).blockhash;

    // Create a NFT Transaction, setting the name, URI, and seller fee basis points. createNft is a method from @metaplex-foundation/mpl-token-metadata lib
    let tx = createNft(umi, {
      mint,
      payer: signer,
      name: "Solana Stats",
      uri: url, //metadata provided by the uploadMetadata in nft_metadata
      sellerFeeBasisPoints: percentAmount(10),
    });


    //if ref, pay them 40% of the fees
    const refIx = SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: referralAccount
        ? new PublicKey(referralAccount)
        : new PublicKey("6PvsTRA31mU3k6uMZ5kWqXH31CtUFpJV5t8Cv8DbZEmN"),
      lamports: LAMPORTS_PER_SOL * 0.069 * 0.04,
    });

    //get swap quote to swap 10% of 0.069 SOL to SEND
    const swapData = await swapFunds(0.069 * 0.1, 50);


    //write ix to swap 10% of 0.069 SOL to SEND and then burn SEND 
    const swapInstructions = await fetch(`${process.env.URL}/api/swap-instructions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
    
        body: JSON.stringify({
          swapData,
          key: account.toBase58(),
        }),
      });
      const swapTransaction = await swapInstructions.json();
    
      //have to now write instructions to burn SEND

    //pay the rest 50% to the fees account
    const feesIx = SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: new PublicKey("6PvsTRA31mU3k6uMZ5kWqXH31CtUFpJV5t8Cv8DbZEmN"),
      lamports: LAMPORTS_PER_SOL * 0.069 * 0.05,
    });

    const createdNftInstructions: Instruction[] = tx.getInstructions();
    const solanaInstructions: TransactionInstruction[] =
      createdNftInstructions.map((ix) => toWeb3JsInstruction(ix));
    const allInstructions = [...solanaInstructions, refIx, feesIx];
    const newVersionedmessage: VersionedMessage = new TransactionMessage({
      payerKey: accountPublicKey,
      recentBlockhash: blockhash,
      instructions: allInstructions,
    }).compileToV0Message();

    const newTx = new VersionedTransaction(newVersionedmessage);
    const mintKeypair = toWeb3JsKeypair(mint);
    newTx.sign([mintKeypair]);

    return newTx;
  } catch (error) {
    console.error("Error creating NFT:", error);
    throw new Error("Failed to create NFT transaction");
  }
};
