// socket.ts
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:8000', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
});

export default socket;