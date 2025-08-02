'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DisplayBoard from '../../../components/Board';
import TimeSelector from '../../../components/TimeSelector';
import { useAuth } from '@/contexts/AuthContext';


const PlayOnlinePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();// ✅ Use WebSocket context

  const [selectedTime, setSelectedTime] = useState('5min');
  const [selectedCategory, setSelectedCategory] = useState('Blitz');
  const [isSearching, setIsSearching] = useState(false);
  const currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const [searchStatus, setSearchStatus] = useState('');

  const handleTimeSelect = (time: string, category: string) => {
    setSelectedTime(time);
    setSelectedCategory(category);
  };
  function toTimeControlDto(timeStr: string, category: string) {
    // timeStr ví dụ: "3 + 2"
    const [minStr, incStr] = timeStr.replace(/\s+/g, '').split('+');
    const initialTime = parseInt(minStr, 10) * 60; // phút -> giây
    const increment = incStr ? parseInt(incStr, 10) : 0;
    const type = ['bullet', 'blitz', 'rapid', 'classical'].includes(category.toLowerCase())
      ? category.toLowerCase()
      : 'blitz';
    return { type, initialTime, increment };
  }

  const handleStartSearch = async () => {
    const timeControl = toTimeControlDto(selectedTime, selectedCategory);
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/me`, {
      credentials: 'include'
    });

    const data = await response.json();

    const body = {
      timeControl,
      guestName: 'no',
      user: {
        sub: String(data.id),
        username: String(data.username)
      }
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MATCHMAKING_SERVICE_URL}/matchmaking/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const result = await response.json();
      console.log(result);

      if (response.ok) {
        setSearchStatus('Searching for opponent...');
        setIsSearching(true);
      } else {
        setSearchStatus(result.error || 'Failed to find game');
      }
    } catch (error) {
      console.error('Find game error:', error);
      setSearchStatus('Network error. Please check if server is running.');
    }
  };
  const wsRef = React.useRef<WebSocket | null>(null);
  React.useEffect(() => {
    if (!user?.id) return;
    if (wsRef.current) return;

    const ws = new WebSocket(`wss://${process.env.NEXT_PUBLIC_MATCHMAKING_SERVICE_URL}?userId=${user.id}`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WS message:', data);
      if (data.url) {
        router.push(data.url);
        console.log('Navigating to:', data.url);
      }
    };
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left - Chess Board */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

              {/* Chess Board */}
              <div className="flex justify-center">
                <DisplayBoard
                  playerColor='white'
                  initialFen={currentFen}
                />
              </div>

            </div>
          </div>

          {/* Right - Game Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

              {/* Time Selector */}
              <div className="mb-6">
                <TimeSelector
                  initialTime={selectedTime}
                  initialCategory={selectedCategory}
                  onTimeSelect={handleTimeSelect}
                  disabled={isSearching}
                  size="medium"
                />
              </div>

              {/* Start/Cancel Buttons */}
              {!isSearching ? (
                <button
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl py-4 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  onClick={handleStartSearch}
                >
                  Bắt đầu ván cờ
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="text-gray-900 font-semibold">Searching...</span>
                    </div>
                    <p className="text-blue-600 text-sm">
                      {searchStatus || `Looking for ${selectedCategory} ${selectedTime} opponent`}
                    </p>
                  </div>

                  {/* Cancel Button */}
                  <button
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors duration-200"
                  // onClick={handleCancelSearch}
                  >
                    Cancel Search
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlayOnlinePage;