'use client';

import { useState } from 'react';

export default function Home() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    const handleGenerateImage = async () => {
        const response = await fetch('/api/generateImage');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageSrc(url);
    };

    return (
        <div>
            <button onClick={handleGenerateImage}>Generate Activity Image</button>
            {imageSrc && <img src={imageSrc} alt="Solana Wallet Activity" />}
        </div>
    );
}
