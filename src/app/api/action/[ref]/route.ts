import { statics } from "@/app/statics";
import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { ActionGetResponse } from "@solana/actions-spec";
import { NextRequest, NextResponse } from "next/server";


//GET route to handle referral links

export async function GET(req: NextRequest) {
    //get the referrer
    const { pathname } = new URL(req.url);
    const last = pathname.split('/').pop();
    let ref:null | string = null;
    if(last && last.length > 42 && last.length < 46){
      ref = last;
    }

    //set metaData
    let response: ActionGetResponse = {
      type: "action",
      icon: statics.icon,
      title: statics.title,
      description: statics.description,
      label: statics.label,
      links: {
        actions: [
          {
            label: statics.label,
            // href: ref
            //   ? `http://localhost:3000/api/action?ref=${ref}`
            //   : "http://localhost:3000/api/action",
            // Alternative using env variable (if needed in production)
            href: ref
              ? `${process.env.URL}/api/action?ref=${ref}`
              : `${process.env.URL}/api/action`,
          },
        ],
      },
    };
  
    //point to POST
    return NextResponse.json(response, {
      headers: ACTIONS_CORS_HEADERS,
    });
  }
  
  // ensures cors
  export const OPTIONS = GET;
  