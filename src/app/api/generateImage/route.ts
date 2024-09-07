'use server';

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { generateTransactionData } from '@/utils/transactionData';
import got from 'got';
import path from 'path';
import TextToSVG from 'text-to-svg';

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
  if (totalTransactions >= 9000) return 6;
  if (totalTransactions >= 5000) return 4;
  if (totalTransactions >= 3000) return 3;
  if (totalTransactions >= 500) return 2;
  if (totalTransactions >= 0) return 1;
  return 1;
}

export async function POST(req: NextRequest) {
  const { wallet } = await req.json();
  const walletAddress = wallet;
  if (!walletAddress) {
    return new NextResponse('Wallet address is required', { status: 400 });
  }

  const [transactionData, totalTransactions, maxStreak, maxTransactions] =
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

  const daySize = 42; // Size of each day square
  const gap = 6; // Gap between squares
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
  const svgLib = TextToSVG.loadSync(path_to);
  const path_svg_wallet = svgLib.getPath(
    `${formatWalletAddress(walletAddress)}`,
    {
      x: 140,
      y: 520,
      fontSize: 48,
      attributes: {
        fill: '#FFFFFF',
        fontWeight: 'bold',
        fontFamily: 'SF-Pro-Rounded-Regular, Arial, sans-serif',
      },
    }
  );
  const path_svg_tnxs = svgLib.getPath(`${totalTransactions} Txns`, {
    x: 1620,
    y: 520,
    fontSize: 48,
    attributes: {
      fill: '#FFFFFF',
      fontWeight: 'bold',
      fontFamily: 'SF-Pro-Rounded-Regular, Arial, sans-serif',
      textAnchor: 'end',
    },
  });

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
  const months_svg_paths = months
    .map((month, index) =>
      svgLib.getPath(`${month}`, {
        x: index * (width / 7.5) + 80,
        y: 72,
        fontSize: 44,
        attributes: {
          fill: '#FFFFFF',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          textAnchor: 'middle',
        },
      })
    )
    .join('');

  const weekdays = ['Mon', 'Wed', 'Fri'];

  const HEATMAP_TOP = 382;
  const HEATMAP_HEIGHT = 600;

  const svg = `
         <svg width="2000" height="2000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <clipPath id="rounded-corners">
                     <rect width="1872" height="572" rx="32" ry="32" />
                </clipPath>
                <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
                </filter>
            </defs>
          <g clip-path="url(#rounded-corners)">
            <rect width="1872" height="572" fill="#155DD7" />
            ${months_svg_paths}
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
               const y = dayIndex * (daySize + gap) + 64; // Added 96 to account for month labels
               const color = getColor(count);
               return `<rect x="${x}" y="${y}" width="${daySize}" height="${daySize}" fill="${color}" rx='8' ry='8'/>`;
             })
             .join('')}

             <g transform="translate(68, 480) scale(1.5)">
               <path fill-rule="evenodd" clip-rule="evenodd" d="M1.22512 12.8642H26.7624C27.082 12.8642 27.3749 12.9982 27.6146 13.2372L31.6622 17.3912C32.4078 18.1642 31.8752 19.4682 30.8101 19.4682H5.27272C4.95322 19.4682 4.66021 19.3352 4.42061 19.0962L0.373015 14.9412C-0.372685 14.1692 0.159916 12.8642 1.22512 12.8642ZM0.373015 7.35217L4.42061 3.19818C4.63361 2.95818 4.95322 2.8252 5.27272 2.8252H30.7834C31.8486 2.8252 32.3812 4.13019 31.6356 4.90219L27.6146 9.05618C27.4015 9.29618 27.082 9.42917 26.7624 9.42917H1.22512C0.159916 9.42917 -0.372685 8.12417 0.373015 7.35217ZM31.6356 24.9542L27.5879 29.1082C27.3483 29.3482 27.0554 29.4812 26.7358 29.4812H1.22512C0.159916 29.4812 -0.372685 28.1762 0.373015 27.4042L4.42061 23.2502C4.63361 23.0102 4.95322 22.8772 5.27272 22.8772H30.7834C31.8486 22.8772 32.3812 24.1822 31.6356 24.9542Z" fill="white"/>
             </g>
             ${path_svg_wallet}
             ${path_svg_tnxs}
           </g>
        </svg>
    `;

  const fixedImageBuffer = await got(`${process.env.URL}/empty.png`).buffer();

  const userLevel = getUserLevel(parseInt(totalTransactions.toString()));

  const COMPOSITION_TOP = 756;
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

  const titleBuffer = await got(`${process.env.URL}/solana_score.png`).buffer();
  addCompositeOperation(
    {
      input: titleBuffer,
      left: COMPOSITION_LEFT + 648,
      top: COMPOSITION_TOP - 560,
    },
    100
  );

  const sendStickerBuffer = await got(
    `${process.env.URL}/stickers/send_sticker.png`
  ).buffer();
  addCompositeOperation(
    {
      input: sendStickerBuffer,
      left: COMPOSITION_LEFT + 86,
      top: COMPOSITION_TOP + 750,
    },
    100
  );

  if (userLevel >= 1) {
    const sparkStickerBuffer = await got(
      `${process.env.URL}/stickers/spark_sticker.png`
    ).buffer();
    addCompositeOperation(
      {
        input: sparkStickerBuffer,
        left: COMPOSITION_LEFT + 1610,
        top: COMPOSITION_TOP - 242,
      },
      100
    );
  }
  if (userLevel >= 2) {
    const solanaStickerBuffer = await got(
      `${process.env.URL}/stickers/solana_sticker.png`
    ).buffer();
    addCompositeOperation(
      {
        input: solanaStickerBuffer,
        left: COMPOSITION_LEFT + 100,
        top: COMPOSITION_TOP - 320,
      },
      100
    );
  }

  if (userLevel >= 3) {
    const oposStickerBuffer = await got(
      `${process.env.URL}/stickers/opos_sticker.png`
    ).buffer();
    addCompositeOperation(
      {
        input: oposStickerBuffer,
        left: COMPOSITION_LEFT + 1134,
        top: COMPOSITION_TOP + 540,
      },
      60
    );
  }

  if (userLevel >= 4) {
    const candleStickerBuffer = await got(
      `${process.env.URL}/stickers/candle_sticker.png`
    ).buffer();
    addCompositeOperation(
      {
        input: candleStickerBuffer,
        left: COMPOSITION_LEFT + 580,
        top: COMPOSITION_TOP + 560,
      },
      60
    );
  }

  if (userLevel >= 5) {
    const blinksStickerBuffer = await got(
      `${process.env.URL}/stickers/blinks_sticker.png`
    ).buffer();
    addCompositeOperation(
      {
        input: blinksStickerBuffer,
        left: COMPOSITION_LEFT + 1459,
        top: COMPOSITION_TOP + 800,
      },
      100
    );
  }

  const imageBuffer = await sharp({
    create: {
      width: 2000,
      height: 2000,
      channels: 4,
      background: { r: 23, g: 100, b: 242, alpha: 1 },
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
      maxStreak: maxStreak,
      maxTransactions: maxTransactions
    });
  } catch (error) {
    console.error('Error saving image:', error);
    return new NextResponse('Error saving image', { status: 500 });
  }
}

const getColor = (transactions: number) => {
  if (transactions >= 50) return '#FFFFFF';
  if (transactions >= 40) return '#D0DDF4';
  if (transactions >= 30) return '#A1BBE8';
  if (transactions >= 20) return '#89ABE3';
  if (transactions >= 10) return '#729ADD';
  if (transactions >= 5) return '#4D7ED0';
  if (transactions > 0) return '#4177D1';
  return '#114EB5';
};
