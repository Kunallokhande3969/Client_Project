import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log(' Socket connected locally');
});

socket.on('connect_error', (error) => {
  console.log('⚠️ Socket error:', error.message);
});

export default socket;