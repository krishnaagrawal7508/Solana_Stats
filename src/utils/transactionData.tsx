import { Connection, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { config } from 'dotenv';

export const generateTransactionData = async (walletAddress: string) => {
  console.time('Data Fetch and Processing Time');
  config();
  const secureRpcUrl = process.env.Helius_SECURE_RPC_URL as string;
  const connection = new Connection(secureRpcUrl);
  const publicKey = new PublicKey(walletAddress);

  const startOfYear = new Date(2024, 0, 1).getTime() / 1000;
  const endOfYear = new Date(2024, 11, 31, 23, 59, 59).getTime() / 1000;

  const fetchTransactions = async (
    beforeSignature?: string
  ): Promise<ConfirmedSignatureInfo[]> => {
    return connection.getSignaturesForAddress(publicKey, {
      before: beforeSignature,
      limit: 1000,
    });
  };

  let allSignatures: ConfirmedSignatureInfo[] = [];
  let fetchedTransactions = await fetchTransactions();

  while (fetchedTransactions.length > 0) {
    const filtered = fetchedTransactions.filter(
      ({ blockTime }) =>
        blockTime && blockTime >= startOfYear && blockTime <= endOfYear
    );
    allSignatures.push(...filtered);

    if (fetchedTransactions.length < 1000) break;

    const lastSignature =
      fetchedTransactions[fetchedTransactions.length - 1].signature;

    fetchedTransactions = await fetchTransactions(lastSignature);
  }

  const transactionData: Record<string, number> = {};

  let total_transactions = allSignatures.length;

  for (const { blockTime } of allSignatures) {
    if (blockTime) {
      const date = new Date(blockTime * 1000).toISOString().split('T')[0];
      transactionData[date] = (transactionData[date] || 0) + 1;
    }
  }

  const filteredTransactionData: Record<string, number> = {};

  for (const [date, count] of Object.entries(transactionData)) {
    const transactionDate = new Date(date);
    if (
      transactionDate >= new Date(2024, 0, 1) &&
      transactionDate <= new Date(2024, 11, 31)
    ) {
      filteredTransactionData[date] = count as number;
    }
  }

  for (
    let date = new Date(2024, 0, 1);
    date <= new Date(2024, 11, 31);
    date.setDate(date.getDate() + 1)
  ) {
    const formattedDate = date.toISOString().split('T')[0];
    if (!filteredTransactionData[formattedDate]) {
      filteredTransactionData[formattedDate] = 0;
    }
  }

  const formattedData = Object.entries(filteredTransactionData).map(
    ([date, count]) => ({
      [date]: count,
    })
  );

  console.dir(formattedData, {
    depth: null,
    colors: true,
    maxArrayLength: null,
  });
  console.log(formattedData.length);

  console.timeEnd('Data Fetch and Processing Time');

  return [formattedData, total_transactions];
};
