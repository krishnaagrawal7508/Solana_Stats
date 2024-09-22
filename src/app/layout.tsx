import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next";

import localFont from 'next/font/local';

const APP_NAME = 'Solano Stats';
const APP_DESCRIPTION = 'Generate a heatmap of your Solana stats';

export const metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <head>
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1.0'
        ></meta>
        <meta name='twitter:card' content='summary_large_image'></meta>
        <meta name='twitter:title' content='Solana Stats'></meta>
        <meta
          name='twitter:description'
          content='Check out my Solana transaction stats!'
        ></meta>
        <meta
          name='twitter:image'
          content='https://i.ibb.co/XDdrw9g/cover.png'
        ></meta>
        <meta property='og:title' content='Solana Stats'></meta>
        <meta
          property='og:description'
          content='Check out my Solana transaction stats!'
        ></meta>
        <meta
          property='og:image'
          content='https://i.ibb.co/XDdrw9g/cover.png'
        ></meta>
        <title>My Solana Stats</title>
      </head>
      <body className=''>{children}</body>
      <SpeedInsights />
    </html>
  );
}
