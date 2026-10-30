import * as Y from 'yjs';

export class SocketIOProvider {
  constructor(socket, roomId, doc) {
    this.socket = socket;
    this.roomId = roomId;
    this.doc = doc;
    this.status = socket.connected ? 'connected' : 'connecting';
    this.synced = false;
    this._listeners = new Map();

    // Bind event handlers
    this._onDocUpdate = this._onDocUpdate.bind(this);
    this._onConnect = this._onConnect.bind(this);
    this._onDisconnect = this._onDisconnect.bind(this);
    this._onSyncStep1 = this._onSyncStep1.bind(this);
    this._onSyncStep2 = this._onSyncStep2.bind(this);
    this._onRemoteUpdate = this._onRemoteUpdate.bind(this);

    // Subscribe to doc updates
    this.doc.on('update', this._onDocUpdate);

    // Subscribe to socket events
    this.socket.on('connect', this._onConnect);
    this.socket.on('disconnect', this._onDisconnect);
    this.socket.on('yjs:sync-step1', this._onSyncStep1);
    this.socket.on('yjs:sync-step2', this._onSyncStep2);
    this.socket.on('yjs:update', this._onRemoteUpdate);

    // If socket is already connected, initiate sync step 1 immediately
    if (this.socket.connected) {
      this._startSync();
    }
  }

  _startSync() {
    this.status = 'connected';
    this.emit('status', { status: 'connected' });

    const stateVector = Y.encodeStateVector(this.doc);
    this.socket.emit('yjs:sync-step1', {
      roomId: this.roomId,
      stateVector,
    });
  }

  _onDocUpdate(update, origin) {
    // Only broadcast local changes (origin !== 'remote')
    if (origin !== 'remote') {
      this.socket.emit('yjs:update', {
        roomId: this.roomId,
        update,
      });
    }
  }

  _onConnect() {
    this._startSync();
  }

  _onDisconnect() {
    this.status = 'disconnected';
    this.synced = false;
    this.emit('status', { status: 'disconnected' });
    this.emit('synced', false);
  }

  _onSyncStep1(data) {
    if (data.roomId !== this.roomId) return;
    const serverVector = new Uint8Array(data.stateVector);
    const clientDiff = Y.encodeStateAsUpdate(this.doc, serverVector);

    this.socket.emit('yjs:sync-step2', {
      roomId: this.roomId,
      update: clientDiff,
    });
  }

  _onSyncStep2(data) {
    if (data.roomId !== this.roomId) return;
    const update = new Uint8Array(data.update);

    if (update.byteLength > 0) {
      Y.applyUpdate(this.doc, update, 'remote');
    }

    this.synced = true;
    this.emit('synced', true);
  }

  _onRemoteUpdate(data) {
    if (data.roomId !== this.roomId) return;
    const update = new Uint8Array(data.update);
    Y.applyUpdate(this.doc, update, 'remote');
  }

  on(event, handler) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
  }

  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit(event, ...args) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.forEach((fn) => fn(...args));
    }
  }

  destroy() {
    this.doc.off('update', this._onDocUpdate);

    this.socket.off('connect', this._onConnect);
    this.socket.off('disconnect', this._onDisconnect);
    this.socket.off('yjs:sync-step1', this._onSyncStep1);
    this.socket.off('yjs:sync-step2', this._onSyncStep2);
    this.socket.off('yjs:update', this._onRemoteUpdate);

    this._listeners.clear();
  }
}
