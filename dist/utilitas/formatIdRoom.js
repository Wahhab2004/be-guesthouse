"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRooms = exports.formatRoom = void 0;
const formatRoom = (room) => {
    return Object.assign(Object.assign({}, room), { roomCode: `R${String(room.id).padStart(3, '0')}` });
};
exports.formatRoom = formatRoom;
const formatRooms = (rooms) => {
    return rooms.map(exports.formatRoom);
};
exports.formatRooms = formatRooms;
