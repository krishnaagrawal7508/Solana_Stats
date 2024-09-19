import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import {
    signerIdentity,
    keypairIdentity,
    generateSigner,
    percentAmount,
    createNoopSigner,
    publicKey as UMIPublicKey,
    TransactionBuilder,
    WrappedInstruction,
    transactionBuilder
} from "@metaplex-foundation/umi"
import { createNft, findMetadataPda, mplTokenMetadata, verifyCollection, verifyCollectionV1 } from "@metaplex-foundation/mpl-token-metadata";
import { mplCore } from "@metaplex-foundation/mpl-core";
import {
    toWeb3JsInstruction,
    toWeb3JsKeypair,
} from "@metaplex-foundation/umi-web3js-adapters";
import { toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters';
import { PublicKey, Connection, Keypair, Transaction, VersionedTransaction, TransactionMessage } from "@solana/web3.js";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import bs58 from "bs58";
import { config } from 'dotenv';


config();


const RPC_ENDPOINTS = process.env.Helius_SECURE_RPC_URLs as string;
const RPC_ENDPOINT = RPC_ENDPOINTS.split(",")[0];

const UPDATE_AUTHORITY_PRIVATE_KEY = process.env.Privatekey as string;

const connection = new Connection(RPC_ENDPOINT);
const updateAuthoritySecretKey = bs58.decode(UPDATE_AUTHORITY_PRIVATE_KEY);
const updateAuthorityKeypair = Keypair.fromSecretKey(updateAuthoritySecretKey);

const umi = createUmi(connection);
const umiUpdateAuthorityKeypair = umi.eddsa.createKeypairFromSecretKey(updateAuthorityKeypair.secretKey);

umi
    .use(keypairIdentity(umiUpdateAuthorityKeypair))
    .use(mplTokenMetadata())
    .use(irysUploader());

export const nftMint = async (
    account: PublicKey,
    url: string,
    rarity: string
): Promise<VersionedTransaction> => {


    try {
        //creates a signer with the account provided by the body
        const accountPublicKey = UMIPublicKey(account);
        const accountPublicKeyWEB3 = new PublicKey(account);
        const signer = createNoopSigner(accountPublicKey);

        umi.use(signerIdentity(signer));
        umi.use(keypairIdentity(umiUpdateAuthorityKeypair));

        const blockhash = (await umi.rpc.getLatestBlockhash()).blockhash;

        //Using umi generates a mint signer
        const mint = generateSigner(umi);

        // Substitute in your collection NFT address
        const collectionNftAddress = UMIPublicKey("5a4QTUKzSrS3Dsr7aKsuMcKaUq8dGC3D3HJepq99AGRN");

        //Find an recent blockhash
        const uri = `https://score.sendarcade.fun/nft.json?url=${url}&?rarity=${rarity}`;
        const metadata = findMetadataPda(umi, {
            mint: mint.publicKey
        })

        // Create a NFT Transaction, setting the name, URI, and seller fee basis points. createNft is a method from @metaplex-foundation/mpl-token-metadata lib
        let tx: TransactionBuilder = transactionBuilder()
            .add(createNft(umi, {
                mint,
                name: "Sol Stats",
                symbol: "SolStats",
                uri,
                updateAuthority: umiUpdateAuthorityKeypair.publicKey, // Update authority keypair
                sellerFeeBasisPoints: percentAmount(0),
                collection: {
                    key: collectionNftAddress,
                    verified: false,
                },
                tokenOwner: accountPublicKey, // User will receive the NFT
                payer: signer
            }))
            .add(verifyCollectionV1(umi, {
                collectionMint: collectionNftAddress,
                metadata,
                authority: umi.identity,
            }))

        const createdNftInstructions = tx.getInstructions();
        const solanaInstructions = createdNftInstructions.map((ix) => toWeb3JsInstruction(ix));
        console.log(solanaInstructions);

        const newVersionedmessage = new TransactionMessage({
            payerKey: accountPublicKeyWEB3,
            recentBlockhash: blockhash,
            instructions: solanaInstructions,
        }).compileToV0Message();

        const newTx = new VersionedTransaction(newVersionedmessage);
        const mintKeypair = toWeb3JsKeypair(mint);
        newTx.sign([mintKeypair, updateAuthorityKeypair]);

        return newTx;

    } catch (error) {
        console.error("Error creating NFT:", error);
        throw new Error("Failed to create NFT transaction");
    }

};
