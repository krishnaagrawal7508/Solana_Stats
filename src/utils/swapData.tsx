export const swapFunds = async (price: number, slip: number) => {
  console.log(price, "price");
  const quoteResponse = await (
    await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa&amount=${price}&slippageBps=50`
    )
  ).json();
  return quoteResponse;
};
