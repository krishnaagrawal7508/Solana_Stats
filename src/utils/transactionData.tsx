"use server"
import { Connection, PublicKey } from '@solana/web3.js';

export const generateTransactionData = async (walletAddress: string) => {
    const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=3756ece7-8ccb-4586-bb9d-9637825f3395');
    const publicKey = new PublicKey(walletAddress);
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 1000 });

    const transactionData: Record<string, number> = {};

    // Count transactions per day
    for (const { blockTime } of signatures) {
        if (blockTime) {
            const date = new Date(blockTime * 1000).toISOString().split('T')[0];
            // Increment the count for the corresponding date
            transactionData[date] = (transactionData[date] || 0) + 1;
        }
    }

    // Ensure all days of 2024 are included, even if there are no transactions
    const startOfYear = new Date(2024, 0, 1);
    const endOfYear = new Date(2024, 11, 31);

    for (let date = startOfYear; date <= endOfYear; date.setDate(date.getDate() + 1)) {
        const formattedDate = date.toISOString().split('T')[0];
        if (!transactionData[formattedDate]) {
            transactionData[formattedDate] = 0;
        }
    }

    // Convert transactionData to the desired format
    const formattedData = Object.entries(transactionData).map(([date, count]) => ({
        [date]: count
    }));

    console.log(formattedData);
    return formattedData;
};
