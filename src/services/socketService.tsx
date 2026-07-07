import { io, Socket } from 'socket.io-client';
import GlobalApi  from '../GlobalContainer/GlobalApi'
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';

let socket: Socket | null = null;

function createSocket(token: string): Socket | null {
  if (socket) return socket;
  if (!token) return null;

  socket = io(GlobalApi.socket_url, {
    transports: ['polling', 'websocket'],
    auth: { token },
    autoConnect: false,
  });

  socket.on('connect', () => {
    console.log('Socket connected, id:', socket?.id);
  });

  socket.on('connect_error', (err: any) => {
    console.log('Socket connect_error:', err && err.message ? err.message : err);
    console.log('Connect Error:', err);
    console.log('Message:', err?.message);
    console.log('Description:', err?.description);
  });

  socket.on('disconnect', (reason: any) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('reconnect_attempt', (attempt: any) => {
    console.log('Socket reconnect_attempt:', attempt);
  });

  return socket;
}

export function connectSocket() {
  const token = GlobalLoginAuth.getBearerToken();
  console.log('SocketToken', token);
  if (!token) {
    console.log('connectSocket: no token available; socket not created.');
    return null;
  }

  const s = createSocket(token);
  if (s && !s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  socket = null;
}

export function getSocket() {
  return socket;
}

export default getSocket;