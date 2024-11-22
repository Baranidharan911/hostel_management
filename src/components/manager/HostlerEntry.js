import React, { useState, useEffect } from 'react';
import { firestore, storage, auth } from '../../firebase/firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import ManagerLayout from '../common/ManagerLayout';
import '../../styles/Manager/HostlerEntry.css';
import { GrPowerReset } from 'react-icons/gr';

const HostlerEntry = () => {
    const [name, setName] = useState('');
    const [roomNo, setRoomNo] = useState('');
    const [phoneNo, setPhoneNo] = useState('');
    const [email, setEmail] = useState('');
    const [idDocument, setIdDocument] = useState('');
    const [file, setFile] = useState(null);
    const [addressLine, setAddressLine] = useState('');
    const [district, setDistrict] = useState('');
    const [zipcode, setZipcode] = useState('');
    const [joiningDate, setJoiningDate] = useState('');
    const [rooms, setRooms] = useState([]);
    const [userId, setUserId] = useState('');
    const [, setHostelName] = useState('');

    useEffect(() => {
        const fetchUserAndRooms = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserId(user.uid);
                        setHostelName(userData.hostelName);
                    } else {
                        toast.error('User data not found');
                        return;
                    }
                }
                const roomSnapshot = await getDocs(collection(firestore, 'rooms'));
                const roomData = roomSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRooms(roomData);
            } catch (error) {
                console.error('Error fetching data', error);
                toast.error('Error fetching data');
            }
        };

        fetchUserAndRooms();
    }, []);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleReset = () => {
        setName('');
        setRoomNo('');
        setPhoneNo('');
        setEmail('');
        setIdDocument('');
        setFile(null);
        setAddressLine('');
        setDistrict('');
        setZipcode('');
        setJoiningDate('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const selectedRoom = rooms.find(room => room.roomNo === roomNo);
        if (!selectedRoom) {
            toast.error('Room not found');
            return;
        }
    
        if (selectedRoom.occupancy >= selectedRoom.capacity) {
            toast.error('Room is already full');
            return;
        }
    
        try {
            // Add hostler data to Firestore
            const hostlerRef = await addDoc(collection(firestore, 'hostlers'), {
                name,
                roomNo,
                phoneNo,
                email,
                idDocument,
                addressLine,
                district,
                zipcode,
                joiningDate,
                userId, // Include the user ID
                filePath: '',
                is_deleted: false, // New is_deleted flag
            });
            const hostlerId = hostlerRef.id;
    
            // Upload file to Firebase Storage
            if (file) {
                const storageRef = ref(storage, `${hostlerId}/documents/${file.name}`);
                await uploadBytes(storageRef, file);
                const fileURL = await getDownloadURL(storageRef);
    
                // Update Firestore with the file URL
                const hostlerDocRef = doc(firestore, 'hostlers', hostlerId);
                await updateDoc(hostlerDocRef, {
                    filePath: fileURL
                });
            }
    
            // Update room occupancy
            const roomDocRef = doc(firestore, 'rooms', selectedRoom.id);
            await updateDoc(roomDocRef, {
                occupancy: selectedRoom.occupancy + 1
            });
    
            // Query the hostel_capacities collection using the stored userId
            const hostelCapacityQuery = query(
                collection(firestore, 'hostel_capacities'),
                where('userId', '==', userId)  // Query using the stored userId
            );
            const hostelCapacitySnapshot = await getDocs(hostelCapacityQuery);
    
            if (!hostelCapacitySnapshot.empty) {
                const hostelCapacityDoc = hostelCapacitySnapshot.docs[0];
                const hostelCapacityRef = doc(firestore, 'hostel_capacities', hostelCapacityDoc.id);
                const currentOccupancy = hostelCapacityDoc.data().occupancy || 0;
    
                // Increment the existing occupancy field
                await updateDoc(hostelCapacityRef, {
                    occupancy: currentOccupancy + 1
                });
            } else {
                toast.error('Hostel capacity document not found.');
            }
    
            toast.success('Hostler added successfully');
            handleReset();
        } catch (error) {
            console.error('Error adding hostler', error);
            toast.error('Failed to add hostler');
        }
    };
    
    return (
        <ManagerLayout>
            <div className="hostler-entry-container">
                <h2>Hostler Entry</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name"
                            required
                        />
                    </label>
                    <label>
                        Room No:
                        <input
                            type="text"
                            value={roomNo}
                            onChange={(e) => setRoomNo(e.target.value)}
                            placeholder="Room No"
                            required
                        />
                    </label>
                    <label>
                        Phone No:
                        <input
                            type="text"
                            value={phoneNo}
                            onChange={(e) => setPhoneNo(e.target.value)}
                            placeholder="Phone No"
                            required
                        />
                    </label>
                    <label>
                        Email:
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                    </label>
                    <label>
                        ID Document:
                        <select
                            value={idDocument}
                            onChange={(e) => setIdDocument(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select ID Document</option>
                            <option value="Aadhar Card">Aadhar Card</option>
                            <option value="Licence">Licence</option>
                            <option value="Pan Card">Pan Card</option>
                        </select>
                    </label>
                    <label>
                        Upload Document:
                        <input
                            type="file"
                            onChange={handleFileChange}
                            required
                        />
                    </label>
                    <label>
                        Address Line:
                        <input
                            type="text"
                            value={addressLine}
                            onChange={(e) => setAddressLine(e.target.value)}
                            placeholder="Address Line"
                            required
                        />
                    </label>
                    <label>
                        District:
                        <input
                            type="text"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            placeholder="District"
                            required
                        />
                    </label>
                    <label>
                        Zipcode:
                        <input
                            type="text"
                            value={zipcode}
                            onChange={(e) => setZipcode(e.target.value)}
                            placeholder="Zipcode"
                            required
                        />
                    </label>
                    <label>
                        Joining Date:
                        <input
                            type="date"
                            value={joiningDate}
                            onChange={(e) => setJoiningDate(e.target.value)}
                            placeholder="Joining Date"
                            required
                        />
                    </label>
                    <div className="form-buttons">
                        <button type="button" onClick={handleReset}> <GrPowerReset /> Reset</button>
                        <button type="submit">Add Hostler</button>
                    </div>
                </form>
            </div>
        </ManagerLayout>
    );
};

export default HostlerEntry;
