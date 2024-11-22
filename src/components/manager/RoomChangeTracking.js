import React, { useState, useEffect } from 'react';
import { firestore, auth } from '../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import ManagerLayout from '../common/ManagerLayout';
import { FaChevronCircleLeft, FaChevronCircleRight } from 'react-icons/fa';
import { GrPowerReset } from 'react-icons/gr';
import '../../styles/Manager/RoomChangeTracking.css';

const RoomChangeTracking = () => {
    const [rooms, setRooms] = useState([]);
    const [hostlers, setHostlers] = useState([]);
    const [formData, setFormData] = useState({
        oldRoomNo: '',
        name: '',
        newRoomNo: '',
    });
    const [hostlersInRoom, setHostlersInRoom] = useState([]);
    const [userId, setUserId] = useState(sessionStorage.getItem('userId') || '');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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

    useEffect(() => {
        const fetchRooms = async () => {
            if (userId) {
                const roomQuery = query(collection(firestore, 'rooms'), where('userId', '==', userId));
                const roomSnapshot = await getDocs(roomQuery);
                const roomData = roomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRooms(sortByRoomNo(roomData));
            }
        };

        const fetchHostlers = async () => {
            if (userId) {
                const hostlerQuery = query(collection(firestore, 'hostlers'), where('userId', '==', userId));
                const hostlerSnapshot = await getDocs(hostlerQuery);
                const hostlerData = hostlerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHostlers(sortByRoomNo(hostlerData));
            }
        };

        fetchRooms();
        fetchHostlers();
    }, [userId]);

    useEffect(() => {
        if (formData.oldRoomNo) {
            const fetchHostlersInRoom = async () => {
                const q = query(collection(firestore, 'hostlers'), where('roomNo', '==', formData.oldRoomNo), where('userId', '==', userId));
                const querySnapshot = await getDocs(q);
                const hostlersInRoomData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHostlersInRoom(hostlersInRoomData);
            };

            fetchHostlersInRoom();
        }
    }, [formData.oldRoomNo, userId]);

    const sortByRoomNo = (data) => {
        return data.sort((a, b) => {
            const roomNoA = a.roomNo.toString();
            const roomNoB = b.roomNo.toString();
            return roomNoA.localeCompare(roomNoB, undefined, { numeric: true, sensitivity: 'base' });
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleRoomChange = async (e) => {
        e.preventDefault();

        const { oldRoomNo, name, newRoomNo } = formData;
        const newRoom = rooms.find(room => room.roomNo === newRoomNo);
        const oldRoom = rooms.find(room => room.roomNo === oldRoomNo);
        const hostler = hostlers.find(hostler => hostler.name === name && hostler.roomNo === oldRoomNo);

        if (!newRoom || !oldRoom || !hostler) {
            toast.error('Invalid room numbers or hostler name');
            return;
        }

        if (newRoom.capacity <= newRoom.occupancy) {
            toast.error('New room has no vacancy');
            return;
        }

        try {
            // Update the occupancy of the new room
            const newRoomDocRef = doc(firestore, 'rooms', newRoom.id);
            await updateDoc(newRoomDocRef, {
                occupancy: newRoom.occupancy + 1,
            });

            // Update the occupancy of the old room
            const oldRoomDocRef = doc(firestore, 'rooms', oldRoom.id);
            await updateDoc(oldRoomDocRef, {
                occupancy: oldRoom.occupancy - 1,
            });

            // Update the hostler's room number
            const hostlerDocRef = doc(firestore, 'hostlers', hostler.id);
            await updateDoc(hostlerDocRef, {
                roomNo: newRoomNo,
            });

            toast.success('Room changed successfully');
            handleReset();
            // Refresh the data
            const updatedRooms = await getDocs(query(collection(firestore, 'rooms'), where('userId', '==', userId)));
            setRooms(sortByRoomNo(updatedRooms.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
            const updatedHostlers = await getDocs(query(collection(firestore, 'hostlers'), where('userId', '==', userId)));
            setHostlers(sortByRoomNo(updatedHostlers.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        } catch (error) {
            console.error('Error changing room', error);
            toast.error('Failed to change room');
        }
    };

    const handleReset = () => {
        setFormData({
            oldRoomNo: '',
            name: '',
            newRoomNo: '',
        });
        setHostlersInRoom([]);
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(hostlers.length / itemsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const currentHostlers = hostlers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <ManagerLayout>
            <div className="room-change-tracking-container">
                <h2>Room Change Tracking</h2>
                <form onSubmit={handleRoomChange}>
                    <input
                        type="text"
                        name="oldRoomNo"
                        value={formData.oldRoomNo}
                        onChange={handleInputChange}
                        placeholder="Old Room No"
                        required
                    />
                    <select
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="" disabled>Select Hostler</option>
                        {hostlersInRoom.map((hostler) => (
                            <option key={hostler.id} value={hostler.name}>{hostler.name}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        name="newRoomNo"
                        value={formData.newRoomNo}
                        onChange={handleInputChange}
                        placeholder="New Room No"
                        required
                    />
                    <div className="form-buttons">
                        <button type="button" onClick={handleReset} className="reset-button">
                            <GrPowerReset /> Reset
                        </button>
                        <button type="submit">Submit</button>
                    </div>
                </form>
                <table>
                    <thead>
                        <tr>
                            <th>Old Room No</th>
                            <th>Name</th>
                            <th>New Room No</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHostlers.map(hostler => (
                            <tr key={hostler.id}>
                                <td>{hostler.roomNo}</td>
                                <td>{hostler.name}</td>
                                <td>{hostler.roomNo === formData.newRoomNo ? formData.newRoomNo : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    <button
                        className="page-button"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        <FaChevronCircleLeft />
                    </button>
                    <button
                        className="page-button"
                        onClick={handleNextPage}
                        disabled={currentPage === Math.ceil(hostlers.length / itemsPerPage)}
                    >
                        <FaChevronCircleRight />
                    </button>
                </div>
            </div>
        </ManagerLayout>
    );
};

export default RoomChangeTracking;
