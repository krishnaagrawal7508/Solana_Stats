import { NextActionLink } from '@solana/actions-spec';

export const getNextAction = (dataURL: string, maxStreak: number, maxTransactions: number, memo_count: number, referralAccount:string | null): NextActionLink => {
  console.log('referralAccount', referralAccount);
  return {
    type: 'inline',
    action: {
      description: `Highest Streak: ${maxStreak} \nMaximum Transactions in a Day: ${maxTransactions} \nTransactions containing a message: ${memo_count}`,
      icon: `${dataURL}`,
      label: `Mint NFT`,
      title: 'Flex Your Solana Stats',
      type: 'action',
      links: {
        actions: [
          {
            label: `Mint NFT`, // button text
            href: `/api/action?Url=${dataURL}&ref=${referralAccount}`, // api endpoint
          },
        ],
      },
    },
  };
};

export const getCompletedAction = (dataURL: string): NextActionLink => {
  return {
    type: 'inline',
    action: {
      icon: `${dataURL}`,
      label: `DONE`,
      title: `You did transactions this year 🥳 `,
      description:
        'To check for more wallets switch the wallet from your wallet extension, retweet for others to also check their scores',
      type: 'completed',
    },
  };
};
