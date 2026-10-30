const PERMISSIONS = {
  owner: new Set([
    'manage_room',
    'delete_room',
    'manage_members',
    'change_language',
    'edit',
    'run',
    'chat',
    'save_snippet',
    'read',
  ]),
  editor: new Set([
    'change_language',
    'edit',
    'run',
    'chat',
    'save_snippet',
    'read',
  ]),
  viewer: new Set([
    'chat',
    'read',
  ]),
};

export function can(role, action) {
  if (!role || !PERMISSIONS[role]) return false;
  return PERMISSIONS[role].has(action);
}

export function getUserRoleInRoom(room, userId) {
  if (!room || !userId) return null;
  const uid = userId.toString();

  if (room.ownerId && room.ownerId.toString() === uid) {
    return 'owner';
  }

  const member = room.members?.find(
    (m) => (m.userId?._id ? m.userId._id.toString() : m.userId?.toString()) === uid
  );

  return member ? member.role : null;
}
