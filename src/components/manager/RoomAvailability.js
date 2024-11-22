import React, { useState, useEffect, useCallback } from 'react';
import { firestore, auth } from '../../firebase/firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaChevronCircleLeft, FaChevronCircleRight, FaEdit, FaTrash } from 'react-icons/fa';
import { CiSearch } from "react-icons/ci";
import { GrPowerReset } from 'react-icons/gr';
import ManagerLayout from '../common/ManagerLayout';
import '../../styles/Manager/RoomAvailability.css';

const RoomAvailability = () => {
    const [rooms, setRooms] = useState([]);
    const [roomNo, setRoomNo] = useState('');
    const [capacity, setCapacity] = useState('');
    const [editRoom, setEditRoom] = useState(null);
    const [userId, setUserId] = useState(sessionStorage.getItem('userId') || '');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user && !userId) {
                const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserId(user.uid);
                    sessionStorage.setItem('userId', user.uid);
                } else {
                    toast.error('User data not found');
                }
            }
        };

        fetchUserData();
    }, [userId]);

    const fetchRooms = useCallback(async () => {
        if (userId) {
            const roomsQuery = query(collection(firestore, 'rooms'), where('userId', '==', userId));
            const roomSnapshot = await getDocs(roomsQuery);
            const roomData = roomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            roomData.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true, sensitivity: 'base' }));
            setRooms(roomData);
        }
    }, [userId]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const updateOccupancy = useCallback(async () => {
        const hostlersQuery = query(collection(firestore, 'hostlers'), where('userId', '==', userId));
        const hostlerSnapshot = await getDocs(hostlersQuery);
        const hostlerData = hostlerSnapshot.docs.map(doc => doc.data());

        const updatedRooms = rooms.map(room => {
            const occupancy = hostlerData.filter(hostler => hostler.roomNo === room.roomNo).length;
            return { ...room, occupancy };
        });

        setRooms(updatedRooms);
    }, [rooms, userId]);

    useEffect(() => {
        if (rooms.length > 0) {
            updateOccupancy();
        }
    }, [rooms, updateOccupancy]);

    const handleAddRoom = async (e) => {
        e.preventDefault();
        try {
            const roomsQuery = query(collection(firestore, 'rooms'), where('userId', '==', userId));
            const roomSnapshot = await getDocs(roomsQuery);
            const roomExists = roomSnapshot.docs.some(doc => doc.data().roomNo === roomNo);
            if (roomExists) {
                toast.error('Room already exists');
                return;
            }

            await addDoc(collection(firestore, 'rooms'), {
                roomNo,
                capacity: parseInt(capacity),
                occupancy: 0,
                userId,
            });
            toast.success('Room added successfully');
            handleReset();
            fetchRooms();
        } catch (error) {
            console.error('Error adding room', error);
            toast.error('Failed to add room');
        }
    };

    const handleEditRoom = (room) => {
        setEditRoom(room);
        setRoomNo(room.roomNo);
        setCapacity(room.capacity);
    };

    const handleUpdateRoom = async (e) => {
        e.preventDefault();
        try {
            const roomDocRef = doc(firestore, 'rooms', editRoom.id);
            await updateDoc(roomDocRef, {
                roomNo,
                capacity: parseInt(capacity)
            });
            toast.success('Room updated successfully');
            handleReset();
            fetchRooms();
        } catch (error) {
            console.error('Error updating room', error);
            toast.error('Failed to update room');
        }
    };

    const handleDeleteRoom = async (roomId) => {
        try {
            await deleteDoc(doc(firestore, 'rooms', roomId));
            toast.success('Room deleted successfully');
            setRooms(rooms.filter(room => room.id !== roomId));
        } catch (error) {
            console.error('Error deleting room', error);
            toast.error('Failed to delete room');
        }
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(filteredRooms.length / itemsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on search
    };

    const handleReset = () => {
        setRoomNo('');
        setCapacity('');
        setEditRoom(null);
    };

    const filteredRooms = rooms.filter(room => 
        room.roomNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const currentRooms = filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <ManagerLayout>
            <div className="room-availability-container">
                <h2>Room Availability</h2>
                <div className="search-bar-container">
                <CiSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Search by Room No"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="search-bar"
                />
            </div>

                <table>
                    <thead>
                        <tr>
                            <th>Room No</th>
                            <th>Capacity</th>
                            <th>Occupancy</th>
                            <th>Vacancy</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRooms.map((room) => (
                            <tr key={room.id}>
                                <td>{room.roomNo}</td>
                                <td>{room.capacity}</td>
                                <td>{room.occupancy}</td>
                                <td>{room.capacity - room.occupancy}</td>
                                <td>
                                    <button className="action-button" onClick={() => handleEditRoom(room)}>
                                        <FaEdit />
                                    </button>
                                    <button className="action-button" onClick={() => handleDeleteRoom(room.id)}>
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    <button className="page-button" onClick={handlePreviousPage} disabled={currentPage === 1}>
                        <FaChevronCircleLeft />
                    </button>
                    <button className="page-button" onClick={handleNextPage} disabled={currentPage === Math.ceil(filteredRooms.length / itemsPerPage)}>
                        <FaChevronCircleRight />
                    </button>
                </div>
                <form onSubmit={editRoom ? handleUpdateRoom : handleAddRoom}>
                    <label>
                        Room No:
                        <input className='room'
                            type="text"
                            value={roomNo}
                            onChange={(e) => setRoomNo(e.target.value)}
                            placeholder="Room No"
                            required
                        />
                    </label>
                    <label>
                        Capacity:
                        <input className='room'
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            placeholder="Capacity"
                            required
                        />
                    </label>
                    <div className="form-buttons">
                        <button type="button" onClick={handleReset} className="reset-button">
                            <GrPowerReset /> Reset
                        </button>
                        <button className="submit-button" type="submit">
                            {editRoom ? 'Update Room' : 'Add Room'}
                        </button>
                    </div>
                </form>
            </div>
        </ManagerLayout>
    );
};

export default RoomAvailability;
