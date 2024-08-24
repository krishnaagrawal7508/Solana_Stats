"use server"

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { generateTransactionData } from '@/utils/transactionData';

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

export async function POST(req: NextRequest) {

    const { wallet } = await req.json();
    const walletAddress = wallet;
    if (!walletAddress) {
        return new NextResponse('Wallet address is required', { status: 400 });
    }

    const transactionData = await generateTransactionData(walletAddress);
    const daySize = 7; // Size of each day square
    const gap = 1; // Gap between squares
    const daysInWeek = 7;
    const totalWeeks = 52;

    const width = totalWeeks * (daySize + gap) + 30; // Width of the entire year
    const height = daysInWeek * (daySize + gap); // Height of the days in a week

    // Ensure all days of the year are included, even if there are no transactions
    const startOfYear = new Date(2024, 0, 1);
    const endOfYear = new Date(2024, 11, 31);

    const svg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            ${Object.entries(transactionData).map(([date, countObj], index) => {
        const count = Object.values(countObj)[0]; // Extract count from the object
        const dayIndex = new Date(date).getDay(); // Get day of the week
        const weekIndex = Math.floor(index / daysInWeek);
        const day = index % daysInWeek;
        const x = weekIndex * (daySize + gap);
        const y = day * (daySize + gap);
        const color = getColor(count);
        return `<rect x="${x}" y="${y}" width="${daySize}" height="${daySize}" fill="${color}" />`;
    }).join('')}
        </svg>
    `;

    const fixedImageBuffer = await sharp('/overall_blank.png').toBuffer();
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
    if (transactions >= 70) return '#1b63fc'; // Dark Blue
    if (transactions >= 51) return '#7A9CF6'; // Dark Blue
    if (transactions >= 11) return '#c8dbfc'; // Blue
    if (transactions >= 0) return '#e3edff';  // Light Blue
    return '#E0E0E0'; // No transactions (White)
};
