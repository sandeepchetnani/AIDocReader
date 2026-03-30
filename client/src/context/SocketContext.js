import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(
      process.env.NODE_ENV === 'production' ? (process.env.REACT_APP_API_URL || 'https://aidocreader.onrender.com') : 'http://localhost:5001',
      {
        transports: ['websocket', 'polling']
      }
    );

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinDocument = (documentId) => {
    if (socket) {
      socket.emit('join-document', documentId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinDocument }}>
      {children}
    </SocketContext.Provider>
  );
};
