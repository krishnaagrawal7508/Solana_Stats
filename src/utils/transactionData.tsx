import { Connection, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { config } from 'dotenv';

export const generateTransactionData = async (walletAddress: string) => {
  console.time('Data Fetch and Processing Time');
  config();

  const heliusRpcUrls = (process.env.Helius_SECURE_RPC_URLs as string).split(
    ','
  );

  //round robin between multiple RPC URLs
  let urlIndex = 0;
  const getRpcUrl = () => {
    const rpcUrl = heliusRpcUrls[urlIndex];
    urlIndex = (urlIndex + 1) % heliusRpcUrls.length;
    return rpcUrl;
  };

  const publicKey = new PublicKey(walletAddress);
  const startOfYear = new Date(2024, 0, 1).getTime() / 1000;
  const endOfYear = new Date(2024, 11, 31, 23, 59, 59).getTime() / 1000;

  const url = process.env.specialAPI as string;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ "parameters": { "wallet": `${walletAddress}` } }),
  });
  const result = await response.json();
  const dataArray: {
    block_date: string;
    wallet: string;
    number_of_times_signer: number;
    successful_txns: number;
    fee_paid_sol: number;
  }[] = result.query_result.data.rows;

  let total_transactions = 0;

  const filteredTransactionData = dataArray.reduce((acc, item) => {
    acc[`${item.block_date}`] = item.successful_txns;
    total_transactions += item.successful_txns;
    return acc;
  }, {} as Record<string, number>);

  console.log(filteredTransactionData);

  let maxStreak = 0;
  let maxTransactions = 0;
  let currStreak = 0;

  for (
    let date = new Date(2024, 0, 1);
    date <= new Date(2024, 11, 31);
    date.setDate(date.getDate() + 1)
  ) {
    const formattedDate = date.toISOString().split('T')[0];
    if (!filteredTransactionData[formattedDate]) {
      filteredTransactionData[formattedDate] = 0;
      currStreak = 0;
    } else {
      ++currStreak;
      if (maxStreak < currStreak) {
        maxStreak = currStreak;
      }
      if (maxTransactions < filteredTransactionData[formattedDate]) {
        maxTransactions = filteredTransactionData[formattedDate];
      }
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

  return [formattedData, total_transactions, maxStreak, maxTransactions];
};
