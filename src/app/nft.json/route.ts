export const GET = async () => {
    const payload = {
        name: "Stats #1",
        symbol: "SolStats",
        description: "Flex around your on-chain score",
        image: "https://score.sendarcade.fun/nft.png",
        attributes: [ 
            {
                "trait_type": "Rarity", 
                "value": "rare" 
            }
        ],
    }

    return Response.json(payload, {});
};