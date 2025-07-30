import React from 'react';
import { ChessGameState, GameState } from '../game/GameState.ts';
import { FEN, STARTING_FEN } from '../game/Fen.ts';
import { BoardManager } from '../game/Board.ts';
import { Position } from '../game/types.js';

export const useChessGame = (initialFen: string = STARTING_FEN) => {
  const [gameState, setGameState] = React.useState<ChessGameState>(() =>
    FEN.convertFenToChessGameState(initialFen)
  );

  // ✅ Copy từ code cũ - Move cache
  const validMovesCache = React.useRef(new Map<string, Position[]>());

  const getValidMoves = React.useCallback((position: Position): Position[] => {
    const key = `${position.row}-${position.col}-${gameState.fen}`;

    if (validMovesCache.current.has(key)) {
      return validMovesCache.current.get(key)!;
    }

    const moves = BoardManager.generateMovesForPiece(
      gameState.bitboards,
      gameState,
      position
    );

    if (validMovesCache.current.size > 100) {
      validMovesCache.current.clear();
    }

    validMovesCache.current.set(key, moves);
    return moves;
  }, [gameState.bitboards, gameState.fen]);

  // ✅ Copy từ code cũ - Batch computation
  const computeNewGameState = React.useCallback((
    prevState: ChessGameState,
    from: Position,
    to: Position
  ): ChessGameState => {
    const piece = BoardManager.getPieceAt(prevState.bitboards, from);
    if (!piece) return prevState;

    const newBitboards = BoardManager.cloneBitboards(prevState.bitboards);
    BoardManager.makeMove(newBitboards, from, to);

    const newActiveColor: 'white' | 'black' = prevState.activeColor === 'white' ? 'black' : 'white';
    const newHalfmoveClock = GameState.updateHalfmoveClock(prevState.halfmoveClock, prevState.bitboards, from, to);
    const newFullmoveNumber = prevState.activeColor === 'black' ? prevState.fullmoveNumber + 1 : prevState.fullmoveNumber;
    const newCastlingRights = GameState.updateCastlingRights(prevState.castlingRights, from, to, piece);
    const newEnPassantSquare = GameState.calculateEnPassantSquare(from, to, piece);

    const newFEN = FEN.convertChessGameStateToFen({
      ...prevState,
      bitboards: newBitboards,
      activeColor: newActiveColor,
      castlingRights: newCastlingRights,
      enPassantSquare: newEnPassantSquare,
      halfmoveClock: newHalfmoveClock,
      fullmoveNumber: newFullmoveNumber,
    });

    const newMoveHistory = GameState.addMoveToHistory(prevState, newFEN);
    const inCheck = BoardManager.isInCheck(newBitboards, newActiveColor);
    const newGameStatus = GameState.computeGameStatus(newBitboards, newActiveColor, inCheck, newHalfmoveClock, newMoveHistory);

    return {
      fen: newFEN,
      bitboards: newBitboards,
      activeColor: newActiveColor,
      castlingRights: newCastlingRights,
      enPassantSquare: newEnPassantSquare,
      halfmoveClock: newHalfmoveClock,
      fullmoveNumber: newFullmoveNumber,
      moveHistory: newMoveHistory,
      inCheck,
      gameStatus: newGameStatus,
    };
  }, []);

  const clearMoveCache = React.useCallback(() => {
    validMovesCache.current.clear();
  }, []);

  return {
    gameState,
    setGameState,
    computeNewGameState,
    getValidMoves,
    clearMoveCache
  };
};