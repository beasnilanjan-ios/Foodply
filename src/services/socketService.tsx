import { io } from 'socket.io-client';
import GlobalApi  from '../GlobalContainer/GlobalApi'

const socket = io(`${GlobalApi.socket_url}`, {
  transports: ['websocket'],
  autoConnect: false,
});

socket.on('connect', () => {
  console.log('Socket connected, id:', socket.id);
});

socket.on('connect_error', (err: any) => {
  console.log('Socket connect_error:', err && err.message ? err.message : err);
  console.log('Connect Error:', err);
  console.log('Message:', err.message);
  console.log('Description:', err.description);
});

socket.on('disconnect', (reason: any) => {
  console.log('Socket disconnected:', reason);
});

socket.on('reconnect_attempt', (attempt: any) => {
  console.log('Socket reconnect_attempt:', attempt);
});

export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export default socket;