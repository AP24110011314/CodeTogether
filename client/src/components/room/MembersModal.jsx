import React, { useState } from 'react';
import { useRoomStore } from '../../store/roomStore.js';
import { updateMemberRoleApi, removeMemberApi } from '../../api/rooms.js';

export function MembersModal({ isOpen, onClose }) {
  const { room, role, setRoom } = useRoomStore();
  const [loadingMemberId, setLoadingMemberId] = useState(null);

  if (!isOpen || !room) return null;

  const isOwner = role === 'owner';

  const handleRoleChange = async (memberUserId, newRole) => {
    setLoadingMemberId(memberUserId);
    try {
      await updateMemberRoleApi(room.id, memberUserId, newRole);
      const updatedMembers = room.members.map((m) =>
        m.userId?._id === memberUserId || m.userId?.id === memberUserId || m.userId === memberUserId
          ? { ...m, role: newRole }
          : m
      );
      setRoom({ ...room, members: updatedMembers }, role);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update member role');
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleKick = async (memberUserId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    setLoadingMemberId(memberUserId);
    try {
      await removeMemberApi(room.id, memberUserId);
      const updatedMembers = room.members.filter(
        (m) => (m.userId?._id || m.userId?.id || m.userId) !== memberUserId
      );
      setRoom({ ...room, members: updatedMembers }, role);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove member');
    } finally {
      setLoadingMemberId(null);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Room Members ({room.members?.length || 1})</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.memberList}>
          {room.members?.map((member, idx) => {
            const userObj = member.userId && typeof member.userId === 'object' ? member.userId : null;
            const memberId = userObj?._id || userObj?.id || member.userId;
            const name = userObj?.name || 'Member';
            const email = userObj?.email || '';
            const color = userObj?.avatarColor || '#38bdf8';
            const isMemberOwner = member.role === 'owner';

            return (
              <div key={memberId || idx} style={styles.memberItem}>
                <div style={styles.memberInfo}>
                  <div style={{ ...styles.avatar, backgroundColor: color }}>
                    {name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.nameRow}>
                      <span style={styles.memberName}>{name}</span>
                      {isMemberOwner && <span style={styles.ownerBadge}>Owner</span>}
                    </div>
                    <div style={styles.memberEmail}>{email}</div>
                  </div>
                </div>

                <div style={styles.controls}>
                  {isOwner && !isMemberOwner ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(memberId, e.target.value)}
                        disabled={loadingMemberId === memberId}
                        style={styles.roleSelect}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleKick(memberId)}
                        disabled={loadingMemberId === memberId}
                        style={styles.kickButton}
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
    maxWidth: '520px',
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
    fontSize: '20px',
    fontWeight: '700',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '18px',
    cursor: 'pointer',
  },
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '380px',
    overflowY: 'auto',
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '14px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  memberName: {
    fontWeight: '600',
    fontSize: '14px',
  },
  ownerBadge: {
    fontSize: '10px',
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    padding: '1px 6px',
    borderRadius: '4px',
    fontWeight: '700',
  },
  memberEmail: {
    fontSize: '12px',
    color: '#94a3b8',
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
    backgroundColor: '#451a1a',
    color: '#f87171',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  roleLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'capitalize',
    padding: '4px 8px',
  },
};

