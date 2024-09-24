import { NextActionLink } from '@solana/actions-spec';

function getMessageString(level: number) {
  const messages_level_1 = [
    'Your transaction history is emptier than a ghost town—time to liven things up!',
    "Did you forget your wallet password? We don't see much action here!",
    'Your Solana activity is so low, even the memecoins are ignoring you.',
    'Is your wallet in hibernation? Wake it up with some on-chain moves!',
    "You've done fewer transactions than my grandma—step it up!",
    'Your heatmap is colder than crypto winter. Warm it up!',
    'Blink twice if you need help making transactions!',
    "At this rate, your wallet's more of a museum piece than a tool. Time to change that!",
  ];

  const messages_level_2 = [
    'Making some moves, but still slower than a Bitcoin transaction!',
    "You've dipped your toes in Solana, but it's time to dive in!",
    "Your wallet's getting some exercise, but it could use a full workout.",
    'Almost a degen, but not quite. Push harder!',
    'Your transaction history is like a meme—funny, but not substantial.',
    "You're on the blockchain, but are you really *on* the blockchain?",
    "Is that all you've got? The memecoins are waiting!",
    "Not bad, but the degens are still laughing. Show them what you've got!",
  ];

  const messages_level_3 = [
    'Keep the fun and transactions flying!',
    "You're not just playing; you're living the Solana dream. Keep grinding, degen!",
    'Crushing it on Solana like a true degen. Keep the vibes high and the transactions flowing!',
    "Your wallet's getting a workout—nice hustle!",
    "Memecoins are your friends, and you're making plenty!",
    'On-chain and loving it! Keep up the great work!',
    "You're dancing with the degens now. Keep those transactions coming!",
    'Stay active you degen!',
  ];

  const messages_level_4 = [
    'Solana is your playground now—keep the transactions rolling.',
    'You are killing it on Solana, keep that momentum, you degen beast!',
    'Your on-chain activity is picking up, just a few more memecoins to catch up!',
    "You're a memecoin maestro—keep spinning those tunes!",
    'The blockchain bows to your degen prowess!',
    'Transaction heatmap? More like a heatwave! Keep it up!',
    "You're setting trends on Solana. The degens salute you!",
    'Your wallet must be on fire! Keep fueling the Solana flame!',
  ];

  const messages_level_5 = [
    'Your transaction heatmap is hotter than the sun!',
    'Legend has it, you were born on-chain!',
    'Your dedication is unmatched—are you even sleeping?',
    'Living the degen life to the fullest! Keep leading the pack.',
    'Memecoins fear you; degens revere you!',
    "The ultimate degen! You've reached peak on-chain mastery!",
    "You're the on-chain hero we all aspire to be!",
    "Even the memecoins can't keep up with you!",
  ];

  switch (level) {
    case 1:
      // should pick a random from three messages

      return messages_level_1[
        Math.floor(Math.random() * messages_level_1.length)
      ];
    case 2:
      return messages_level_2[
        Math.floor(Math.random() * messages_level_2.length)
      ];
    case 3:
      return messages_level_3[
        Math.floor(Math.random() * messages_level_3.length)
      ];
    case 4:
      return messages_level_4[
        Math.floor(Math.random() * messages_level_4.length)
      ];
    case 5:
      return messages_level_5[
        Math.floor(Math.random() * messages_level_5.length)
      ];
    default:
      return messages_level_1[
        Math.floor(Math.random() * messages_level_1.length)
      ];
  }
}
export const getNextAction = (
  dataURL: string,
  maxStreak: number,
  maxTransactions: number,
  userLevel: number,
  number_of_txns: number,
  walletAddress: any,
  userSolanaScore: number,
  referralAccount: string
): NextActionLink => {
  const messageString = getMessageString(userLevel);

  return {
    type: 'inline',
    action: {
      description: `Total Transactions this year: ${number_of_txns} \nMaximum Transactions in a Day: ${maxTransactions}\nHighest Streak: ${maxStreak} Days in a row \n\n${messageString}`,
      icon: `${dataURL}`,
      label: `Collect as NFT`,
      title: `Your Solana Score is ${userSolanaScore.toFixed(0)} / 100`,
      type: 'action',
      links: {
        actions: [
          {
            label: `Collect as NFT`, // button text
            href: `/api/action?Url=${dataURL}&Rarity=${userLevel}&ref=${referralAccount}`, // api endpoint
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
