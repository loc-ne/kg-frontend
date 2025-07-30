import React from 'react';
import { Position, Piece as PieceInterface } from '../game/types';
import { ChessGameState } from '../game/GameState';
import { BoardManager } from '../game/Board.ts';
import Piece from '../components/Piece.tsx';

interface UseDragAndDropProps {
  gameState: ChessGameState;
  playerColor: 'white' | 'black';
  gameMode: string;
  currentTurn: 'white' | 'black';
  validMoves: Position[];
  boardRef: React.RefObject<HTMLDivElement | null>;
  getValidMoves: (position: Position) => Position[];
  onMove?: (from: Position, to: Position) => void;
  onPremove?: (from: Position, to: Position) => void;
  setValidMoves: (moves: Position[]) => void;
  // ✅ Add option to control premoves
  allowPremoves?: boolean;
}

interface DragState {
  isDragging: boolean;
  piece: PieceInterface | null;
  from: Position;
  startCoords: { x: number; y: number } | null;
}

export const useDragAndDrop = ({
  gameState,
  playerColor,
  gameMode,
  currentTurn,
  validMoves,
  boardRef,
  getValidMoves,
  onMove,
  onPremove,
  setValidMoves,
  allowPremoves = true // ✅ Default to true
}: UseDragAndDropProps) => {
  const [dragState, setDragState] = React.useState<DragState | null>(null);
  const [ghostPieceStyle, setGhostPieceStyle] = React.useState<React.CSSProperties>({
    display: 'none'
  });

  // ✅ ENHANCED: Coordinate calculation with better error handling
  const getSquareFromCoordinates = React.useCallback((x: number, y: number): Position | null => {
    const boardElement = boardRef.current;
    if (!boardElement) {
      console.warn('⚠️ Board element not found');
      return null;
    }

    const rect = boardElement.getBoundingClientRect();
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    const squareSize = rect.width / 8;

    // ✅ Bounds checking
    if (relativeX < 0 || relativeY < 0 || relativeX >= rect.width || relativeY >= rect.height) {
      console.log('🚫 Mouse outside board bounds');
      return null;
    }

    // ✅ Get display coordinates
    const displayCol = Math.floor(relativeX / squareSize);
    const displayRow = Math.floor(relativeY / squareSize);

    // ✅ Additional bounds check
    if (displayCol < 0 || displayCol >= 8 || displayRow < 0 || displayRow >= 8) {
      console.warn('⚠️ Display coordinates out of bounds:', { displayRow, displayCol });
      return null;
    }

    // ✅ PERFECT: Convert display coordinates to logical coordinates
    const logicalPosition = playerColor === 'black' 
      ? { row: 7 - displayRow, col: 7 - displayCol }  // Flip for black player
      : { row: displayRow, col: displayCol };          // Normal for white player
    
    console.log('🎯 Coordinate conversion:', {
      mousePos: { x, y },
      boardRect: { width: rect.width, height: rect.height },
      squareSize,
      displayPos: { row: displayRow, col: displayCol },
      logicalPos: logicalPosition,
      playerColor,
      isFlipped: playerColor === 'black'
    });
    
    return logicalPosition;
  }, [boardRef, playerColor]);

  // ✅ ENHANCED: Better drag initiation
  const handlePieceMouseDown = React.useCallback((
    e: React.MouseEvent,
    piece: PieceInterface,
    piecePosition: Position
  ) => {
    console.log('🖱️ ===== DRAG START =====');
    console.log('🎨 Player color:', playerColor);
    console.log('🔄 Current turn:', currentTurn);
    console.log('♟️ Piece:', `${piece.color} ${piece.type}`);
    console.log('📍 Logical position:', piecePosition);
    
    // ✅ Enhanced piece validation
    const canDragPiece = piece.color === playerColor;
    const isPieceOnBoard = BoardManager.getPieceAt(gameState.bitboards, piecePosition);
    
    console.log('✅ Can drag piece:', canDragPiece);
    console.log('✅ Piece exists on board:', !!isPieceOnBoard);
    
    if (!canDragPiece) {
      console.log('❌ Cannot drag opponent piece');
      return;
    }

    if (!isPieceOnBoard) {
      console.log('❌ Piece not found on board at position');
      return;
    }

    e.preventDefault();
    e.stopPropagation(); // ✅ Prevent event bubbling

    setDragState({
      isDragging: true,
      piece,
      from: piecePosition,
      startCoords: { x: e.clientX, y: e.clientY }
    });

    const moves = getValidMoves(piecePosition);
    console.log('🎯 Valid moves for piece:', moves.length, 'moves');
    setValidMoves(moves);

    // ✅ Enhanced visual feedback
    const isPlayerTurn = playerColor === currentTurn;
    const canMoveNow = isPlayerTurn;
    const willBePremove = !isPlayerTurn && allowPremoves;
    
    console.log('✅ Is player turn:', isPlayerTurn);
    console.log('✅ Can move now:', canMoveNow);
    console.log('🔮 Will be premove:', willBePremove);

    setGhostPieceStyle({
      display: 'block',
      position: 'fixed',
      left: e.clientX - 40,
      top: e.clientY - 40,
      zIndex: 9999,
      pointerEvents: 'none',
      opacity: canMoveNow ? 0.8 : (willBePremove ? 0.6 : 0.4),
      transform: 'scale(1.1)',
      filter: canMoveNow ? 'none' : (willBePremove ? 'sepia(0.3)' : 'grayscale(0.5)'),
      transition: 'opacity 0.1s ease-out'
    });
    
    console.log('✅ Drag initialized successfully');
    console.log('====================');
  }, [gameState.bitboards, getValidMoves, playerColor, currentTurn, setValidMoves, allowPremoves]);

  // ✅ ENHANCED: Mouse events with better error handling
  React.useEffect(() => {
    if (!dragState?.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // ✅ Smooth ghost piece movement
      setGhostPieceStyle(prev => ({
        ...prev,
        left: e.clientX - 40,
        top: e.clientY - 40
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      console.log('🖱️ ===== DRAG END =====');
      console.log('📍 Mouse position:', { x: e.clientX, y: e.clientY });
      
      const dropSquare = getSquareFromCoordinates(e.clientX, e.clientY);
      console.log('📍 Drop square (logical):', dropSquare);
      console.log('📍 Drag from (logical):', dragState.from);
      console.log('🎯 Available valid moves:', validMoves.length);

      let moveExecuted = false;

      if (dropSquare && dragState.from) {
        // ✅ Check if dropping on same square (cancel drag)
        const isSameSquare = dropSquare.row === dragState.from.row && 
                           dropSquare.col === dragState.from.col;
        
        if (isSameSquare) {
          console.log('🔄 Dropped on same square - canceling drag');
        } else {
          const isValid = validMoves.some(move =>
            move.row === dropSquare.row && move.col === dropSquare.col
          );
          
          console.log('✅ Is valid drop:', isValid);

          if (isValid) {
            const isPlayerTurn = currentTurn === playerColor;
            console.log('✅ Is player turn:', isPlayerTurn);

            if (isPlayerTurn) {
              console.log('✅ Executing normal move via drag & drop');
              console.log('   From:', `(${dragState.from.row}, ${dragState.from.col})`);
              console.log('   To:', `(${dropSquare.row}, ${dropSquare.col})`);
              onMove?.(dragState.from, dropSquare);
              moveExecuted = true;
            } else if (allowPremoves) {
              console.log('🔮 Adding premove via drag & drop');
              console.log('   From:', `(${dragState.from.row}, ${dragState.from.col})`);
              console.log('   To:', `(${dropSquare.row}, ${dropSquare.col})`);
              onPremove?.(dragState.from, dropSquare);
              moveExecuted = true;
            } else {
              console.log('❌ Not player turn and premoves disabled');
            }
          } else {
            console.log('❌ Invalid drop - not in valid moves');
          }
        }
      } else {
        console.log('❌ No drop square found or invalid drag state');
      }

      // ✅ Enhanced cleanup
      console.log('🧹 Cleaning up drag state');
      setDragState(null);
      setGhostPieceStyle({ 
        display: 'none',
        transition: 'opacity 0.2s ease-out'
      });

      // ✅ Clear valid moves only if no move was executed
      if (!moveExecuted) {
        console.log('🧹 Clearing valid moves (no move executed)');
        setValidMoves([]);
      }
      
      console.log('✅ Drag end processed');
      console.log('===================');
    };

    // ✅ Add escape key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('⏹️ Escape pressed - canceling drag');
        setDragState(null);
        setGhostPieceStyle({ display: 'none' });
        setValidMoves([]);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    dragState, 
    validMoves, 
    getSquareFromCoordinates, 
    gameMode, 
    playerColor, 
    currentTurn, 
    onMove, 
    onPremove, 
    setValidMoves,
    allowPremoves
  ]);

  // ✅ Enhanced piece visibility with better logic
  const isPieceVisible = React.useCallback((piecePosition: Position) => {
    if (!dragState?.isDragging || !dragState.from) return true;
    
    const isDraggedPiece = dragState.from.row === piecePosition.row &&
                          dragState.from.col === piecePosition.col;
    
    return !isDraggedPiece;
  }, [dragState]);

  // ✅ Enhanced ghost piece with better styling
  const renderGhostPiece = React.useCallback(() => {
    if (!dragState?.isDragging || !dragState.piece) return null;

    return (
      <div 
        style={ghostPieceStyle}
        className="ghost-piece" // ✅ Add class for potential CSS styling
      >
        <Piece
          type={dragState.piece.type}
          color={dragState.piece.color}
        />
      </div>
    );
  }, [dragState, ghostPieceStyle]);

  // ✅ Add utility function to check if currently dragging
  const isDragging = React.useMemo(() => {
    return dragState?.isDragging || false;
  }, [dragState]);

  return {
    dragState,
    ghostPieceStyle,
    handlePieceMouseDown,
    isPieceVisible,
    renderGhostPiece,
    isDragging // ✅ Export for external use
  };
};