'use client';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';

const TransactionsHeatmap: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [numberOfTxns, setNumberOfTxns] = useState<number | null>(null);
  const [maxTransactions, setMaxTransactions] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/generateImage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet: '52nCnLjs2ArzLyWDe97F9DgkjUiAUi6mseaLMqbWr1Ng',
          }), // Replace with actual wallet address
        });

        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }

        const data = await response.json();
        setImageUrl(data.url);
        setNumberOfTxns(data.number_of_txns);
        setMaxTransactions(data.max_transactions);
      } catch (err) {
        setError('Error fetching image. Please try again.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, []);

  return (
    <div className='bg-[#1D5DFE] h-screen w-full'>
      <div className='w-[500px] mx-auto'>
        <h1 className='text-2xl font-bold mb-4 text-white'>Solana Stats</h1>
        {loading && <p className='text-white'>Loading...</p>}
        {error && <p className='text-red-500'>{error}</p>}
        {imageUrl && (
          <div>
            <Image
              src={imageUrl}
              width={2000}
              height={2000}
              alt='Transactions Heatmap'
              className='w-full rounded-lg'
            />
            <p className='text-white mt-2'>
              Number of Transactions: {numberOfTxns}
            </p>
            <p className='text-white'>Max Transactions: {maxTransactions}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsHeatmap;
