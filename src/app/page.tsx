'use client';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next";

const TransactionsHeatmap: React.FC = () => {
  return (
    <div>
      <p >Solana Stats</p>
      <SpeedInsights />
    </div>
  );
};

export default TransactionsHeatmap;
