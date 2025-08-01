'use client';

import React, { useState } from 'react';
import GameHistoryRow from '@/components/GameHistoryRow';
import Image from 'next/image';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('overview');

    // // Sample ELO data
    // const eloData = [
    //     { date: '2024-01', bullet: 1200, blitz: 1150, rapid: 1100 },
    //     { date: '2024-02', bullet: 1250, blitz: 1200, rapid: 1180 },
    //     { date: '2024-03', bullet: 1280, blitz: 1240, rapid: 1220 },
    //     { date: '2024-04', bullet: 1320, blitz: 1280, rapid: 1260 },
    //     { date: '2024-05', bullet: 1350, blitz: 1320, rapid: 1300 },
    //     { date: '2024-06', bullet: 1380, blitz: 1350, rapid: 1340 },
    //     { date: '2024-07', bullet: 1420, blitz: 1380, rapid: 1370 },
    // ];

    const userStats = {
        username: 'ChessMaster2024',
        joinDate: '15/03/2023',
        currentRatings: {
            bullet: 1420,
            blitz: 1380,
            rapid: 1370
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">

                            <Image
                                src="/assets/avartar.png"
                                alt="Chess Avatar"
                                className="w-24 h-24 object-cover"
                            />


                            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                {userStats.username}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 mb-4">
                                <span>Tham gia từ {userStats.joinDate}</span>
                            </div>

                            {/* Current Ratings */}
                            <div className="grid grid-cols-3 gap-4 mb-6 mt-10">
                                <div className="bg-gray-200 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-black-600">{userStats.currentRatings.bullet}</div>
                                    <div className="text-sm text-gray-600">Bullet</div>
                                </div>
                                <div className="bg-gray-200 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-black-600">{userStats.currentRatings.blitz}</div>
                                    <div className="text-sm text-gray-600">Blitz</div>
                                </div>
                                <div className="bg-gray-200 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-black-600">{userStats.currentRatings.rapid}</div>
                                    <div className="text-sm text-gray-600">Rapid</div>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'overview'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Tổng quan
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'history'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Lịch sử ván đấu
                                </button>
                                <button
                                    onClick={() => setActiveTab('stats')}
                                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === 'stats'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >

                                    Số liệu thống kê
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content based on active tab */}
                {activeTab === 'overview' && (
                    <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Các ván đấu gần đây</h3>
                        <GameHistoryRow
                            initialFen="rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
                            player1={{ name: 'Người chơi 1', avatar: '/assets/avatar1.png', rating: 1350 }}
                            player2={{ name: 'Người chơi 2', avatar: '/assets/avatar2.png', rating: 1400 }}
                            gameType="Blitz"
                            timeControl="5 + 0"
                            result="Người chơi 2 thắng"
                            reason="Hết thời gian"
                            winner="player2"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;