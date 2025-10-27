// frontend/src/services/websocketService.js

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // 2 seconds
    this.listeners = new Map(); // eventType -> Set of callback functions
    this.isAuthenticated = false;
    this.userId = null;
    this.url = null;
    this.reconnectTimeout = null;
  }

  // Connect to WebSocket server
  connect(url = null, userId = null) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    // Use provided URL or default to current host
    this.url = url || `ws://${window.location.hostname}:3000`;
    this.userId = userId;

    console.log(`🔌 Connecting to WebSocket: ${this.url}`);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;

        // Authenticate if userId provided
        if (this.userId) {
          this.authenticate(this.userId);
        }

        // Emit connected event
        this.emit('connected', { timestamp: new Date().toISOString() });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message.type);

          // Handle authentication confirmation
          if (message.type === 'authenticated') {
            this.isAuthenticated = true;
            console.log('✅ WebSocket authenticated');
          }

          // Emit the message to all listeners for this type
          this.emit(message.type, message.data);

          // Also emit to generic message listeners
          this.emit('message', message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason);
        this.isAuthenticated = false;

        this.emit('disconnected', {
          code: event.code,
          reason: event.reason
        });

        // Attempt to reconnect
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  // Authenticate with userId
  authenticate(userId) {
    if (!this.isConnected()) {
      console.warn('⚠️ Cannot authenticate - not connected');
      return;
    }

    this.userId = userId;
    this.send({
      type: 'authenticate',
      data: { userId }
    });

    console.log(`🔐 Authenticating with user ID: ${userId}`);
  }

  // Disconnect
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isAuthenticated = false;
    console.log('👋 WebSocket disconnected');
  }

  // Attempt to reconnect
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached');
      this.emit('reconnect_failed', {
        attempts: this.reconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      console.log('🔄 Attempting to reconnect...');
      this.connect(this.url, this.userId);
    }, delay);
  }

  // Check if connected
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  // Send message
  send(message) {
    if (!this.isConnected()) {
      console.warn('⚠️ Cannot send message - not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  // Join a room
  joinRoom(roomId) {
    return this.send({
      type: 'join_room',
      data: { roomId }
    });
  }

  // Leave a room
  leaveRoom(roomId) {
    return this.send({
      type: 'leave_room',
      data: { roomId }
    });
  }

  // Subscribe to specific parking lot updates
  subscribeToParkingLot(parkingLotId) {
    return this.joinRoom(`parking_${parkingLotId}`);
  }

  // Subscribe to general parking feed
  subscribeToParkingFeed() {
    return this.joinRoom('parking_feed');
  }

  // Subscribe to charging station updates
  subscribeToChargingStation(stationId) {
    return this.joinRoom(`charging_${stationId}`);
  }

  // Subscribe to charging feed
  subscribeToChargingFeed() {
    return this.joinRoom('charging_feed');
  }

  // Subscribe to marketplace feed
  subscribeToMarketplaceFeed() {
    return this.joinRoom('marketplace_feed');
  }

  // Add event listener
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      this.off(eventType, callback);
    };
  }

  // Remove event listener
  off(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      return;
    }

    this.listeners.get(eventType).delete(callback);

    // Clean up empty sets
    if (this.listeners.get(eventType).size === 0) {
      this.listeners.delete(eventType);
    }
  }

  // Emit event to all listeners
  emit(eventType, data) {
    if (!this.listeners.has(eventType)) {
      return;
    }

    this.listeners.get(eventType).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Error in event listener for ${eventType}:`, error);
      }
    });
  }

  // Remove all listeners
  removeAllListeners(eventType = null) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// Auto-connect when user is logged in
const initializeWebSocket = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3000`;

      websocketService.connect(wsUrl, user.id);

      console.log('🚀 WebSocket service initialized for user:', user.id);
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
    }
  }
};

// Initialize on module load
initializeWebSocket();

export default websocketService;
export { initializeWebSocket };
