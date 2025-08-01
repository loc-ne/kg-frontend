import { Piece, Position } from './types';
import { ClientGameState } from './GameState';


const BOARD_SIZE = 8;
const MIN_COORD = 0;
const MAX_COORD = BOARD_SIZE - 1;

export interface BitboardGame {
    // White pieces
    whitePawns: bigint;
    whiteRooks: bigint;
    whiteKnights: bigint;
    whiteBishops: bigint;
    whiteQueens: bigint;
    whiteKing: bigint;

    // Black pieces
    blackPawns: bigint;
    blackRooks: bigint;
    blackKnights: bigint;
    blackBishops: bigint;
    blackQueens: bigint;
    blackKing: bigint;
}

export const ChessEngine = {

    createBitboardGame(): BitboardGame {
        return {
            whitePawns: 0x000000000000FF00n,
            whiteRooks: 0x0000000000000081n,
            whiteKnights: 0x0000000000000042n,
            whiteBishops: 0x0000000000000024n,
            whiteQueens: 0x0000000000000008n,
            whiteKing: 0x0000000000000010n,

            blackPawns: 0x00FF000000000000n,
            blackRooks: 0x8100000000000000n,
            blackKnights: 0x4200000000000000n,
            blackBishops: 0x2400000000000000n,
            blackQueens: 0x0800000000000000n,
            blackKing: 0x1000000000000000n,
        };
    },


    // Helper: Get position of least significant bit
    getLSBPosition(bitboard: bigint): number {
        if (bitboard === 0n) return -1;

        let position = 0;
        let temp = bitboard;

        while ((temp & 1n) === 0n) {
            temp >>= 1n;
            position++;
        }

        return position;
    },

    // Helper: Clear least significant bit
    clearLSB(bitboard: bigint): bigint {
        return bitboard & (bitboard - 1n);
    },

    convertBitboardToCoordinates(bitBoard: bigint): Position[] {
        const coordinates: Position[] = [];
        let temp = bitBoard;

        while (temp !== 0n) {
            // Find least significant bit position
            const position = this.getLSBPosition(temp);

            // Convert bit position to row/col
            const row = Math.floor(position / 8);
            const col = position % 8;

            coordinates.push({ row, col });

            // Clear the least significant bit
            temp = this.clearLSB(temp);
        }

        return coordinates;
    },



    bitboardToBoard(game: BitboardGame): (Piece | null)[][] {
        const board: (Piece | null)[][] = Array(8).fill(null)
            .map(() => Array(8).fill(null));

        // White pieces
        const coordinatesOfWhitePawns = this.convertBitboardToCoordinates(game.whitePawns);
        coordinatesOfWhitePawns.forEach(pos =>
            board[pos.row][pos.col] = { type: 'pawn', color: 'white' }
        );

        const coordinatesOfWhiteRooks = this.convertBitboardToCoordinates(game.whiteRooks);
        coordinatesOfWhiteRooks.forEach(pos =>
            board[pos.row][pos.col] = { type: 'rook', color: 'white' }
        );

        const coordinatesOfWhiteKnights = this.convertBitboardToCoordinates(game.whiteKnights);
        coordinatesOfWhiteKnights.forEach(pos =>
            board[pos.row][pos.col] = { type: 'knight', color: 'white' }
        );

        const coordinatesOfWhiteBishops = this.convertBitboardToCoordinates(game.whiteBishops);
        coordinatesOfWhiteBishops.forEach(pos =>
            board[pos.row][pos.col] = { type: 'bishop', color: 'white' }
        );

        const coordinatesOfWhiteQueens = this.convertBitboardToCoordinates(game.whiteQueens);
        coordinatesOfWhiteQueens.forEach(pos =>
            board[pos.row][pos.col] = { type: 'queen', color: 'white' }
        );

        const coordinatesOfWhiteKing = this.convertBitboardToCoordinates(game.whiteKing);
        coordinatesOfWhiteKing.forEach(pos =>
            board[pos.row][pos.col] = { type: 'king', color: 'white' }
        );

        // Black pieces
        const coordinatesOfBlackPawns = this.convertBitboardToCoordinates(game.blackPawns);
        coordinatesOfBlackPawns.forEach(pos =>
            board[pos.row][pos.col] = { type: 'pawn', color: 'black' }
        );

        const coordinatesOfBlackRooks = this.convertBitboardToCoordinates(game.blackRooks);
        coordinatesOfBlackRooks.forEach(pos =>
            board[pos.row][pos.col] = { type: 'rook', color: 'black' }
        );

        const coordinatesOfBlackKnights = this.convertBitboardToCoordinates(game.blackKnights);
        coordinatesOfBlackKnights.forEach(pos =>
            board[pos.row][pos.col] = { type: 'knight', color: 'black' }
        );

        const coordinatesOfBlackBishops = this.convertBitboardToCoordinates(game.blackBishops);
        coordinatesOfBlackBishops.forEach(pos =>
            board[pos.row][pos.col] = { type: 'bishop', color: 'black' }
        );

        const coordinatesOfBlackQueens = this.convertBitboardToCoordinates(game.blackQueens);
        coordinatesOfBlackQueens.forEach(pos =>
            board[pos.row][pos.col] = { type: 'queen', color: 'black' }
        );

        const coordinatesOfBlackKing = this.convertBitboardToCoordinates(game.blackKing);
        coordinatesOfBlackKing.forEach(pos =>
            board[pos.row][pos.col] = { type: 'king', color: 'black' }
        );

        return board;
    },

    //  1. Optimized flip - chỉ flip coordinate, không flip board
    getSquareFromPerspective(row: number, col: number, playerColor: 'white' | 'black'): { row: number, col: number } {
        if (playerColor === 'black') {
            return { row: 7 - row, col: 7 - col };
        }
        return { row, col };
    },

    //  2. Render board theo perspective mà không tạo mảng mới
    renderBoardWithPerspective(game: BitboardGame, playerColor: 'white' | 'black', renderCallback: (row: number, col: number, piece: Piece | null) => void): void {
        for (let displayRow = 0; displayRow < 8; displayRow++) {
            for (let displayCol = 0; displayCol < 8; displayCol++) {
                // Convert display position to actual board position
                const actualPos = this.getSquareFromPerspective(displayRow, displayCol, playerColor);
                const piece = this.getPieceAt(game, actualPos);

                renderCallback(displayRow, displayCol, piece);
            }
        }
    },

    //  3. Efficient position conversion với validation
    convertPositionToPerspective(position: Position, playerColor: 'white' | 'black'): Position {
        if (playerColor === 'black') {
            return {
                row: 7 - position.row,
                col: 7 - position.col
            };
        }
        return { ...position }; // Clone để tránh mutation
    },

    //  4. Batch position conversion
    convertPositionArrayToPerspective(positions: Position[], playerColor: 'white' | 'black'): Position[] {
        if (playerColor === 'white') return positions; // No conversion needed

        return positions.map(pos => ({
            row: 7 - pos.row,
            col: 7 - pos.col
        }));
    },

    //  5. Optimized board creation cho specific perspective
    createBoardForPerspective(game: BitboardGame, playerColor: 'white' | 'black'): (Piece | null)[][] {
        const board: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

        if (playerColor === 'white') {
            // White perspective - normal board
            return this.bitboardToBoard(game);
        } else {
            // Black perspective - create flipped board directly
            for (let row = 0; row < 8; row++) {
                for (let col = 0; col < 8; col++) {
                    const actualRow = 7 - row;
                    const actualCol = 7 - col;
                    const piece = this.getPieceAt(game, { row: actualRow, col: actualCol });
                    board[row][col] = piece;
                }
            }
            return board;
        }
    },

    //  6. Get coordinate labels theo perspective
    getFileLabel(col: number, playerColor: 'white' | 'black'): string {
        if (playerColor === 'black') {
            return String.fromCharCode(104 - col); // h, g, f, e, d, c, b, a
        }
        return String.fromCharCode(97 + col); // a, b, c, d, e, f, g, h
    },

    getRankLabel(row: number, playerColor: 'white' | 'black'): string {
        if (playerColor === 'black') {
            return String(row + 1); // 1, 2, 3, 4, 5, 6, 7, 8
        }
        return String(8 - row); // 8, 7, 6, 5, 4, 3, 2, 1
    },

    //  7. Check if square color (light/dark) với flipped board
    isLightSquareFromPerspective(displayRow: number, displayCol: number): boolean {
        // Đối với light square: (row + col) % 2 === 0
        // Không cần convert về actual position vì pattern giữ nguyên
        return (displayRow + displayCol) % 2 === 0;
    },

    //  8. Convert algebraic notation theo perspective
    positionToAlgebraicFromPerspective(position: Position, playerColor: 'white' | 'black'): string {
        const actualPos = playerColor === 'black' ?
            { row: 7 - position.row, col: 7 - position.col } :
            position;

        const file = String.fromCharCode(97 + actualPos.col); // a-h
        const rank = String(8 - actualPos.row); // 1-8
        return file + rank;
    },

    //  9. Parse algebraic notation theo perspective
    algebraicToPositionFromPerspective(algebraic: string, playerColor: 'white' | 'black'): Position | null {
        if (algebraic.length !== 2) return null;

        const file = algebraic.charCodeAt(0) - 97; // a=0, b=1, ...
        const rank = parseInt(algebraic[1]) - 1;   // 1=0, 2=1, ...

        if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;

        const actualPos = { row: 7 - rank, col: file };

        if (playerColor === 'black') {
            return {
                row: 7 - actualPos.row,
                col: 7 - actualPos.col
            };
        }

        return actualPos;
    },

    isInCheck(game: BitboardGame, activeColor: string): boolean {
        const kingBitboard = activeColor === 'white' ? game.whiteKing : game.blackKing;
        const kingPosition = this.convertBitboardToCoordinates(kingBitboard)[0]; // King is single piece

        if (!kingPosition) return false;

        const enemyColor = activeColor === 'white' ? 'black' : 'white';

        return this.isSquareAttackedBy(game, kingPosition, enemyColor);
    },

    isSquareAttackedBy(game: BitboardGame, square: Position, attackerColor: string): boolean {
        if (attackerColor === 'black') {
            // Check black piece attacks
            if (this.isPawnAttack(game.blackPawns, square, 'black')) return true;
            if (this.isKnightAttack(game.blackKnights, square)) return true;
            if (this.isBishopAttack(game.blackBishops, game, square)) return true;
            if (this.isRookAttack(game.blackRooks, game, square)) return true;
            if (this.isQueenAttack(game.blackQueens, game, square)) return true;
            if (this.isKingAttack(game.blackKing, square)) return true;
        } else {
            // Check white piece attacks
            if (this.isPawnAttack(game.whitePawns, square, 'white')) return true;
            if (this.isKnightAttack(game.whiteKnights, square)) return true;
            if (this.isBishopAttack(game.whiteBishops, game, square)) return true;
            if (this.isRookAttack(game.whiteRooks, game, square)) return true;
            if (this.isQueenAttack(game.whiteQueens, game, square)) return true;
            if (this.isKingAttack(game.whiteKing, square)) return true;
        }

        return false;
    },

    isPawnAttack(pawns: bigint, targetSquare: Position, attackerColor: string): boolean {
        // Keep your clear logic structure
        let pawnAttackMoves: { row: number; col: number }[];

        if (attackerColor === 'black') {
            pawnAttackMoves = [
                { row: -1, col: -1 },  // Up-left from target square
                { row: -1, col: 1 }    // Up-right from target square
            ];
        } else {
            pawnAttackMoves = [
                { row: 1, col: -1 },   // Down-left from target square
                { row: 1, col: 1 }     // Down-right from target square
            ];
        }

        // But use bitwise operations for performance
        for (const move of pawnAttackMoves) {
            const pawnRow = targetSquare.row + move.row;
            const pawnCol = targetSquare.col + move.col;

            // Check bounds
            if (pawnRow >= MIN_COORD && pawnRow < MAX_COORD && pawnCol >= MIN_COORD && pawnCol < MAX_COORD) {
                //  Direct bitwise check (no array conversion)
                const attackPos = pawnRow * 8 + pawnCol;
                const attackBit = 1n << BigInt(attackPos);

                if ((pawns & attackBit) !== 0n) {
                    return true;
                }
            }
        }

        return false;
    },

    isKnightAttack(knights: bigint, targetSquare: Position): boolean {
        const knightMoves = [
            { row: -2, col: -1 }, { row: -2, col: 1 },
            { row: -1, col: -2 }, { row: -1, col: 2 },
            { row: 1, col: -2 }, { row: 1, col: 2 },
            { row: 2, col: -1 }, { row: 2, col: 1 }
        ];

        //  My performance optimization
        for (const move of knightMoves) {
            const knightRow = targetSquare.row + move.row;
            const knightCol = targetSquare.col + move.col;

            if (knightRow >= MIN_COORD && knightRow < MAX_COORD && knightCol >= MIN_COORD && knightCol < MAX_COORD) {
                const attackpos = knightRow * 8 + knightCol;
                const attackbit = 1n << BigInt(attackpos);
                if ((knights & attackbit) !== 0n) return true;
            }
        }

        return false;
    },

    isBishopAttack(bishops: bigint, game: BitboardGame, targetSquare: Position): boolean {
        const { row, col } = targetSquare;

        // Get all pieces on board for blocking detection
        const allPieces = this.getAllPieces(game);

        //  4 diagonal directions (bishop movement)
        const diagonalDirections = [
            { row: -1, col: -1 },  // Up-left
            { row: -1, col: 1 },   // Up-right  
            { row: 1, col: -1 },   // Down-left
            { row: 1, col: 1 }     // Down-right
        ];

        //  Ray cast in each diagonal direction
        for (const direction of diagonalDirections) {
            let currentRow = row + direction.row;
            let currentCol = col + direction.col;

            //  Cast ray until edge of board
            while (currentRow >= MIN_COORD && currentRow < MAX_COORD && currentCol >= MIN_COORD && currentCol < MAX_COORD) {
                const currentPos = currentRow * 8 + currentCol;
                const currentBit = 1n << BigInt(currentPos);

                //  If we hit any piece
                if ((allPieces & currentBit) !== 0n) {
                    // Check if it's an attacking bishop
                    if ((bishops & currentBit) !== 0n) {
                        return true; // Found attacking bishop
                    }
                    // Any other piece blocks the attack
                    break;
                }

                // Continue ray
                currentRow += direction.row;
                currentCol += direction.col;
            }
        }

        return false;
    },

    //  Helper function to get all pieces
    getAllPieces(game: BitboardGame): bigint {
        return game.whitePawns | game.whiteRooks | game.whiteKnights |
            game.whiteBishops | game.whiteQueens | game.whiteKing |
            game.blackPawns | game.blackRooks | game.blackKnights |
            game.blackBishops | game.blackQueens | game.blackKing;
    },

    //  Bonus: isRookAttack implementation
    isRookAttack(rooks: bigint, game: BitboardGame, targetSquare: Position): boolean {
        const { row, col } = targetSquare;
        const allPieces = this.getAllPieces(game);

        //  4 straight directions (rook movement)
        const straightDirections = [
            { row: -1, col: 0 },   // Up
            { row: 1, col: 0 },    // Down
            { row: 0, col: -1 },   // Left
            { row: 0, col: 1 }     // Right
        ];

        //  Same ray casting logic
        for (const direction of straightDirections) {
            let currentRow = row + direction.row;
            let currentCol = col + direction.col;

            while (currentRow >= MIN_COORD && currentRow < MAX_COORD && currentCol >= MIN_COORD && currentCol < MAX_COORD) {
                const currentPos = currentRow * 8 + currentCol;
                const currentBit = 1n << BigInt(currentPos);

                if ((allPieces & currentBit) !== 0n) {
                    if ((rooks & currentBit) !== 0n) {
                        return true; // Found attacking rook
                    }
                    break; // Blocked
                }

                currentRow += direction.row;
                currentCol += direction.col;
            }
        }

        return false;
    },

    //  Bonus: isQueenAttack implementation
    isQueenAttack(queens: bigint, game: BitboardGame, targetSquare: Position): boolean {
        // Queen = Rook + Bishop attacks
        return this.isRookAttack(queens, game, targetSquare) ||
            this.isBishopAttack(queens, game, targetSquare);
    },

    //  Bonus: isKingAttack implementation
    isKingAttack(king: bigint, targetSquare: Position): boolean {
        const { row, col } = targetSquare;

        // 8 directions (king can move 1 square in any direction)
        const kingMoves = [
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
        ];

        for (const move of kingMoves) {
            const kingRow = row + move.row;
            const kingCol = col + move.col;

            if (kingRow >= MIN_COORD && kingRow < MAX_COORD && kingCol >= MIN_COORD && kingCol < MAX_COORD) {
                const pos = kingRow * 8 + kingCol;
                const bit = 1n << BigInt(pos);
                if ((king & bit) !== 0n) return true;
            }
        }

        return false;
    },

    getPieceAt(game: BitboardGame, position: Position): Piece | null {
        const bit = 1n << BigInt(position.row * 8 + position.col);

        if ((game.whitePawns & bit) !== 0n) return { type: 'pawn', color: 'white' };
        if ((game.blackPawns & bit) !== 0n) return { type: 'pawn', color: 'black' };
        if ((game.whiteKnights & bit) !== 0n) return { type: 'knight', color: 'white' };
        if ((game.blackKnights & bit) !== 0n) return { type: 'knight', color: 'black' };
        if ((game.whiteBishops & bit) !== 0n) return { type: 'bishop', color: 'white' };
        if ((game.blackBishops & bit) !== 0n) return { type: 'bishop', color: 'black' };
        if ((game.whiteRooks & bit) !== 0n) return { type: 'rook', color: 'white' };
        if ((game.blackRooks & bit) !== 0n) return { type: 'rook', color: 'black' };
        if ((game.whiteQueens & bit) !== 0n) return { type: 'queen', color: 'white' };
        if ((game.blackQueens & bit) !== 0n) return { type: 'queen', color: 'black' };
        if ((game.whiteKing & bit) !== 0n) return { type: 'king', color: 'white' };
        if ((game.blackKing & bit) !== 0n) return { type: 'king', color: 'black' };

        return null;
    },

    generateMovesForPiece(game: BitboardGame, state: ClientGameState, fromPosition: Position): Position[] {
        const piece = this.getPieceAt(game, fromPosition);

        let moves: Position[] = [];

        switch (piece && piece.type) {
            case 'pawn':
                moves = this.generatePawnMoves(game, state, fromPosition);
                break;
            case 'knight':
                moves = this.generateKnightMoves(game, fromPosition);
                break;
            case 'bishop':
                moves = this.generateBishopMoves(game, fromPosition);
                break;
            case 'rook':
                moves = this.generateRookMoves(game, fromPosition);
                break;
            case 'queen':
                moves = this.generateQueenMoves(game, fromPosition);
                break;
            case 'king':
                //  Fixed: Correct parameters
                moves = this.generateKingMoves(game, state, fromPosition);
                break;
        }

        //  Filter out moves that leave own king in check
        return this.filterLegalMoves(game, state, fromPosition, moves);
    },

    filterLegalMoves(
        game: BitboardGame,
        state: ClientGameState,
        fromPosition: Position,
        moves: Position[]
    ): Position[] {
        const legalMoves: Position[] = [];

        for (const move of moves) {
            const newGame = this.cloneBitboards(game);

            this.makeMove(newGame, fromPosition, move);
            
            if (!this.isInCheck(newGame, state.activeColor)) {
                legalMoves.push(move);
            }
        }

        return legalMoves;
    },

    cloneBitboards(game: BitboardGame): BitboardGame {
        return {
            whitePawns: game.whitePawns,
            whiteRooks: game.whiteRooks,
            whiteKnights: game.whiteKnights,
            whiteBishops: game.whiteBishops,
            whiteQueens: game.whiteQueens,
            whiteKing: game.whiteKing,

            blackPawns: game.blackPawns,
            blackRooks: game.blackRooks,
            blackKnights: game.blackKnights,
            blackBishops: game.blackBishops,
            blackQueens: game.blackQueens,
            blackKing: game.blackKing,
        };
    },

    makeMove(game: BitboardGame, from: Position, to: Position): void {
        const piece = this.getPieceAt(game, from);
        if (!piece) return; //  Null safety

        //  1. Clear piece from source position
        this.clearPieceAt(game, from, piece);

        //  2. Handle capture (remove enemy piece if present)
        const capturedPiece = this.getPieceAt(game, to);
        if (capturedPiece) {
            this.clearPieceAt(game, to, capturedPiece);
        }

        //  3. Place piece at destination
        this.setPieceAt(game, to, piece);

        //  4. Handle special moves
        this.handleSpecialMoves(game, from, to, piece);
    },

    clearPieceAt(game: BitboardGame, position: Position, piece: Piece): void {
        const bit = 1n << BigInt(position.row * 8 + position.col);
        const clearBit = ~bit;

        if (piece.color === 'white') {
            switch (piece.type) {
                case 'pawn': game.whitePawns &= clearBit; break;
                case 'knight': game.whiteKnights &= clearBit; break;
                case 'bishop': game.whiteBishops &= clearBit; break;
                case 'rook': game.whiteRooks &= clearBit; break;
                case 'queen': game.whiteQueens &= clearBit; break;
                case 'king': game.whiteKing &= clearBit; break;
            }
        } else {
            switch (piece.type) {
                case 'pawn': game.blackPawns &= clearBit; break;
                case 'knight': game.blackKnights &= clearBit; break;
                case 'bishop': game.blackBishops &= clearBit; break;
                case 'rook': game.blackRooks &= clearBit; break;
                case 'queen': game.blackQueens &= clearBit; break;
                case 'king': game.blackKing &= clearBit; break;
            }
        }
    },

    setPieceAt(game: BitboardGame, position: Position, piece: Piece): void {
        const bit = 1n << BigInt(position.row * 8 + position.col);

        if (piece.color === 'white') {
            switch (piece.type) {
                case 'pawn': game.whitePawns |= bit; break;
                case 'knight': game.whiteKnights |= bit; break;
                case 'bishop': game.whiteBishops |= bit; break;
                case 'rook': game.whiteRooks |= bit; break;
                case 'queen': game.whiteQueens |= bit; break;
                case 'king': game.whiteKing |= bit; break;
            }
        } else {
            switch (piece.type) {
                case 'pawn': game.blackPawns |= bit; break;
                case 'knight': game.blackKnights |= bit; break;
                case 'bishop': game.blackBishops |= bit; break;
                case 'rook': game.blackRooks |= bit; break;
                case 'queen': game.blackQueens |= bit; break;
                case 'king': game.blackKing |= bit; break;
            }
        }
    },

    handleSpecialMoves(game: BitboardGame, from: Position, to: Position, piece: Piece): void {
        // En passant capture
        if (piece.type === 'pawn' && !this.getPieceAt(game, to) && Math.abs(to.col - from.col) === 1) {
            const capturedPawnRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
            const capturedPawnPos = { row: capturedPawnRow, col: to.col };
            const capturedPawn = this.getPieceAt(game, capturedPawnPos);

            if (capturedPawn && capturedPawn.type === 'pawn') {
                this.clearPieceAt(game, capturedPawnPos, capturedPawn);
            }
        }

        // Castling - move rook
        if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
            const isKingSide = to.col > from.col;
            const rookFromCol = isKingSide ? 7 : 0;
            const rookToCol = isKingSide ? 5 : 3;
            const rookFrom = { row: from.row, col: rookFromCol };
            const rookTo = { row: from.row, col: rookToCol };

            const rook = this.getPieceAt(game, rookFrom);
            if (rook && rook.type === 'rook') {
                this.clearPieceAt(game, rookFrom, rook);
                this.setPieceAt(game, rookTo, rook);
            }
        }

        // Pawn promotion (simplified - always promote to queen)
        if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
            this.clearPieceAt(game, to, piece);
            this.setPieceAt(game, to, { type: 'queen', color: piece.color });
        }
    },

    generatePawnMoves(game: BitboardGame, state: ClientGameState, from: Position): Position[] {
        const validMoves: Position[] = [];
        const piece = this.getPieceAt(game, from);

        if (!piece || piece.type !== 'pawn') return validMoves;

        const isWhite = piece.color === 'white';
        const direction = isWhite ? 1 : -1; 
        const startingRow = isWhite ? 1 : 6;
        const allPieces = this.getAllPieces(game);
        const enemyPieces = this.getAllPiecesOfColor(game, isWhite ? 'black' : 'white');

        // Forward move (1 square)
        const oneForward = { row: from.row + direction, col: from.col };
        if (this.isValidSquare(oneForward) && !this.isSquareOccupied(allPieces, oneForward)) {
            validMoves.push(oneForward);

            // Two squares forward from starting position
            if (from.row === startingRow) {
                const twoForward = { row: from.row + 2 * direction, col: from.col };
                if (this.isValidSquare(twoForward) && !this.isSquareOccupied(allPieces, twoForward)) {
                    validMoves.push(twoForward);
                }
            }
        }

        // Diagonal captures (only if enemy piece present)
        const captureLeft = { row: from.row + direction, col: from.col - 1 };
        const captureRight = { row: from.row + direction, col: from.col + 1 };

        if (this.isValidSquare(captureLeft) && this.isSquareOccupied(enemyPieces, captureLeft)) {
            validMoves.push(captureLeft);
        }

        if (this.isValidSquare(captureRight) && this.isSquareOccupied(enemyPieces, captureRight)) {
            validMoves.push(captureRight);
        }

        // En passant (proper validation)
        if (state.enPassantSquare) {
            const enPassantTargetRow = from.row + direction;
            if (state.enPassantSquare.row === enPassantTargetRow &&
                Math.abs(state.enPassantSquare.col - from.col) === 1) {
                validMoves.push(state.enPassantSquare);
            }
        }

        return validMoves;
    },

    // Add missing helper functions
    getAllPiecesOfColor(game: BitboardGame, color: string): bigint {
        if (color === 'white') {
            return game.whitePawns | game.whiteRooks | game.whiteKnights |
                game.whiteBishops | game.whiteQueens | game.whiteKing;
        } else {
            return game.blackPawns | game.blackRooks | game.blackKnights |
                game.blackBishops | game.blackQueens | game.blackKing;
        }
    },

    isValidSquare(position: Position): boolean {
        return position.row >= 0 && position.row < 8 &&
            position.col >= 0 && position.col < 8;
    },

    isSquareOccupied(pieces: bigint, position: Position): boolean {
        const bit = 1n << BigInt(position.row * 8 + position.col);
        return (pieces & bit) !== 0n;
    },

    generateKnightMoves(game: BitboardGame, from: Position): Position[] {
        const validMoves: Position[] = [];
        const piece = this.getPieceAt(game, from);

        // Check correct piece type
        if (!piece || piece.type !== 'knight') return validMoves;

        const ownPieces = this.getAllPiecesOfColor(game, piece.color);

        const knightMoves = [
            { row: -2, col: -1 }, { row: -2, col: 1 },
            { row: -1, col: -2 }, { row: -1, col: 2 },
            { row: 1, col: -2 }, { row: 1, col: 2 },
            { row: 2, col: -1 }, { row: 2, col: 1 }
        ];

        for (const move of knightMoves) {
            // Correct coordinate calculation
            const newRow = from.row + move.row;
            const newCol = from.col + move.col;  // Fixed: use from.col
            const newPosition = { row: newRow, col: newCol };

            // Correct movement logic: can move to empty square OR capture enemy
            if (this.isValidSquare(newPosition) && !this.isSquareOccupied(ownPieces, newPosition)) {
                validMoves.push(newPosition);
            }
        }

        return validMoves;
    },

    generateBishopMoves(game: BitboardGame, from: Position): Position[] {
        const validMoves: Position[] = [];
        const piece = this.getPieceAt(game, from);

        if (!piece || piece.type !== 'bishop') return validMoves;

        const allPieces = this.getAllPieces(game);
        const ownPieces = this.getAllPiecesOfColor(game, piece.color);

        const diagonalDirections = [
            { row: 1, col: 1 },    // Down-right
            { row: 1, col: -1 },   // Down-left  
            { row: -1, col: 1 },   // Up-right
            { row: -1, col: -1 }   // Up-left
        ];

        for (const direction of diagonalDirections) {
            let step = 1;

            while (true) {
                const newRow = from.row + step * direction.row;
                const newCol = from.col + step * direction.col;
                const newPosition = { row: newRow, col: newCol };

                // Check bounds
                if (!this.isValidSquare(newPosition)) {
                    break; // Off the board
                }

                const bit = 1n << BigInt(newRow * 8 + newCol);

                // Check if square is occupied
                if ((allPieces & bit) !== 0n) {
                    // Found a piece
                    if (!this.isSquareOccupied(ownPieces, newPosition)) {
                        // Enemy piece - can capture
                        validMoves.push(newPosition);
                    }
                    // Stop ray (can't jump over pieces)
                    break;
                } else {
                    // Empty square - can move here
                    validMoves.push(newPosition);
                }

                step++;
            }
        }

        return validMoves;
    },
    // Add to BoardManager
    generateRookMoves(game: BitboardGame, from: Position): Position[] {
        const validMoves: Position[] = [];
        const piece = this.getPieceAt(game, from);

        if (!piece || piece.type !== 'rook') return validMoves;

        const allPieces = this.getAllPieces(game);
        const ownPieces = this.getAllPiecesOfColor(game, piece.color);

        const straightDirections = [
            { row: -1, col: 0 },   // Up
            { row: 1, col: 0 },    // Down
            { row: 0, col: -1 },   // Left
            { row: 0, col: 1 }     // Right
        ];

        for (const direction of straightDirections) {
            let step = 1;

            while (true) {
                const newRow = from.row + step * direction.row;
                const newCol = from.col + step * direction.col;
                const newPosition = { row: newRow, col: newCol };

                //   Check bounds
                if (!this.isValidSquare(newPosition)) {
                    break; // Off the board
                }

                const bit = 1n << BigInt(newRow * 8 + newCol);

                //   Check if square is occupied
                if ((allPieces & bit) !== 0n) {
                    // Found a piece
                    if (!this.isSquareOccupied(ownPieces, newPosition)) {
                        // Enemy piece - can capture
                        validMoves.push(newPosition);
                    }
                    // Stop ray (can't jump over pieces)
                    break;
                } else {
                    // Empty square - can move here
                    validMoves.push(newPosition);
                }

                step++;
            }
        }

        return validMoves;
    },

    generateQueenMoves(game: BitboardGame, from: Position): Position[] {
        const validMoves: Position[] = [];
        const piece = this.getPieceAt(game, from);

        if (!piece || piece.type !== 'queen') return validMoves;

        const allPieces = this.getAllPieces(game);
        const ownPieces = this.getAllPiecesOfColor(game, piece.color);

        //  Queen = Rook + Bishop directions (8 total)
        const allDirections = [
            // Rook directions (straight)
            { row: -1, col: 0 },   // Up
            { row: 1, col: 0 },    // Down
            { row: 0, col: -1 },   // Left
            { row: 0, col: 1 },    // Right

            // Bishop directions (diagonal)
            { row: -1, col: -1 },  // Up-left
            { row: -1, col: 1 },   // Up-right
            { row: 1, col: -1 },   // Down-left
            { row: 1, col: 1 }     // Down-right
        ];

        for (const direction of allDirections) {
            let step = 1;

            while (true) {
                const newRow = from.row + step * direction.row;
                const newCol = from.col + step * direction.col;
                const newPosition = { row: newRow, col: newCol };

                //   Check bounds
                if (!this.isValidSquare(newPosition)) {
                    break; // Off the board
                }

                const bit = 1n << BigInt(newRow * 8 + newCol);

                //   Check if square is occupied
                if ((allPieces & bit) !== 0n) {
                    // Found a piece
                    if (!this.isSquareOccupied(ownPieces, newPosition)) {
                        // Enemy piece - can capture
                        validMoves.push(newPosition);
                    }
                    // Stop ray (can't jump over pieces)
                    break;
                } else {
                    // Empty square - can move here
                    validMoves.push(newPosition);
                }

                step++;
            }
        }

        return validMoves;
    },

    // Add to BoardManager
    generateKingMoves(game: BitboardGame, state: ClientGameState, from: Position): Position[] {
        const validMoves: Position[] = [];
        const piece = this.getPieceAt(game, from);

        if (!piece || piece.type !== 'king') return validMoves;

        const ownPieces = this.getAllPiecesOfColor(game, piece.color);
        const enemyColor = piece.color === 'white' ? 'black' : 'white';

        //   8 directions (king can move 1 square in any direction)
        const kingMoves = [
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
        ];

        //  Regular king moves (1 square in any direction)
        for (const move of kingMoves) {
            const newRow = from.row + move.row;
            const newCol = from.col + move.col;
            const newPosition = { row: newRow, col: newCol };

            // Check bounds
            if (!this.isValidSquare(newPosition)) {
                continue;
            }

            // Can't move to square occupied by own pieces
            if (this.isSquareOccupied(ownPieces, newPosition)) {
                continue;
            }

            //  Important: Can't move to square attacked by enemy
            if (this.isSquareAttackedBy(game, newPosition, enemyColor)) {
                continue;
            }

            validMoves.push(newPosition);
        }

        //  Castling moves (if not in check and castling rights available)
        const isInCheck = this.isInCheck(game, state.activeColor);
        if (!isInCheck) {
            // Kingside castling
            if (this.canCastleKingside(game, state, piece.color)) {
                const kingsideCastlePosition = {
                    row: from.row,
                    col: from.col + 2
                };
                validMoves.push(kingsideCastlePosition);
            }

            // Queenside castling
            if (this.canCastleQueenside(game, state, piece.color)) {
                const queensideCastlePosition = {
                    row: from.row,
                    col: from.col - 2
                };
                validMoves.push(queensideCastlePosition);
            }
        }

        return validMoves;
    },

    //  Helper: Check kingside castling
    canCastleKingside(game: BitboardGame, state: ClientGameState, color: string): boolean {
        const isWhite = color === 'white';

        // Check castling rights
        if (isWhite && !state.castlingRights.whiteKingSide) return false;
        if (!isWhite && !state.castlingRights.blackKingSide) return false;

        const kingRow = isWhite ? 7 : 0;
        const rookCol = 7;

        // Check if squares between king and rook are empty
        const squaresBetween = [
            { row: kingRow, col: 5 }, // f1 or f8
            { row: kingRow, col: 6 }  // g1 or g8
        ];

        const allPieces = this.getAllPieces(game);
        const enemyColor = isWhite ? 'black' : 'white';

        for (const square of squaresBetween) {
            // Square must be empty
            if (this.isSquareOccupied(allPieces, square)) {
                return false;
            }

            // Square must not be attacked by enemy
            if (this.isSquareAttackedBy(game, square, enemyColor)) {
                return false;
            }
        }

        // Check if rook is in correct position
        const rookPosition = { row: kingRow, col: rookCol };
        const rookPiece = this.getPieceAt(game, rookPosition);

        if (!rookPiece) return false;
        return rookPiece.type === 'rook' && rookPiece.color === color;
    },

    //  Helper: Check queenside castling
    canCastleQueenside(game: BitboardGame, state: ClientGameState, color: string): boolean {
        const isWhite = color === 'white';

        // Check castling rights
        if (isWhite && !state.castlingRights.whiteQueenSide) return false;
        if (!isWhite && !state.castlingRights.blackQueenSide) return false;

        const kingRow = isWhite ? 7 : 0;
        const rookCol = 0;

        // Check if squares between king and rook are empty
        const squaresBetween = [
            { row: kingRow, col: 1 }, // b1 or b8
            { row: kingRow, col: 2 }, // c1 or c8
            { row: kingRow, col: 3 }  // d1 or d8
        ];

        // Squares king moves through (must not be attacked)
        const squaresKingMovesThrough = [
            { row: kingRow, col: 2 }, // c1 or c8
            { row: kingRow, col: 3 }  // d1 or d8
        ];

        const allPieces = this.getAllPieces(game);
        const enemyColor = isWhite ? 'black' : 'white';

        // Check all squares between are empty
        for (const square of squaresBetween) {
            if (this.isSquareOccupied(allPieces, square)) {
                return false;
            }
        }

        // Check squares king moves through are not attacked
        for (const square of squaresKingMovesThrough) {
            if (this.isSquareAttackedBy(game, square, enemyColor)) {
                return false;
            }
        }

        // Check if rook is in correct position
        const rookPosition = { row: kingRow, col: rookCol };
        const rookPiece = this.getPieceAt(game, rookPosition);

        if (!rookPiece) return false;
        return rookPiece.type === 'rook' && rookPiece.color === color;
    }


};


