'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">


      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">


          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/play/online">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl shadow-l transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border border-black-300">
              <Image src="/assets/chess-game.png" alt="Chess Game" className="h-6 w-6 mr-2" />
              Ván cờ mới
            </button>
            </Link>

            <Link href="/home">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-xl shadow-l transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border border-black-300">
              <Image src="/assets/chess-game.png" alt="Chess Game" className="h-6 w-6 mr-2" />
              Chơi với máy
            </button>
            </Link>
          </div>

        </div>
      </main>


    </div>
  );
};

export default HomePage;