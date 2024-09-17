

export const GET = async () => {
  const payload = {
    name: "Solana Score",
    symbol: "Solana Score",
    description: "Generate a graph of your Solana activity and mint a NFT based on your daily transactions. Show the world your degen side!",
    image: "https://score.sendarcade.fun/cover.png"
  }

  return Response.json(payload, {});
};
// ensures cors
export const OPTIONS = GET;