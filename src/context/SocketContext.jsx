import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      auth: {
        token: document.cookie.match(/jwt=([^;]+)/)?.[1] || '',
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setConnected(false);
    });

    // Platform-wide Broadcast Listener
    newSocket.on('admin_broadcast', (data) => {
      console.log('[Socket] Received admin_broadcast:', data);
      const { title, message, type } = data;
      
      const toastStyles = {
        info: { background: 'rgba(59, 130, 246, 0.95)', border: '1px solid rgba(59, 130, 246, 0.5)' },
        warning: { background: 'rgba(245, 158, 11, 0.95)', border: '1px solid rgba(245, 158, 11, 0.5)' },
        critical: { background: 'rgba(225, 29, 72, 0.95)', border: '1px solid rgba(225, 29, 72, 0.5)' }
      };

      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full shadow-2xl rounded-2xl pointer-events-auto flex p-4 text-white backdrop-blur-md`}
          style={toastStyles[type] || toastStyles.info}
        >
          <div className="flex-1 w-0">
            <h4 className="text-sm font-bold mb-1 uppercase tracking-wider">{title}</h4>
            <p className="text-sm leading-relaxed font-medium">{message}</p>
          </div>
          <div className="ml-4 flex shrink-0">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="inline-flex rounded-md text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ), { duration: type === 'critical' ? 10000 : 6000, position: 'top-center' });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
