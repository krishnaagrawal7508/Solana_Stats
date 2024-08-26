"use server"
import { Connection, PublicKey, ConfirmedSignatureInfo, clusterApiUrl } from '@solana/web3.js';

export const generateTransactionData = async (walletAddress: string) => {
    // const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395');
    // const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=5335ab3f-9c1d-413b-ab8b-da4069b18971');
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const publicKey = new PublicKey(walletAddress);

    let fetchedTransactions = await connection.getSignaturesForAddress(publicKey, { limit: 1000 });
    let signatures: ConfirmedSignatureInfo[] = fetchedTransactions;
    // signatures.push(fetchedTransactions);

    while (fetchedTransactions.length === 1000) {
        const lastSignature = fetchedTransactions[fetchedTransactions.length - 1].signature;
        fetchedTransactions = await connection.getSignaturesForAddress(publicKey, { before: lastSignature, limit: 1000 });
        signatures.push(...fetchedTransactions);
    }


    const transactionData: Record<string, number> = {};

    let total_transactions = signatures.length;
    // Count transactions per day
    for (const { blockTime } of signatures) {
        if (blockTime) {
            const date = new Date(blockTime * 1000).toISOString().split('T')[0];
            // Increment the count for the corresponding date
            transactionData[date] = (transactionData[date] || 0) + 1;
        }
    }

    // Ensure all days of 2024 are included, even if there are no transactions
    const startOfYear = new Date(2024, 0, 2);
    const endOfYear = new Date(2024, 9, 2);

    const filteredTransactionData: Record<string, number> = {};

    for (const [date, count] of Object.entries(transactionData)) {
        const transactionDate = new Date(date);
        if (transactionDate >= startOfYear && transactionDate <= endOfYear) {
            filteredTransactionData[date] = count as number;
        }
    }

    // Ensure that all dates within the range are accounted for, filling missing dates with 0
    for (let date = new Date(startOfYear); date <= endOfYear; date.setDate(date.getDate() + 1)) {
        const formattedDate = date.toISOString().split('T')[0];
        if (!filteredTransactionData[formattedDate]) {
            filteredTransactionData[formattedDate] = 0;
        }
    }

    // Convert filteredTransactionData to the desired format
    const formattedData = Object.entries(filteredTransactionData).map(([date, count]) => ({
        [date]: count
    }));
    // console.log(formattedData);
    console.dir(formattedData, {depth: null, colors: true, maxArrayLength: null});;
    console.log(formattedData.length);
    return [formattedData, total_transactions];
};
