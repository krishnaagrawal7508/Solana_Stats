import { NextActionLink } from '@solana/actions-spec';

export const getCompletedAction = (
  dataURL: string,
  number_of_txns: Number
  //max_transactions: Number
): NextActionLink => {
  const formattedNumber = number_of_txns
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return {
    type: 'inline',
    action: {
      icon: `${dataURL}`,
      label: `DONE`,
      title: `You did ${formattedNumber} transactions this year 🥳 `,
      description:
        'To check for more wallets switch the wallet from your wallet extension, retweet for others to also check their scores',
      type: 'completed',
    },
  };
};
