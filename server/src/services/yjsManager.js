import * as Y from 'yjs';
import { Document } from '../models/Document.js';
import logger from '../utils/logger.js';

class YjsManager {
  constructor() {
    // Map of roomId -> { doc, refCount, saveTimeout, destroyTimeout, initPromise }
    this.docs = new Map();
    this.debounceMs = 5000; // 5-second debounced save
    this.idleDestroyMs = 30000; // Destroy after 30s of 0 active users
  }

  async getDoc(roomId) {
    const id = roomId.toString();

    if (this.docs.has(id)) {
      const entry = this.docs.get(id);
      if (entry.destroyTimeout) {
        clearTimeout(entry.destroyTimeout);
        entry.destroyTimeout = null;
      }
      entry.refCount += 1;
      if (entry.initPromise) {
        return entry.initPromise;
      }
      return entry.doc;
    }

    const doc = new Y.Doc();
    const entry = {
      doc,
      refCount: 1,
      saveTimeout: null,
      destroyTimeout: null,
      initPromise: null,
    };

    // Register synchronously in map before any async operations to eliminate race conditions
    this.docs.set(id, entry);

    entry.initPromise = (async () => {
      try {
        const docRecord = await Document.findOne({ roomId: id });
        if (docRecord?.yjsState && docRecord.yjsState.length > 0) {
          Y.applyUpdate(doc, new Uint8Array(docRecord.yjsState));
          logger.info({ roomId: id, byteLength: docRecord.yjsState.length }, 'Loaded Yjs snapshot from DB');
        }
      } catch (err) {
        logger.error({ err, roomId: id }, 'Failed to load document snapshot from database');
      } finally {
        entry.initPromise = null;
      }
      return doc;
    })();

    return entry.initPromise;
  }

  releaseDoc(roomId) {
    const id = roomId.toString();
    const entry = this.docs.get(id);
    if (!entry) return;

    entry.refCount = Math.max(0, entry.refCount - 1);

    if (entry.refCount === 0) {
      // Flush snapshot to database immediately
      this.saveSnapshot(id);

      // Schedule cleanup after idle timeout
      entry.destroyTimeout = setTimeout(() => {
        if (entry.refCount === 0) {
          entry.doc.destroy();
          this.docs.delete(id);
          logger.info({ roomId: id }, 'Destroyed idle in-memory Y.Doc');
        }
      }, this.idleDestroyMs);
    }
  }

  scheduleSave(roomId) {
    const id = roomId.toString();
    const entry = this.docs.get(id);
    if (!entry) return;

    if (entry.saveTimeout) {
      return; // Already debounced
    }

    entry.saveTimeout = setTimeout(async () => {
      entry.saveTimeout = null;
      await this.saveSnapshot(id);
    }, this.debounceMs);
  }

  async saveSnapshot(roomId) {
    const id = roomId.toString();
    const entry = this.docs.get(id);
    if (!entry) return;

    try {
      // Compaction: create fresh doc and re-encode to trim transaction history
      const rawUpdate = Y.encodeStateAsUpdate(entry.doc);
      const compactedDoc = new Y.Doc();
      Y.applyUpdate(compactedDoc, rawUpdate);
      const compactedUpdate = Y.encodeStateAsUpdate(compactedDoc);
      compactedDoc.destroy();

      await Document.findOneAndUpdate(
        { roomId: id },
        {
          yjsState: Buffer.from(compactedUpdate),
          updatedAt: new Date(),
        },
        { upsert: true }
      );

      logger.debug({ roomId: id, size: compactedUpdate.byteLength }, 'Saved Yjs document snapshot to DB');
    } catch (err) {
      logger.error({ err, roomId: id }, 'Failed to save Yjs snapshot to database');
    }
  }

  getText(roomId) {
    const id = roomId.toString();
    const entry = this.docs.get(id);
    if (!entry) return '';
    return entry.doc.getText('monaco').toString();
  }
}

export const yjsManager = new YjsManager();
