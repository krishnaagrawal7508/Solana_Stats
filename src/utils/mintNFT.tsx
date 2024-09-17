import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createSignerFromKeypair, signerIdentity, generateSigner, percentAmount, createNoopSigner, publicKey, Instruction, KeypairSigner } from "@metaplex-foundation/umi"
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
    toWeb3JsInstruction,
    toWeb3JsKeypair,
} from "@metaplex-foundation/umi-web3js-adapters";
import { PublicKey, TransactionInstruction, TransactionMessage, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { config } from 'dotenv';

config();


const RPC_ENDPOINT = process.env.Helius_SECURE_RPC_URL as string;
const umi = createUmi(RPC_ENDPOINT)
    .use(mplCore())
    .use(mplTokenMetadata())
    .use(irysUploader());;

export const nftMint = async (
    account: PublicKey,
    url: string
): Promise<VersionedTransaction> => {


    try {
        const collectionMintAddress = new PublicKey("CHB5wmbLjzdpTSLtjTEggRpgY1cVpD2pvr15FYHGa3Ni");
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
            collection: {
                verified: false, // This will be verified in the next step
                key: publicKey(collectionMintAddress), // Collection mint address
            },
        });


        const createdNftInstructions: Instruction[] = tx.getInstructions();
        const solanaInstructions: TransactionInstruction[] =
            createdNftInstructions.map((ix) => toWeb3JsInstruction(ix));
        const newVersionedmessage: VersionedMessage = new TransactionMessage({
            payerKey: accountPublicKey,
            recentBlockhash: blockhash,
            instructions: solanaInstructions,
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
