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
    "Your wallet's quieter than a silent film—let's add some sound!",
    'Even the blockchain is wondering where you are. Time to make a move!',
    'Your transaction history is as blank as a new canvas. Paint some action!',
    'Is your wallet on a coffee break? Give it a caffeine boost with some transactions!',
    "Time flies, but your transactions don't. Let's get them moving!",
    "Your on-chain activity is so minimal, it's practically invisible.",
    "Don't be shy! The blockchain is waiting for you to join the party.",
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
    "You're getting warmer, but the blockchain wants more heat!",
    "Good start, but it's time to crank up the transaction volume!",
    "You've made some noise; now let's start a symphony on-chain!",
    "Your wallet's awake, but it's still stretching. Let's get moving!",
    "You're on the map, but let's make you a landmark!",
    "Keep it up! You're halfway to being a true degen.",
    'Your activity is picking up, but the memecoins are still outpacing you.',
  ];

  const messages_level_3 = [
    'Keep the fun and transactions flying!',
    "You're not just playing; you're living the Solana dream. Keep grinding, degen!",
    'Crushing it on Solana like a true degen. Keep the vibes high and the transactions flowing!',
    "Your wallet's getting a workout—nice hustle!",
    'Memecoins are your friends, and youre making plenty!',
    'On-chain and loving it! Keep up the great work!',
    "You're dancing with the degens now. Keep those transactions coming!",
    'Stay active, you degen!',
    "Your wallet's alive and kicking—keep up the stellar work!",
    "You're making waves on Solana. Ride that blockchain surf!",
    'Transactions are flowing like water. Stay hydrated!',
    'The degens recognize one of their own. Keep the momentum!',
    "Your on-chain game is strong. Don't slow down!",
    'Memecoins are loving your attention. Keep spreading the love!',
    'Your activity is shining bright. Keep lighting up the blockchain!',
  ];

  const messages_level_4 = [
    'Solana is your playground now—keep the transactions rolling.',
    'You are killing it on Solana; keep that momentum, you degen beast!',
    'Your on-chain activity is picking up; just a few more memecoins to catch up!',
    "You're a memecoin maestro—keep spinning those tunes!",
    'The blockchain bows to your degen prowess!',
    'Transaction heatmap? More like a heatwave! Keep it up!',
    "You're setting trends on Solana. The degens salute you!",
    'Your wallet must be on fire! Keep fueling the Solana flame!',
    "You're a force on Solana! Keep that energy blazing!",
    'The memecoins are following your lead. Keep leading the charge!',
    'Your transactions are making the blockchain sizzle!',
    'Degen status: Verified. Keep pushing the limits!',
    "Your wallet's in overdrive. Don't hit the brakes now!",
    "Solana's pulse beats with your transactions. Keep the heart pumping!",
    "You're rewriting the degen playbook. Keep innovating!",
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
    'Your wallet is a legend in its own right. Keep making history!',
    'You just Sent It!',
    "Transactions bow before you. You're a degen deity!",
    'You are the reason for Solana congestion not ORE!',
    'Your activity is off the charts! Literally.',
    "You don't follow trends; you set them. Keep blazing trails!",
    'Is there anything on Solana you have not used?',
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
      description: `${messageString} \n\nYou did ${number_of_txns} transactions this year. The highest number of transactions you signed in a single day was ${maxTransactions}, and you were active on-chain for ${maxStreak} consecutive days.`,
      icon: `${dataURL}`,
      label: `Collect as NFT`,
      title: `Your Solana Score is ${userSolanaScore.toFixed(0)} `,
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
      title: `You minted a pice of your history, show it to everybody 🥳 `,
      description:
        'To check for more wallets switch the wallet from your wallet extension, retweet for others to also check their scores',
      type: 'completed',
    },
  };
};
