import { AddressLookupTableAccount, Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

export const swapInstruction = async (swapData:any, userKey:string) => {
    const connection = new Connection("https://devnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395");
    const instructions = await (
        await fetch('https://quote-api.jup.ag/v6/swap-instructions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            // quoteResponse from /quote api
            swapData,
            userPublicKey: userKey,
          })
        })
      ).json();
    console.log(instructions, "instructions");
      if (instructions.error) {
        throw new Error("Failed to get swap instructions: " + instructions.error);
      }
      
      const {
        tokenLedgerInstruction, // If you are using `useTokenLedger = true`.
        computeBudgetInstructions, // The necessary instructions to setup the compute budget.
        setupInstructions, // Setup missing ATA for the users.
        swapInstruction: swapInstructionPayload, // The actual swap instruction.
        cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
        addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
      } = instructions;
      
      const deserializeInstruction = (instruction:any) => {
        return new TransactionInstruction({
          programId: new PublicKey(instruction.programId),
          keys: instruction.accounts.map((key:any) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
          data: Buffer.from(instruction.data, "base64"),
        });
      };
      
      const getAddressLookupTableAccounts = async (
        keys: string[]
      ): Promise<AddressLookupTableAccount[]> => {
        const addressLookupTableAccountInfos =
          await connection.getMultipleAccountsInfo(
            keys.map((key) => new PublicKey(key))
          );
      
        return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
          const addressLookupTableAddress = keys[index];
          if (accountInfo) {
            const addressLookupTableAccount = new AddressLookupTableAccount({
              key: new PublicKey(addressLookupTableAddress),
              state: AddressLookupTableAccount.deserialize(accountInfo.data),
            });
            acc.push(addressLookupTableAccount);
          }
      
          return acc;
        }, new Array<AddressLookupTableAccount>());
      };
      
      const addressLookupTableAccounts: AddressLookupTableAccount[] = [];
      
      addressLookupTableAccounts.push(
        ...(await getAddressLookupTableAccounts(addressLookupTableAddresses))
      );

      

      return {
        addressTable: addressLookupTableAccounts,
        instructions: [
            ...setupInstructions.map(deserializeInstruction),
           deserializeInstruction(swapInstructionPayload),
           deserializeInstruction(cleanupInstruction),
         ]
      }
      
    
}

