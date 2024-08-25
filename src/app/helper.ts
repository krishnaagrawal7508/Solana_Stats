import { NextActionLink } from "@solana/actions-spec";

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


