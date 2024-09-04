import { NextActionLink } from "@solana/actions-spec";

export const getNextAction = (dataURL: string): NextActionLink => {
  return {
    type: "inline",
    action: {
      description: "",
      icon: `${dataURL}`,
      label: `Mint NFT`,
      title: "Flex Your Solana Stats",
      type: "action",
      links: {
        actions: [
          {
            label: `Mint NFT`, // button text
            href: `/api/action?Url=${dataURL}`, // api endpoint
          },
        ],
      },
    },
  };
};

export const getCompletedAction = (dataURL: string): NextActionLink => {

  return {
    type: "inline",
    action: {
      icon: `${dataURL}`,
      label: `DONE`,
      title: `Flex Your Solana Stats`,
      description: "",
      type: "completed",
    },
  };
};


