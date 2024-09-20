import { createBurnCheckedInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const burnSend = async (account:PublicKey, amount:number) => {
    const connection = new Connection("https://devnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395");
    const MINT = new PublicKey("SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa");
    const ata = await getAssociatedTokenAddress(MINT, account);
    const info = await connection.getTokenAccountBalance(ata);
    if (info.value.uiAmount == null) throw new Error('No balance found');
    const burnIx = createBurnCheckedInstruction(
        ata, // PublicKey of Owner's Associated Token Account
        MINT, // Public Key of the Token Mint Address
        account, // Public Key of Owner's Wallet
        amount, // Number of tokens to burn
        6 // Number of Decimals of the Token Mint
      );
    return burnIx;
}