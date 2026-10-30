import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../../store/roomStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { updateMemberRoleApi, removeMemberApi, deleteRoomApi } from '../../api/rooms.js';

export function MembersModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { room, role, members: storeMembers, setRoom } = useRoomStore();
  const user = useAuthStore((state) => state.user);
  const [loadingMemberId, setLoadingMemberId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !room) return null;

  const isOwner = role === 'owner';
  const currentUserId = user?.id || user?._id;

  // Merge room.members (from DB) with storeMembers (which has live online status)
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
    if (!window.confirm('Are you sure you want to leave this room?')) {
      return;
    }
    setLoadingMemberId(currentUserId);
    try {
      await removeMemberApi(room.id, currentUserId);
      onClose();
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to leave room');
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleDeleteRoom = async () => {
    const confirmName = window.prompt(
      `Warning: Deleting this room will permanently delete all associated documents, chat messages, and execution runs.\n\nType "${room.name}" to confirm:`
    );
    if (confirmName !== room.name) {
      if (confirmName !== null) alert('Room name did not match. Deletion cancelled.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRoomApi(room.id);
      onClose();
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete room');
      setIsDeleting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Room Members ({memberList.length})</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.memberList}>
          {memberList.map((member, idx) => {
            const userObj = member.userId && typeof member.userId === 'object' ? member.userId : null;
            const memberId = userObj?._id || userObj?.id || member.userId;
            const memberIdStr = memberId ? memberId.toString() : '';
            const name = userObj?.name || 'Member';
            const email = userObj?.email || '';
            const color = userObj?.avatarColor || '#38bdf8';
            const isMemberOwner = member.role === 'owner';
            const isOnline = onlineStatusMap.has(memberIdStr) ? onlineStatusMap.get(memberIdStr) : false;
            const isCurrent = currentUserId && memberIdStr === currentUserId.toString();

            return (
              <div key={memberIdStr || idx} style={styles.memberItem}>
                <div style={styles.memberInfo}>
                  <div style={styles.avatarWrapper}>
                    <div style={{ ...styles.avatar, backgroundColor: color }}>
                      {name[0]?.toUpperCase() || 'U'}
                    </div>
                    <span
                      style={{
                        ...styles.statusDot,
                        backgroundColor: isOnline ? '#22c55e' : '#64748b',
                      }}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div>
                    <div style={styles.nameRow}>
                      <span style={styles.memberName}>{name}</span>
                      {isCurrent && <span style={styles.youBadge}>You</span>}
                      {isMemberOwner && <span style={styles.ownerBadge}>Owner</span>}
                      <span style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                    {email && <div style={styles.memberEmail}>{email}</div>}
                  </div>
                </div>

                <div style={styles.controls}>
                  {isOwner && !isMemberOwner ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(memberIdStr, e.target.value)}
                        disabled={loadingMemberId === memberIdStr}
                        style={styles.roleSelect}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleKick(memberIdStr, name)}
                        disabled={loadingMemberId === memberIdStr}
                        style={styles.kickButton}
                        title="Remove member from room"
                      >
                        Kick
                      </button>
                    </>
                  ) : (
                    <span style={styles.roleLabel}>{member.role}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions: Leave Room (for non-owners) or Delete Room (for owner) */}
        <div style={styles.footer}>
          {isOwner ? (
            <button
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              style={styles.deleteRoomButton}
            >
              {isDeleting ? 'Deleting room...' : '🗑 Delete Room'}
            </button>
          ) : (
            <button
              onClick={handleLeaveRoom}
              style={styles.leaveButton}
            >
              Leave Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    width: '100%',
    maxWidth: '540px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    padding: '24px',
    color: '#f8fafc',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    padding: '10px 14px',
    border: '1px solid #334155',
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    border: '2px solid #0f172a',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  memberName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f8fafc',
  },
  youBadge: {
    fontSize: '10px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '1px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  ownerBadge: {
    fontSize: '10px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    padding: '1px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  onlineText: {
    fontSize: '11px',
    color: '#64748b',
  },
  memberEmail: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roleSelect: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
  },
  kickButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  roleLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'capitalize',
    padding: '4px 8px',
  },
  footer: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #334155',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  deleteRoomButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  leaveButton: {
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};
