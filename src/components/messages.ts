// ✅ Base interface
export interface BaseMessage {
  type: string;
  timestamp?: number;
}

export interface AuthenticateMessage extends BaseMessage {
  type: 'AUTHENTICATE';
  playerId: string;
}


export interface AuthenticatedMessage extends BaseMessage {
  type: 'AUTHENTICATED';
}

export interface AuthenticationFailedMessage extends BaseMessage {
  type: 'AUTHENTICATION_FAILED';
  reason: string;
  message: string;
  shouldRelogin?: boolean; 
}

export interface ReconnectedMessage extends BaseMessage {
  type: 'RECONNECTED';
  playerId: string;
  message: string;
  missedMessages?: ServerMessage[];  // ✅ Messages sent while disconnected
}

// ✅ CLIENT MESSAGES (Client → Server)
export interface FindGameMessage extends BaseMessage {
  type: 'FIND_GAME';
  playerId: string;
  timeControl: string;          // ✅ Use English time control types
  timeCategory: string;       // ✅ Use English time category
  playerElo: number;                 // ✅ Current ELO for this time category
}

export interface CancelSearchMessage extends BaseMessage {
  type: 'CANCEL_SEARCH';
  playerId: string;
}

// export interface MakeMoveMessage extends BaseMessage {
//   type: 'MAKE_MOVE';
//   gameId: string;
//   playerId: string;
//   move: {
//     from: string;
//     to: string;
//     promotion?: string;  // ✅ Added for pawn promotion
//   };
// }

// export interface ResignMessage extends BaseMessage {  // ✅ Added missing resign message
//   type: 'RESIGN';
//   gameId: string;
//   playerId: string;
// }

// export interface DrawOfferMessage extends BaseMessage {  // ✅ Add draw offer
//   type: 'DRAW_OFFER';
//   gameId: string;
//   playerId: string;
// }

// export interface DrawResponseMessage extends BaseMessage {  // ✅ Add draw response
//   type: 'DRAW_RESPONSE';
//   gameId: string;
//   playerId: string;
//   accepted: boolean;
// }

// // ✅ SERVER MESSAGES (Server → Client)
export interface GameFoundMessage extends BaseMessage {
  type: 'MATCH_FOUND';
  gameId: string;
  color: 'white' | 'black';
  opponentId: string;
  opponentUsername?: string;          // ✅ Add opponent username
  opponentElo?: number;               // ✅ Add opponent ELO for this time category
  timeControl: TimeControl;           // ✅ English time control
  timeCategory: TimeCategory;         // ✅ English time category
  eloCategory: EloCategory;           // ✅ Which ELO rating is used
}

// export interface WaitingMessage extends BaseMessage {
//   type: 'WAITING';
//   message: string;
//   queuePosition?: number;             // ✅ Add queue position
//   estimatedWait?: number;             // ✅ Add estimated wait time (seconds)
//   timeControl?: TimeControl;          // ✅ English time control user is waiting for
//   playersInQueue?: number;            // ✅ Total players in this time control queue
// }

// export interface GameStateMessage extends BaseMessage {
//   type: 'GAME_STATE';
//   gameId: string;
//   fen: string;
//   activeColor: 'white' | 'black';
//   status: 'playing' | 'finished' | 'checkmate' | 'stalemate' | 'draw';
//   isCheck?: boolean;        // ✅ Added missing property
//   moves?: string[];         // ✅ Added missing property (SAN notation array)
//   whiteTime?: number;       // ✅ Add remaining time in milliseconds
//   blackTime?: number;       // ✅ Add remaining time in milliseconds
//   timeControl?: TimeControl; // ✅ English time control
// }

// export interface MoveMadeMessage extends BaseMessage {
//   type: 'MOVE_MADE';
//   gameId: string;
//   fen: string;
//   move: {
//     from: string;
//     to: string;
//     san: string;            // ✅ Added missing SAN notation (e.g., "e4", "Nf3")
//     piece?: string;         // ✅ Added piece type
//     captured?: string;      // ✅ Added captured piece
//     promotion?: string;     // ✅ Added promotion piece
//   };
//   byPlayer: string;
//   byColor?: 'white' | 'black';      // ✅ Added missing property
//   activeColor: 'white' | 'black';   // ✅ Added missing property
//   isCheck?: boolean;                // ✅ Added missing property
//   timeLeft?: {                      // ✅ Add time remaining
//     white: number;
//     black: number;
//   };
// }

// export interface InvalidMoveMessage extends BaseMessage {
//   type: 'INVALID_MOVE';
//   reason: string;
//   move: {
//     from: string;
//     to: string;
//   };
// }

// export interface GameOverMessage extends BaseMessage {
//   type: 'GAME_OVER';
//   gameId: string;
//   result: 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'disconnect' | 'threefold_repetition' | 'insufficient_material' | 'fifty_move_rule' | 'timeout';  // ✅ Added timeout
//   winner?: 'white' | 'black' | null;
//   resignedBy?: string;              // ✅ Added missing property
//   finalFen?: string;                // ✅ Added missing property
//   totalMoves?: number;              // ✅ Added missing property
//   duration?: number;                // ✅ Added missing property (in milliseconds)
//   eloChanges?: {                    // ✅ ELO rating changes
//     white: {
//       oldElo: number;
//       newElo: number;
//       change: number;
//     };
//     black: {
//       oldElo: number;
//       newElo: number;
//       change: number;
//     };
//   };
//   timeControl?: TimeControl;        // ✅ English time control
//   eloCategory?: EloCategory;        // ✅ Which ELO was affected
// }

// export interface OpponentDisconnectedMessage extends BaseMessage {  // ✅ Added missing message type
//   type: 'OPPONENT_DISCONNECTED';
//   gameId: string;
//   disconnectedColor: 'white' | 'black';
//   message: string;
//   reconnectWindow?: number;         // ✅ Time window for reconnection (seconds)
// }

// export interface SearchCancelledMessage extends BaseMessage {  // ✅ Added missing message type
//   type: 'SEARCH_CANCELLED';
//   message: string;
//   reason?: string;                  // ✅ Add cancellation reason
// }

// export interface DrawOfferReceivedMessage extends BaseMessage {  // ✅ Add draw offer notification
//   type: 'DRAW_OFFER_RECEIVED';
//   gameId: string;
//   fromPlayer: string;
//   message: string;
// }

// export interface ServerNotificationMessage extends BaseMessage {  // ✅ Add server notifications
//   type: 'SERVER_NOTIFICATION';
//   level: 'info' | 'warning' | 'error';
//   message: string;
//   autoHide?: boolean;
// }

export interface ErrorMessage extends BaseMessage {
  type: 'ERROR';
  message: string;
  code?: string;                    // ✅ Error code for handling
  retry?: boolean;                  // ✅ Whether client should retry
}

// ✅ UNION TYPES
export type ClientMessage = 
  | AuthenticateMessage     // ✅ Add auth messages
  | FindGameMessage 
  | CancelSearchMessage 
  // | MakeMoveMessage
  // | ResignMessage          // ✅ Added missing type
  // | DrawOfferMessage       // ✅ Add draw offer
  // | DrawResponseMessage;   // ✅ Add draw response

export type ServerMessage = 
  | AuthenticatedMessage           // ✅ Add auth responses
  | AuthenticationFailedMessage    // ✅ Add auth failed
  | ReconnectedMessage            // ✅ Add reconnection
  | GameFoundMessage 
  // | WaitingMessage 
  // | GameStateMessage 
  // | MoveMadeMessage 
  // | InvalidMoveMessage 
  // | GameOverMessage 
  // | OpponentDisconnectedMessage   // ✅ Added missing type
  // | SearchCancelledMessage        // ✅ Added missing type
  // | DrawOfferReceivedMessage      // ✅ Add draw offer
  // | ServerNotificationMessage     // ✅ Add notifications
  | ErrorMessage;

// // ✅ UTILITY TYPES
// export type GameStatus = 'waiting' | 'playing' | 'finished' | 'paused';
// export type GameResult = 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'disconnect' | 'timeout';
// export type PlayerColor = 'white' | 'black';

// // ✅ HELPER FUNCTIONS (Updated for English format)
// export const parseTimeControl = (timeControl: string): { minutes: number; increment?: number } => {
//   if (timeControl.includes('+')) {
//     const [base, increment] = timeControl.split('+');
//     return {
//       minutes: parseInt(base),
//       increment: parseInt(increment)
//     };
//   }
  
//   const minutes = parseInt(timeControl.replace('min', ''));
//   return { minutes };
// };

// export const formatTimeControl = (timeControl: TimeControl): string => {
//   const parsed = parseTimeControl(timeControl);
//   if (parsed.increment) {
//     return `${parsed.minutes}+${parsed.increment}`;
//   }
//   return `${parsed.minutes} min`;
// };

// // ✅ TYPE GUARDS for runtime type checking
// export const isClientMessage = (message: any): message is ClientMessage => {
//   return message && typeof message.type === 'string' && 
//     ['AUTHENTICATE', 'PING', 'PONG', 'FIND_GAME', 'CANCEL_SEARCH', 'MAKE_MOVE', 'RESIGN', 'DRAW_OFFER', 'DRAW_RESPONSE'].includes(message.type);
// };

// export const isServerMessage = (message: any): message is ServerMessage => {
//   return message && typeof message.type === 'string' && 
//     ['AUTHENTICATED', 'AUTHENTICATION_FAILED', 'RECONNECTED', 'GAME_FOUND', 'WAITING', 'GAME_STATE', 'MOVE_MADE', 'INVALID_MOVE', 'GAME_OVER', 'OPPONENT_DISCONNECTED', 'SEARCH_CANCELLED', 'DRAW_OFFER_RECEIVED', 'SERVER_NOTIFICATION', 'ERROR'].includes(message.type);
// };

// export const isAuthMessage = (message: ClientMessage): message is AuthenticateMessage => {
//   return message.type === 'AUTHENTICATE';
// };

// export const isGameMessage = (message: ClientMessage): message is MakeMoveMessage | ResignMessage => {
//   return ['MAKE_MOVE', 'RESIGN'].includes(message.type);
// };

// export const isTimeControlValid = (timeControl: string): timeControl is TimeControl => {
//   const validTimeControls: TimeControl[] = [
//     '1min', '1+1', '2+1',
//     '3min', '3+2', '5min', 
//     '10min', '15+10', '30min'
//   ];
//   return validTimeControls.includes(timeControl as TimeControl);
// };

// // ✅ HELPER FUNCTIONS for Vietnamese/English conversion (for backward compatibility)
// export const mapVietnameseToEnglish = (vietnameseTime: string, vietnameseCategory: string): { timeControl: TimeControl; timeCategory: TimeCategory } => {
//   const timeMapping: Record<string, TimeControl> = {
//     '1 phút': '1min',
//     '1|1': '1+1',
//     '2|1': '2+1',
//     '3 phút': '3min',
//     '3|2': '3+2',
//     '5 phút': '5min',
//     '10 phút': '10min',
//     '15 | 10': '15+10',
//     '30 phút': '30min'
//   };

//   const categoryMapping: Record<string, TimeCategory> = {
//     'Siêu Chớp': 'Bullet',
//     'Chớp': 'Blitz',
//     'Cờ Chớp': 'Rapid'
//   };

//   return {
//     timeControl: timeMapping[vietnameseTime] || '5min',
//     timeCategory: categoryMapping[vietnameseCategory] || 'Blitz'
//   };
// };

// export const mapEnglishToVietnamese = (englishTime: TimeControl, englishCategory: TimeCategory): { timeControl: string; timeCategory: string } => {
//   const timeMapping: Record<TimeControl, string> = {
//     '1min': '1 phút',
//     '1+1': '1|1',
//     '2+1': '2|1',
//     '3min': '3 phút',
//     '3+2': '3|2',
//     '5min': '5 phút',
//     '10min': '10 phút',
//     '15+10': '15 | 10',
//     '30min': '30 phút'
//   };

//   const categoryMapping: Record<TimeCategory, string> = {
//     'Bullet': 'Siêu Chớp',
//     'Blitz': 'Chớp',
//     'Rapid': 'Cờ Chớp'
//   };

//   return {
//     timeControl: timeMapping[englishTime] || '5 phút',
//     timeCategory: categoryMapping[englishCategory] || 'Chớp'
//   };
// };