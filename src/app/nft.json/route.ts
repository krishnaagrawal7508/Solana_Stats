export const GET = async (request: Request) => {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get("url");
    const rarity = url.searchParams.get("rarity");

    let level: string = "undefined";
    if (rarity === "0") {
        level = "common";
    } else if (rarity === "1") {
        level = "uncommon"
    } else if (rarity === "2") {
        level = "rare"
    } else if (rarity === "3") {
        level = "epic"
    } else if (rarity === "4") {
        level = "legendary"
    } else if (rarity === "5") {
        level = "mythic"
    }

    const payload = {
        name: "Sol Stats",
        symbol: "SolStats",
        description: "Flex around your on-chain score",
        image: imageUrl,
        attributes: [
            {
                "trait_type": "Rarity",
                "value": level
            }
        ],
    }

    return Response.json(payload, {});
};