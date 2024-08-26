"use server"

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { generateTransactionData } from '@/utils/transactionData';
import got from 'got';
import TextToSVG from 'text-to-svg';

function bufferToBlob(buffer: Buffer, mimeType: string): Blob {
    return new Blob([buffer], { type: mimeType });
}

const uploadImageToCloudinary = async (imageBuffer: Buffer): Promise<string> => {
    const cloudName = 'dy075nvxm';
    const uploadPreset = 'solanastats'; // Create a preset in Cloudinary

    const form = new FormData();
    const blobImage = bufferToBlob(imageBuffer, "");
    form.append('file', blobImage, 'image.png');
    form.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form,
    });

    const data = await response.json();

    if (response.ok) {
        console.log(data.secure_url);
        return data.secure_url; // URL of the uploaded image
    } else {
        throw new Error(`Cloudinary API error: ${data.error.message}`);
    }
};

function getWeekNumber(date: Date): number {
    // Clone the date object to avoid mutating the original date
    const newDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    // Set the day to Thursday in the current week
    newDate.setUTCDate(newDate.getUTCDate() + 4 - (newDate.getUTCDay() || 7));

    // Get the first day of the year
    const yearStart = new Date(Date.UTC(newDate.getUTCFullYear(), 0, 1));

    // Calculate the week number
    const weekNo = Math.ceil((((newDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return weekNo;
}

function getDaysFromStartOfYear(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1); // January 1st of the same year
    const diffInTime = date.getTime() - startOfYear.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
    return diffInDays + 1; // +1 to include the start day
}

export async function POST(req: NextRequest) {

    const { wallet } = await req.json();
    const walletAddress = wallet;
    if (!walletAddress) {
        return new NextResponse('Wallet address is required', { status: 400 });
    }

    const [transactionData, totalTransaaction] = await generateTransactionData(walletAddress);
    const daySize = 9; // Size of each day square
    const gap = 1; // Gap between squares
    const daysInWeek = 7;
    const totalWeeks = 35;

    const width = totalWeeks * (daySize + gap) + 30; // Width of the entire year
    const height = daysInWeek * (daySize + gap) + 100; // Height of the days in a week

    // Ensure all days of the year are included, even if there are no transactions
    // const startOfYear = new Date(2024, 0, 1);
    // const endOfYear = new Date(2024, 11, 31)
    console.log("hi");

    const svgLib = TextToSVG.loadSync("./sans_serif.ttf");
    const path_svg = svgLib.getPath(`Total Txns: ${totalTransaaction}`, { x: 140, y: 130, fontSize:15 ,attributes:{fill:"#1d6fff"} });
    // console.log(path_svg);

    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            ${Object.entries(transactionData).map(([date, countObj], index) => {
        // console.log(date);

        const [dateString, count] = Object.entries(countObj)[0] as [string, number];
        const [year, month, day] = dateString.split('-').map(Number);
        // console.log(count);

        const date__ = new Date(year, month - 1, day);
        const dayTotal = getDaysFromStartOfYear(date__);
        const weekIndex = getWeekNumber(date__);
        const day_index = (dayTotal % 7 === 0) ? 7 : dayTotal % 7;


        const x = weekIndex * (daySize + gap);
        const y = day_index * (daySize + gap);
        const color = getColor(count);
        return `<rect x="${x}" y="${y}" width="${daySize}" height="${daySize}" fill="${color}" />`;
    }).join('')}
${path_svg}
        </svg>
    `;

    const fixedImageBuffer = await got("https://solana-stats.vercel.app/overall_blank.png").buffer();

    // const fixedImageBuffer = await sharp(temp_buf);
    const x = (500 - width) / 2;
    const y = 240;

    const imageBuffer = await sharp(fixedImageBuffer)
        .resize({ width: 500, height: 500 }) // Adjust size if needed
        .composite([{
            input: Buffer.from(svg),
            left: x,
            top: y,
        }]) // Overlay the SVG on the fixed image
        .png()
        .toBuffer();

    try {
        // Define the file path
        const u = await uploadImageToCloudinary(imageBuffer);
        return NextResponse.json({ url: u });
    } catch (error) {
        console.error('Error saving image:', error);
        return new NextResponse('Error saving image', { status: 500 });
    }

}

const getColor = (transactions: number) => {
    if (transactions >= 20) return '#1b63fc'; // Dark Blue
    if (transactions >= 10) return '#7A9CF6'; // Blue
    if (transactions > 0) return '#c8dbfc'; // light Blue
    return '#e3edff'; // No transactions (lightest blue)
};
