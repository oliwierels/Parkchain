// backend/services/websocketService.js
import { WebSocketServer } from 'ws';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of ws connections
    this.rooms = new Map(); // roomId -> Set of ws connections
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws, req) => {
      console.log('✅ New WebSocket connection established');

      // Store connection metadata
      ws.userId = null;
      ws.rooms = new Set();
      ws.isAlive = true;

      // Pong handler for keepalive
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Message handler
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ WebSocket message parse error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Close handler
      ws.on('close', () => {
        console.log(`🔌 WebSocket connection closed for user: ${ws.userId}`);
        this.removeClient(ws);
      });

      // Error handler
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString()
      }));
    });

    // Heartbeat interval to detect broken connections
    const heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('💀 Terminating dead connection');
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(heartbeatInterval);
    });

    console.log('🚀 WebSocket server initialized');
  }

  handleMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case 'authenticate':
        this.authenticate(ws, data);
        break;

      case 'join_room':
        this.joinRoom(ws, data.roomId);
        break;

      case 'leave_room':
        this.leaveRoom(ws, data.roomId);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      default:
        console.warn(`⚠️  Unknown message type: ${type}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${type}`
        }));
    }
  }

  authenticate(ws, data) {
    const { userId } = data;

    if (!userId) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'User ID required'
      }));
      return;
    }

    ws.userId = userId;

    // Store client connection
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    console.log(`✅ User ${userId} authenticated. Total connections: ${this.clients.get(userId).size}`);

    ws.send(JSON.stringify({
      type: 'authenticated',
      userId,
      timestamp: new Date().toISOString()
    }));
  }

  joinRoom(ws, roomId) {
    if (!roomId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room ID required' }));
      return;
    }

    ws.rooms.add(roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(ws);

    console.log(`✅ Client joined room: ${roomId}. Room size: ${this.rooms.get(roomId).size}`);

    ws.send(JSON.stringify({
      type: 'joined_room',
      roomId,
      timestamp: new Date().toISOString()
    }));
  }

  leaveRoom(ws, roomId) {
    if (!roomId) return;

    ws.rooms.delete(roomId);

    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);

      // Clean up empty rooms
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
        console.log(`🧹 Room ${roomId} deleted (empty)`);
      }
    }

    console.log(`👋 Client left room: ${roomId}`);
  }

  removeClient(ws) {
    // Remove from user clients
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId).delete(ws);
      if (this.clients.get(ws.userId).size === 0) {
        this.clients.delete(ws.userId);
      }
    }

    // Remove from all rooms
    ws.rooms.forEach(roomId => {
      this.leaveRoom(ws, roomId);
    });
  }

  // ========== BROADCAST METHODS ==========

  // Broadcast to specific user (all their connections)
  broadcastToUser(userId, message) {
    if (!this.clients.has(userId)) {
      console.log(`⚠️  No connections found for user ${userId}`);
      return;
    }

    const connections = this.clients.get(userId);
    const payload = JSON.stringify(message);

    connections.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(payload);
      }
    });

    console.log(`📤 Broadcasted to user ${userId} (${connections.size} connections)`);
  }

  // Broadcast to specific room
  broadcastToRoom(roomId, message) {
    if (!this.rooms.has(roomId)) {
      console.log(`⚠️  Room ${roomId} not found`);
      return;
    }

    const connections = this.rooms.get(roomId);
    const payload = JSON.stringify(message);

    connections.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(payload);
      }
    });

    console.log(`📤 Broadcasted to room ${roomId} (${connections.size} connections)`);
  }

  // Broadcast to all connected clients
  broadcastToAll(message) {
    const payload = JSON.stringify(message);
    let sentCount = 0;

    this.wss.clients.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(payload);
        sentCount++;
      }
    });

    console.log(`📢 Broadcasted to all clients (${sentCount} connections)`);
  }

  // ========== SPECIFIC EVENT EMITTERS ==========

  // Emit parking availability update
  emitParkingUpdate(parkingLotId, availableSpots, occupiedSpots) {
    const message = {
      type: 'parking_update',
      data: {
        parkingLotId,
        availableSpots,
        occupiedSpots,
        timestamp: new Date().toISOString()
      }
    };

    // Broadcast to room for this specific parking lot
    this.broadcastToRoom(`parking_${parkingLotId}`, message);

    // Also broadcast to general parking feed
    this.broadcastToRoom('parking_feed', message);
  }

  // Emit new reservation
  emitReservationCreated(reservation) {
    const message = {
      type: 'reservation_created',
      data: {
        ...reservation,
        timestamp: new Date().toISOString()
      }
    };

    // Notify the user who made the reservation
    this.broadcastToUser(reservation.user_id, message);

    // Notify parking lot owner
    if (reservation.owner_id) {
      this.broadcastToUser(reservation.owner_id, message);
    }

    // Update parking lot room
    this.broadcastToRoom(`parking_${reservation.parking_lot_id}`, message);
  }

  // Emit charging session update
  emitChargingSessionUpdate(session) {
    const message = {
      type: 'charging_session_update',
      data: {
        ...session,
        timestamp: new Date().toISOString()
      }
    };

    // Notify the user
    this.broadcastToUser(session.user_id, message);

    // Notify charging station room
    this.broadcastToRoom(`charging_${session.station_id}`, message);

    // Broadcast to charging feed
    this.broadcastToRoom('charging_feed', message);
  }

  // Emit marketplace transaction
  emitMarketplaceTransaction(transaction) {
    const message = {
      type: 'marketplace_transaction',
      data: {
        ...transaction,
        timestamp: new Date().toISOString()
      }
    };

    // Notify buyer
    if (transaction.buyer_id) {
      this.broadcastToUser(transaction.buyer_id, message);
    }

    // Notify seller
    if (transaction.seller_id) {
      this.broadcastToUser(transaction.seller_id, message);
    }

    // Broadcast to marketplace feed
    this.broadcastToRoom('marketplace_feed', message);
  }

  // Emit notification to user
  emitNotification(userId, notification) {
    const message = {
      type: 'notification',
      data: {
        ...notification,
        timestamp: new Date().toISOString()
      }
    };

    this.broadcastToUser(userId, message);
  }

  // Get stats
  getStats() {
    return {
      totalConnections: this.wss ? this.wss.clients.size : 0,
      authenticatedUsers: this.clients.size,
      activeRooms: this.rooms.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
