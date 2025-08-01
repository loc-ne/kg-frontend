import React from 'react';
import DisplayBoard from './DisplayBoard';
import Image from 'next/image';

interface GameHistoryRowProps {
    initialFen: string;
    player1: { name: string; avatar?: string; rating?: number };
    player2: { name: string; avatar?: string; rating?: number };
    gameType: string;
    timeControl: string;
    result: string;
    reason: string;
    winner: 'player1' | 'player2' | 'draw';
}

const GameHistoryRow: React.FC<GameHistoryRowProps> = ({
    initialFen,
    player1,
    player2,
    gameType,
    timeControl,
    reason,
    winner,
}) => {
    return (
        <div className="flex items-center bg-white rounded-lg shadow p-4 mb-4">
            <div className="w-96 h-64 flex-shrink-0">
                <DisplayBoard initialFen={initialFen} size={256} playerColor="white" />
            </div>

            <div className="flex-1 flex items-center justify-between ml-6">
                <div className="flex flex-col items-end ml-6">
                    <div className="text-xl text-gray-500 mb-1">
                        <span className="font-bold">{gameType}</span> &bull; {timeControl}
                    </div>
                    <div className="text-sm text-gray-700 mb-1">Kết thúc: {reason}</div>
                    {winner === 'draw' && (
                        <div className="text-yellow-600 font-bold text-xs mt-1">Hoà</div>
                    )}
                </div>
                <div className="flex flex-col items-center w-32">
                    <Image
                        src={'/assets/avatar.png'}
                        alt={player1.name}
                        className="w-10 h-10 rounded-full mb-2"
                    />
                    <div className="font-semibold text-gray-800">{player1.name}</div>
                    {player1.rating && (
                        <div className="text-xs text-gray-500">ELO: {player1.rating}</div>
                    )}
                </div>
                <div className="flex flex-col items-center mx-4">
                    <Image src="/assets/oriental.png" alt="vs" className="w-8 h-8 mb-1" />
                    <div className="text-sm font-semibold text-gray-600">VS</div>
                </div>
                <div className="flex flex-col items-center w-32">
                    <Image
                        src={'/assets/avatar.png'}
                        alt={player2.name}
                        className="w-10 h-10 rounded-full mb-2"
                    />
                    <div className="font-semibold text-gray-800">{player2.name}</div>
                    {player2.rating && (
                        <div className="text-xs text-gray-500">ELO: {player2.rating}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameHistoryRow;