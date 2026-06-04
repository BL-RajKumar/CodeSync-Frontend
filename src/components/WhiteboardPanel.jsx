import React, { useState, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const WhiteboardPanel = ({ projectId, socket, collabSession }) => {
  const [initialElements, setInitialElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const excalidrawAPI = useRef(null);
  const isIncomingUpdate = useRef(false);

  // Load board elements from database on mount
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${apiUrl}/whiteboard/${projectId}`, { withCredentials: true });
        setInitialElements(res.data.elements || []);
      } catch (err) {
        console.error("Failed to load whiteboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [projectId]);

  // Handle incoming Socket.IO events to sync drawings in real-time
  useEffect(() => {
    if (!socket || !collabSession) return;

    const handleRemoteUpdate = ({ elements: remoteElements }) => {
      if (!excalidrawAPI.current) return;
      isIncomingUpdate.current = true;
      excalidrawAPI.current.updateScene({
        elements: remoteElements
      });
      // Small timeout to reset the flag after updating
      setTimeout(() => {
        isIncomingUpdate.current = false;
      }, 100);
    };

    socket.on('whiteboard-update', handleRemoteUpdate);

    return () => {
      socket.off('whiteboard-update', handleRemoteUpdate);
    };
  }, [socket, collabSession]);

  // Debounced database saving
  const saveTimeout = useRef(null);

  const onChange = (newElements, appState) => {
    if (isIncomingUpdate.current) return;

    // Broadcast drawing to other session participants
    if (socket && collabSession) {
      socket.emit('whiteboard-update', {
        sessionId: collabSession.sessionId,
        elements: newElements,
        appState
      });
    }

    // Debounce save operation to avoid overloading the DB
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await axios.post(`${apiUrl}/whiteboard/${projectId}`, {
          elements: newElements,
          appState
        }, { withCredentials: true });
      } catch (err) {
        console.error("Failed to save whiteboard:", err);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#1e1e2e] text-muted p-16">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-lg">Initializing Whiteboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative border border-white/10 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <Excalidraw
        excalidrawAPI={(api) => {
          excalidrawAPI.current = api;
        }}
        initialData={{
          elements: initialElements,
          appState: { theme: 'dark', viewBackgroundColor: '#1e1e2e' }
        }}
        onChange={onChange}
        theme="dark"
      />
    </div>
  );
};

export default WhiteboardPanel;
