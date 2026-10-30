import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

export class SocketIOProvider {
  constructor(socket, roomId, doc) {
    this.socket = socket;
    this.roomId = roomId;
    this.doc = doc;
    this.awareness = new awarenessProtocol.Awareness(doc);
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
    this._onAwarenessUpdate = this._onAwarenessUpdate.bind(this);
    this._onRemoteAwarenessUpdate = this._onRemoteAwarenessUpdate.bind(this);
    this._onRemoteAwarenessRemove = this._onRemoteAwarenessRemove.bind(this);

    // Subscribe to doc updates
    this.doc.on('update', this._onDocUpdate);

    // Subscribe to awareness updates
    this.awareness.on('update', this._onAwarenessUpdate);

    // Subscribe to socket events
    this.socket.on('connect', this._onConnect);
    this.socket.on('disconnect', this._onDisconnect);
    this.socket.on('yjs:sync-step1', this._onSyncStep1);
    this.socket.on('yjs:sync-step2', this._onSyncStep2);
    this.socket.on('yjs:update', this._onRemoteUpdate);
    this.socket.on('awareness:update', this._onRemoteAwarenessUpdate);
    this.socket.on('awareness:remove', this._onRemoteAwarenessRemove);

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

    // Re-announce awareness state if already set
    if (this.awareness.getLocalState() !== null) {
      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.doc.clientID]);
      this.socket.emit('awareness:update', {
        roomId: this.roomId,
        update: awarenessUpdate,
      });
    }
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

  _onAwarenessUpdate({ added, updated, removed }, origin) {
    if (origin !== 'remote') {
      const changedClients = added.concat(updated).concat(removed);
      const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
      this.socket.emit('awareness:update', {
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

  _onRemoteAwarenessUpdate(data) {
    if (data.roomId !== this.roomId || !data.update) return;
    const update = new Uint8Array(data.update);
    awarenessProtocol.applyAwarenessUpdate(this.awareness, update, 'remote');
  }

  _onRemoteAwarenessRemove(data) {
    if (data.roomId !== this.roomId || !data.clientIds) return;
    awarenessProtocol.removeAwarenessStates(this.awareness, data.clientIds, 'remote');
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
    // Notify peers that local awareness state is removed
    try {
      awarenessProtocol.removeAwarenessStates(this.awareness, [this.doc.clientID], 'local');
    } catch (e) {
      // ignore
    }

    this.doc.off('update', this._onDocUpdate);
    this.awareness.off('update', this._onAwarenessUpdate);

    this.socket.off('connect', this._onConnect);
    this.socket.off('disconnect', this._onDisconnect);
    this.socket.off('yjs:sync-step1', this._onSyncStep1);
    this.socket.off('yjs:sync-step2', this._onSyncStep2);
    this.socket.off('yjs:update', this._onRemoteUpdate);
    this.socket.off('awareness:update', this._onRemoteAwarenessUpdate);
    this.socket.off('awareness:remove', this._onRemoteAwarenessRemove);

    this.awareness.destroy();
    this._listeners.clear();
  }
}


