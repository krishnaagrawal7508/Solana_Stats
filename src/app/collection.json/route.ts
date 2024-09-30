export const GET = async () => {
  const payload = {
    name: 'Solana Score',
    symbol: 'Solana Score',
    description: '',
    image: 'https://score.sendarcade.fun/cover.png',
    external_url: 'https://score.sendarcade.fun/',
    properties: {
      files: [
        {
          uri: 'https://score.sendarcade.fun/cover.png',
          type: 'image/png',
        },
      ],
    },
  };

  return Response.json(payload, {});
};
