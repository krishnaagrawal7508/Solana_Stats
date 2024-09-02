"use server"
import { Connection, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';

export const generateTransactionData = async (walletAddress: string) => {
    console.time("Data Fetch and Processing Time"); // Start timing
    const connection = new Connection('https://wispy-skilled-diamond.solana-mainnet.quiknode.pro/675c3e2fdf7c3d5426619c95a25c5521d408a6b7');
    const publicKey = new PublicKey(walletAddress);

    const startOfYear = new Date(2024, 0, 1).getTime() / 1000;
    const endOfYear = new Date(2024, 11, 31, 23, 59, 59).getTime() / 1000;

    let fetchedTransactions = await connection.getSignaturesForAddress(publicKey, { limit: 1000 });
    let signatures: ConfirmedSignatureInfo[] = [];

    // Filter transactions within the year 2024
    while (fetchedTransactions.length > 0) {
        const filtered = fetchedTransactions.filter(({ blockTime }) => {
            return blockTime && blockTime >= startOfYear && blockTime <= endOfYear;
        });
        signatures.push(...filtered);

        if (fetchedTransactions.length < 1000) break;

        const lastSignature = fetchedTransactions[fetchedTransactions.length - 1].signature;
        fetchedTransactions = await connection.getSignaturesForAddress(publicKey, { before: lastSignature, limit: 1000 });
    }

    const transactionData: Record<string, number> = {};

    let total_transactions = signatures.length;

    // Count transactions per day
    for (const { blockTime } of signatures) {
        if (blockTime) {
            const date = new Date(blockTime * 1000).toISOString().split('T')[0];
            transactionData[date] = (transactionData[date] || 0) + 1;
        }
    }

    // Ensure all days of 2024 are included, even if there are no transactions
    const filteredTransactionData: Record<string, number> = {};

    for (const [date, count] of Object.entries(transactionData)) {
        const transactionDate = new Date(date);
        if (transactionDate >= new Date(2024, 0, 1) && transactionDate <= new Date(2024, 11, 31)) {
            filteredTransactionData[date] = count as number;
        }
    }

    // Ensure that all dates within the range are accounted for, filling missing dates with 0
    for (let date = new Date(2024, 0, 1); date <= new Date(2024, 11, 31); date.setDate(date.getDate() + 1)) {
        const formattedDate = date.toISOString().split('T')[0];
        if (!filteredTransactionData[formattedDate]) {
            filteredTransactionData[formattedDate] = 0;
        }
    }

    // Convert filteredTransactionData to the desired format
    const formattedData = Object.entries(filteredTransactionData).map(([date, count]) => ({
        [date]: count
    }));
    console.timeEnd("Data Fetch and Processing Time");
    console.dir(formattedData, { depth: null, colors: true, maxArrayLength: null });
    console.log(formattedData.length);

    return [formattedData, total_transactions];
};
