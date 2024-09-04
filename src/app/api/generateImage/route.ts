'use server';

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { generateTransactionData } from '@/utils/transactionData';
import got from 'got';
import path from 'path';

function bufferToBlob(buffer: Buffer, mimeType: string): Blob {
  return new Blob([buffer], { type: mimeType });
}

const uploadImageToCloudinary = async (
  imageBuffer: Buffer
): Promise<string> => {
  const cloudName = 'dy075nvxm';
  const uploadPreset = 'solanastats'; // Create a preset in Cloudinary

  const form = new FormData();
  const blobImage = bufferToBlob(imageBuffer, 'png');
  form.append('file', blobImage, 'image.png');
  form.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: form,
    }
  );

  const data = await response.json();

  if (response.ok) {
    return data.secure_url; // URL of the uploaded image
  } else {
    throw new Error(`Cloudinary API error: ${data.error.message}`);
  }
};

function getWeekNumber(date: Date): number {
  // Clone the date object to avoid mutating the original date
  const newDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  // Set the day to Thursday in the current week
  newDate.setUTCDate(newDate.getUTCDate() + 4 - (newDate.getUTCDay() || 7));

  // Get the first day of the year
  const yearStart = new Date(Date.UTC(newDate.getUTCFullYear(), 0, 1));

  // Calculate the week number
  const weekNo = Math.ceil(
    ((newDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  return weekNo;
}

function getDaysFromStartOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1); // January 1st of the same year
  const diffInTime = date.getTime() - startOfYear.getTime();
  const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
  return diffInDays + 1; // +1 to include the start day
}

function formatWalletAddress(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function getUserLevel(totalTransactions: number): number {
  if (totalTransactions >= 10000) return 6;
  if (totalTransactions >= 5000) return 5;
  if (totalTransactions >= 2500) return 4;
  if (totalTransactions >= 500) return 3;
  if (totalTransactions >= 0) return 2;
  return 1;
}

export async function POST(req: NextRequest) {
  const { wallet } = await req.json();
  const walletAddress = wallet;
  if (!walletAddress) {
    return new NextResponse('Wallet address is required', { status: 400 });
  }

  const [transactionData, totalTransactions, max_transactions] =
    await generateTransactionData(walletAddress);

  const compositeOperations: Array<sharp.OverlayOptions & { zIndex: number }> =
    [];

  function addCompositeOperation(
    operation: sharp.OverlayOptions,
    zIndex: number
  ) {
    compositeOperations.push({ ...operation, zIndex });
    compositeOperations.sort((a, b) => a.zIndex - b.zIndex);
  }

  const daySize = 42.4; // Size of each day square
  const gap = 4.8; // Gap between squares
  const daysInWeek = 7;
  const totalWeeks = 32;

  const width = totalWeeks * (daySize + gap); // Width of the entire year
  const height = daysInWeek * (daySize + gap); // Height of the days in a week

  // Ensure all days of the year are included, even if there are no transactions
  // const startOfYear = new Date(2024, 0, 1);
  // const endOfYear = new Date(2024, 11, 31)

  const path_to = path.join(
    process.cwd(),
    'public',
    'assets',
    'sans_serif.ttf'
  );

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
  ];
  const weekdays = ['Mon', 'Wed', 'Fri'];

  const HEATMAP_TOP = 382;
  const HEATMAP_HEIGHT = 600;

  const svg = `
         <svg width="2000" height="2000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <clipPath id="rounded-corners">
                <rect width="1872" height="600" rx="36" ry="36" />
                </clipPath>
                <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="50" result="blur" />
                <feFlood flood-color="rgba(19, 81, 189, 0.4)" result="color"/>
                <feComposite in="color" in2="blur" operator="in" result="shadow"/>
                <feMerge>
                    <feMergeNode in="shadow"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
                </filter>
            </defs>
            
            <!-- Glow effect -->
            <rect width="1872" height="600" fill="rgba(19, 81, 189, 0.4)" filter="url(#glow-effect)" rx="36" ry="36" />
            
            <!-- Main content -->
            <g clip-path="url(#rounded-corners)">
                <rect width="1872" height="600" fill="rgba(19, 81, 189, 0.4)" />
    
            ${months
              .map(
                (month, index) => `
                <text
                x="${index * (width / 7.5) + 112}"
                y="96"
                fill="#FFFFFF"
                font-size="40"
                font-family="Arial, sans-serif"
                text-anchor="middle"
                >${month}</text>
            `
              )
              .join('')}
           ${Object.entries(transactionData)
             .map(([date, countObj], index) => {
               const [dateString, count] = Object.entries(countObj)[0] as [
                 string,
                 number
               ];
               const [year, month, day] = dateString.split('-').map(Number);
               // do not run the code if date is greater than current date
               if (new Date(year, month - 1, day) > new Date()) {
                 return '';
               }

               const date__ = new Date(year, month - 1, day);
               const dayTotal = getDaysFromStartOfYear(date__);
               const weekIndex = getWeekNumber(date__);
               const dayIndex = dayTotal % 7 === 0 ? 7 : dayTotal % 7;

               const x = weekIndex * (daySize + gap) + 16; // Added 16 for padding
               const y = dayIndex * (daySize + gap) + 96; // Added 96 to account for month labels
               const color = getColor(count);
               return `<rect x="${x}" y="${y}" width="${daySize}" height="${daySize}" fill="${color}" rx='8' ry='8'/>`;
             })
             .join('')}
               <g transform="translate(96, 504) scale(1.5)">
               <path fill-rule="evenodd" clip-rule="evenodd" d="M1.22512 12.8642H26.7624C27.082 12.8642 27.3749 12.9982 27.6146 13.2372L31.6622 17.3912C32.4078 18.1642 31.8752 19.4682 30.8101 19.4682H5.27272C4.95322 19.4682 4.66021 19.3352 4.42061 19.0962L0.373015 14.9412C-0.372685 14.1692 0.159916 12.8642 1.22512 12.8642ZM0.373015 7.35217L4.42061 3.19818C4.63361 2.95818 4.95322 2.8252 5.27272 2.8252H30.7834C31.8486 2.8252 32.3812 4.13019 31.6356 4.90219L27.6146 9.05618C27.4015 9.29618 27.082 9.42917 26.7624 9.42917H1.22512C0.159916 9.42917 -0.372685 8.12417 0.373015 7.35217ZM31.6356 24.9542L27.5879 29.1082C27.3483 29.3482 27.0554 29.4812 26.7358 29.4812H1.22512C0.159916 29.4812 -0.372685 28.1762 0.373015 27.4042L4.42061 23.2502C4.63361 23.0102 4.95322 22.8772 5.27272 22.8772H30.7834C31.8486 22.8772 32.3812 24.1822 31.6356 24.9542Z" fill="white"/>
              </g>
                <text x="166" y="546" fill="#FFFFFF60" font-size="48" font-family="SF-Pro-Rounded-Regular, Arial, sans-serif" font-weight="bold">${formatWalletAddress(
                  walletAddress
                )}</text>
                <text x="1750" y="546" fill="#FFFFFF60" font-size="48" font-family="SF-Pro-Rounded-Regular, Arial, sans-serif" font-weight="bold" text-anchor="end">${totalTransactions} Txns</text>
              </g>
        </svg>
    `;

  const fixedImageBuffer = await got(
    'http://localhost:3000/empty.png'
  ).buffer();

  const userLevel = getUserLevel(parseInt(totalTransactions.toString()));

  const COMPOSITION_TOP = 780;
  const COMPOSITION_LEFT = 64;

  // Create an array to hold all composite operations
  addCompositeOperation(
    {
      input: Buffer.from(svg),
      left: COMPOSITION_LEFT,
      top: COMPOSITION_TOP,
    },
    50
  );

  const titleBuffer = await got(
    'http://localhost:3000/solana_stats.png'
  ).buffer();
  addCompositeOperation(
    {
      input: titleBuffer,
      left: COMPOSITION_LEFT + 648,
      top: COMPOSITION_TOP - 680,
    },
    100
  );

  if (userLevel >= 2) {
    const sendStickerBuffer = await got(
      'http://localhost:3000/stickers/send_sticker.png'
    ).buffer();
    addCompositeOperation(
      {
        input: sendStickerBuffer,
        left: 1480 + COMPOSITION_LEFT,
        top: COMPOSITION_TOP - 372,
      },
      100
    );
  }

  if (userLevel >= 3) {
    const oposStickerBuffer = await got(
      'http://localhost:3000/stickers/solana_sticker.png'
    ).buffer();
    addCompositeOperation(
      {
        input: oposStickerBuffer,
        left: COMPOSITION_LEFT,
        top: COMPOSITION_TOP - 390,
      },
      100
    );
  }
  if (userLevel >= 4) {
    const solanaStickerBuffer = await got(
      'http://localhost:3000/stickers/opos_sticker.png'
    ).buffer();
    addCompositeOperation(
      {
        input: solanaStickerBuffer,
        left: COMPOSITION_LEFT + 1510,
        top: COMPOSITION_TOP + 550,
      },
      60
    );
  }
  if (userLevel >= 5) {
    const solanaStickerBuffer = await got(
      'http://localhost:3000/stickers/spark_sticker.png'
    ).buffer();
    addCompositeOperation(
      {
        input: solanaStickerBuffer,
        left: COMPOSITION_LEFT + 108,
        top: COMPOSITION_TOP + 840,
      },
      60
    );
  }

  const imageBuffer = await sharp({
    create: {
      width: 2000,
      height: 2000,
      channels: 4,
      background: { r: 23, g: 100, b: 232, alpha: 1 },
    },
  })
    .composite(compositeOperations.map(({ zIndex, ...op }) => op))
    .png()
    .toBuffer();

  try {
    const u = await uploadImageToCloudinary(imageBuffer);
    return NextResponse.json({
      url: u,
      number_of_txns: totalTransactions,
      max_transactions: max_transactions,
    });
  } catch (error) {
    console.error('Error saving image:', error);
    return new NextResponse('Error saving image', { status: 500 });
  }
}

const getColor = (transactions: number) => {
  if (transactions >= 20) return '#FFFFFF'; // Dark Blue
  if (transactions >= 10) return '#A1BBE8'; // Dark Blue
  if (transactions >= 5) return '#729ADD'; // Blue
  if (transactions > 1) return '#4177D1'; // light Blue
  return '#114EB5'; // No transactions (lightest blue)
};
