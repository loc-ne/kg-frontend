import React from 'react';
import { FenUtils } from '../game/Fen';

const PIECE_IMG: Record<string, string> = {
  K: 'wk.png', Q: 'wq.png', R: 'wr.png', B: 'wb.png', N: 'wn.png', P: 'wp.png',
  k: 'bk.png', q: 'bq.png', r: 'br.png', b: 'bb.png', n: 'bn.png', p: 'bp.png',
};

interface BoardProps {
  playerColor?: 'white' | 'black';
  initialFen: string;
  size?: number; // pixel, mặc định 160
}

function fenToBoard(fen: string) {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const arr: (string | null)[] = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < Number(char); i++) arr.push(null);
      } else {
        arr.push(char);
      }
    }
    return arr;
  });
}

const DisplayBoard: React.FC<BoardProps> = ({
  playerColor = 'white',
  initialFen,
  size = 160,
}) => {
  const board = fenToBoard(initialFen);

  // Đảo ngược hàng/cột nếu playerColor là black
  const rows = playerColor === 'black' ? [...board].reverse() : board;
  const cols = playerColor === 'black' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'grid',
        gridTemplateRows: 'repeat(8, 1fr)',
        gridTemplateColumns: 'repeat(8, 1fr)',
        border: '2px solid #333',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#b58863',
      }}
    >
      {rows.map((row, i) =>
        cols.map(j => {
          const piece = row[j];
          const isLight = (i + j) % 2 === 0;
          return (
            <div
              key={`${i}-${j}`}
              style={{
                background: isLight ? '#f0d9b5' : '#b58863',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
              }}
            >
              {piece && (
                <img
                  src={`/assets/${PIECE_IMG[piece]}`}
                  alt={piece}
                  style={{
                    width: size / 8 - 4,
                    height: size / 8 - 4,
                    objectFit: 'contain',
                  }}
                  draggable={false}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default DisplayBoard;