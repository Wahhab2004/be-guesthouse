import { Room } from "@prisma/client";

export const formatRoom = (room: Room) => {
  return {
    ...room,
    roomCode: `R${String(room.id).padStart(3, '0')}`,
  };
};

export const formatRooms = (rooms: Room[]) => {
  return rooms.map(formatRoom);
};
