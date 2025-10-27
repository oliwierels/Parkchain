// frontend/src/hooks/useWebSocket.js
import { useEffect, useState, useCallback } from 'react';
import websocketService from '../services/websocketService';

/**
 * React hook for WebSocket functionality
 * @param {string} eventType - The event type to listen for
 * @param {function} callback - Callback function when event is received
 * @returns {object} WebSocket utilities
 */
export const useWebSocket = (eventType = null, callback = null) => {
  const [isConnected, setIsConnected] = useState(websocketService.isConnected());
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    // Update connection status
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);

    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);

    // Listen to specific event type if provided
    let unsubscribe = null;
    if (eventType && callback) {
      unsubscribe = websocketService.on(eventType, callback);
    }

    // Cleanup
    return () => {
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [eventType, callback]);

  // Send message
  const send = useCallback((message) => {
    return websocketService.send(message);
  }, []);

  // Join room
  const joinRoom = useCallback((roomId) => {
    return websocketService.joinRoom(roomId);
  }, []);

  // Leave room
  const leaveRoom = useCallback((roomId) => {
    return websocketService.leaveRoom(roomId);
  }, []);

  return {
    isConnected,
    lastMessage,
    send,
    joinRoom,
    leaveRoom,
    service: websocketService
  };
};

/**
 * Hook for subscribing to parking lot updates
 * @param {string} parkingLotId - Parking lot ID to subscribe to
 * @param {function} onUpdate - Callback when parking lot is updated
 */
export const useParkingUpdates = (parkingLotId, onUpdate) => {
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !parkingLotId) return;

    // Subscribe to parking lot updates
    websocketService.subscribeToParkingLot(parkingLotId);

    // Listen for updates
    const unsubscribe = websocketService.on('parking_update', (data) => {
      if (data.parkingLotId === parkingLotId && onUpdate) {
        onUpdate(data);
      }
    });

    // Cleanup
    return () => {
      websocketService.leaveRoom(`parking_${parkingLotId}`);
      unsubscribe();
    };
  }, [parkingLotId, onUpdate, isConnected]);
};

/**
 * Hook for subscribing to parking feed (all parking updates)
 * @param {function} onUpdate - Callback when any parking is updated
 */
export const useParkingFeed = (onUpdate) => {
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to parking feed
    websocketService.subscribeToParkingFeed();

    // Listen for updates
    const unsubscribe = websocketService.on('parking_update', onUpdate);

    // Cleanup
    return () => {
      websocketService.leaveRoom('parking_feed');
      unsubscribe();
    };
  }, [onUpdate, isConnected]);
};

/**
 * Hook for subscribing to charging station updates
 * @param {string} stationId - Station ID to subscribe to
 * @param {function} onUpdate - Callback when station is updated
 */
export const useChargingStationUpdates = (stationId, onUpdate) => {
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !stationId) return;

    // Subscribe to charging station
    websocketService.subscribeToChargingStation(stationId);

    // Listen for updates
    const unsubscribe = websocketService.on('charging_session_update', (data) => {
      if (data.station_id === stationId && onUpdate) {
        onUpdate(data);
      }
    });

    // Cleanup
    return () => {
      websocketService.leaveRoom(`charging_${stationId}`);
      unsubscribe();
    };
  }, [stationId, onUpdate, isConnected]);
};

/**
 * Hook for subscribing to charging feed (all charging updates)
 * @param {function} onUpdate - Callback when any charging session is updated
 */
export const useChargingFeed = (onUpdate) => {
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to charging feed
    websocketService.subscribeToChargingFeed();

    // Listen for updates
    const unsubscribe = websocketService.on('charging_session_update', onUpdate);

    // Cleanup
    return () => {
      websocketService.leaveRoom('charging_feed');
      unsubscribe();
    };
  }, [onUpdate, isConnected]);
};

/**
 * Hook for subscribing to marketplace updates
 * @param {function} onTransaction - Callback when transaction occurs
 */
export const useMarketplaceFeed = (onTransaction) => {
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to marketplace feed
    websocketService.subscribeToMarketplaceFeed();

    // Listen for transactions
    const unsubscribe = websocketService.on('marketplace_transaction', onTransaction);

    // Cleanup
    return () => {
      websocketService.leaveRoom('marketplace_feed');
      unsubscribe();
    };
  }, [onTransaction, isConnected]);
};

/**
 * Hook for listening to notifications
 * @param {function} onNotification - Callback when notification is received
 */
export const useNotifications = (onNotification) => {
  const { isConnected } = useWebSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!isConnected) return;

    // Listen for notifications
    const unsubscribe = websocketService.on('notification', (data) => {
      setNotifications(prev => [data, ...prev]);
      if (onNotification) {
        onNotification(data);
      }
    });

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [onNotification, isConnected]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    notifications,
    clearNotifications,
    removeNotification
  };
};

export default useWebSocket;
