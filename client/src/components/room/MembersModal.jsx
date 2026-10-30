import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { updateMemberRoleApi, removeMemberApi, deleteRoomApi } from '../../api/rooms.js';
import { Users, UserMinus, Trash2, LogOut, X, Shield, Loader2 } from 'lucide-react';

export function MembersModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { room, role, members: storeMembers, setRoom } = useRoomStore();
  const user = useAuthStore((state) => state.user);
  const [loadingMemberId, setLoadingMemberId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !room) return null;

  const isOwner = role === 'owner';
  const currentUserId = user?.id || user?._id;

  const onlineStatusMap = new Map();
  if (Array.isArray(storeMembers)) {
    storeMembers.forEach((m) => {
      const mId = m.userId?._id || m.userId?.id || m.userId;
      if (mId) {
        onlineStatusMap.set(mId.toString(), Boolean(m.online));
      }
    });
  }

  const memberList = room.members || [];

  const handleRoleChange = async (memberUserId, newRole) => {
    setLoadingMemberId(memberUserId);
    try {
      await updateMemberRoleApi(room.id, memberUserId, newRole);
      const updatedMembers = memberList.map((m) => {
        const mId = m.userId?._id || m.userId?.id || m.userId;
        return mId?.toString() === memberUserId.toString()
          ? { ...m, role: newRole }
          : m;
      });
      setRoom({ ...room, members: updatedMembers }, role);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update member role');
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleKick = async (memberUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || 'this member'} from the room?`)) {
      return;
    }
    setLoadingMemberId(memberUserId);
    try {
      await removeMemberApi(room.id, memberUserId);
      const updatedMembers = memberList.filter((m) => {
        const mId = m.userId?._id || m.userId?.id || m.userId;
        return mId?.toString() !== memberUserId.toString();
      });
      setRoom({ ...room, members: updatedMembers }, role);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove member');
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleLeaveRoom = async () => {
    if (!window.confirm('Are you sure you want to leave this workspace?')) {
      return;
    }
    try {
      await removeMemberApi(room.id, currentUserId);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to leave room');
    }
  };

  const handleDeleteRoom = async () => {
    if (!window.confirm('DANGER: Deleting this workspace is irreversible. All code, documents, chat messages, and run history will be permanently destroyed. Continue?')) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteRoomApi(room.id);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete room');
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="glass-strong modal-content"
        onClick={(e) => e.stopPropagation()}
        style={styles.modalBox}
      >
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="mac-traffic-lights">
              <span className="mac-dot mac-dot-close" onClick={onClose} style={{ cursor: 'pointer' }} />
              <span className="mac-dot mac-dot-min" />
              <span className="mac-dot mac-dot-max" />
            </div>
            <h3 style={styles.title}>Workspace Members & Permissions</h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div style={styles.list}>
          {memberList.map((m) => {
            const memberUser = m.userId;
            const memberId = memberUser?._id || memberUser?.id || memberUser;
            const memberName = memberUser?.name || 'User';
            const memberEmail = memberUser?.email || '';
            const isSelf = memberId?.toString() === currentUserId?.toString();
            const isThisMemberOwner = m.role === 'owner';
            const isOnline = onlineStatusMap.get(memberId?.toString()) ?? false;
            const isLoadingThis = loadingMemberId === memberId;

            return (
              <div key={memberId} className="glass-subtle" style={styles.memberRow}>
                <div style={styles.memberLeft}>
                  <div style={styles.avatarContainer}>
                    <div
                      style={{
                        ...styles.avatar,
                        backgroundColor: memberUser?.avatarColor || 'var(--primary)',
                      }}
                    >
                      {memberName[0].toUpperCase()}
                    </div>
                    <div
                      style={{
                        ...styles.statusDot,
                        backgroundColor: isOnline ? 'var(--success)' : 'var(--text-muted)',
                      }}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>

                  <div style={styles.nameMeta}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={styles.memberName}>{memberName}</span>
                      {isSelf && (
                        <span className="badge-glass badge-primary" style={{ fontSize: '0.625rem' }}>
                          You
                        </span>
                      )}
                    </div>
                    <span style={styles.memberEmail}>{memberEmail}</span>
                  </div>
                </div>

                <div style={styles.memberRight}>
                  {/* Role Control */}
                  {isOwner && !isThisMemberOwner ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(memberId, e.target.value)}
                      disabled={isLoadingThis}
                      className="input-glass"
                      style={styles.roleSelect}
                    >
                      <option value="editor" style={{ background: 'var(--bg-base)' }}>Editor</option>
                      <option value="viewer" style={{ background: 'var(--bg-base)' }}>Viewer</option>
                    </select>
                  ) : (
                    <span
                      className="badge-glass"
                      style={{
                        backgroundColor:
                          m.role === 'owner'
                            ? 'rgba(124, 147, 255, 0.15)'
                            : m.role === 'editor'
                            ? 'rgba(45, 212, 191, 0.15)'
                            : 'rgba(100, 116, 139, 0.15)',
                        color:
                          m.role === 'owner'
                            ? 'var(--primary)'
                            : m.role === 'editor'
                            ? 'var(--secondary)'
                            : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontSize: '0.6875rem',
                      }}
                    >
                      {m.role}
                    </span>
                  )}

                  {/* Kick action */}
                  {isOwner && !isThisMemberOwner && (
                    <button
                      onClick={() => handleKick(memberId, memberName)}
                      disabled={isLoadingThis}
                      className="btn btn-ghost"
                      style={styles.kickBtn}
                      title={`Remove ${memberName} from room`}
                    >
                      <UserMinus size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          {!isOwner && (
            <button onClick={handleLeaveRoom} className="btn btn-secondary" style={{ gap: '6px' }}>
              <LogOut size={15} />
              <span>Leave Workspace</span>
            </button>
          )}

          {isOwner && (
            <button
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="btn btn-danger"
              style={{ gap: '6px' }}
            >
              {isDeleting ? (
                <>
                  <Loader2 size={15} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>Delete Workspace</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalBox: {
    width: '100%',
    maxWidth: '560px',
    padding: '24px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--glass-border-subtle)',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '380px',
    overflowY: 'auto',
    marginBottom: '20px',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
  },
  memberLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '0.8125rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: '-1px',
    right: '-1px',
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    border: '2px solid var(--bg-base)',
  },
  nameMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  memberName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  memberEmail: {
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
  },
  memberRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roleSelect: {
    padding: '4px 8px',
    fontSize: '0.75rem',
    height: '28px',
    width: 'auto',
    cursor: 'pointer',
  },
  kickBtn: {
    padding: '6px',
    color: 'var(--danger)',
    borderRadius: 'var(--radius-sm)',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border-subtle)',
  },
};
