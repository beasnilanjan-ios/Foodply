import { io } from 'socket.io-client';
import GlobalApi  from '../GlobalContainer/GlobalApi'

const socket = io(`${GlobalApi.socket_url}delivery-tracking`, {
  transports: ['websocket'],
  autoConnect: false,
});

export default socket;