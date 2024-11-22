import React, { useState, useEffect } from 'react';
import { firestore } from '../../firebase/firebaseConfig';
import { collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import '../../styles/Admin/AddHostel.css';
import { toast } from 'react-toastify';
import AdminLayout from '../common/AdminLayout';
import { GrPowerReset } from 'react-icons/gr';
import { FaEdit, FaTrash, FaArrowCircleLeft, FaArrowCircleRight, FaSearch } from 'react-icons/fa';

const AddHostel = () => {
    const [hostelName, setHostelName] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [district, setDistrict] = useState('');
    const [zipcode, setZipcode] = useState('');
    const [managerName, setManagerName] = useState('');
    const [managerEmail, setManagerEmail] = useState('');
    const [managerPhoneNumber, setManagerPhoneNumber] = useState('');
    const [capacity, setCapacity] = useState('');
    const [hostelCounter, setHostelCounter] = useState(1);
    const [hostels, setHostels] = useState([]);
    const [editingHostelId, setEditingHostelId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2;
    const [searchQuery, setSearchQuery] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        const fetchHostelCounter = async () => {
            try {
                const counterDoc = await getDoc(doc(firestore, 'counters', 'hostelCounter'));
                if (counterDoc.exists()) {
                    setHostelCounter(counterDoc.data().count);
                }
            } catch (error) {
                console.error('Error fetching hostel counter:', error);
            }
        };

        const fetchHostels = async () => {
            try {
                const q = query(collection(firestore, 'hostels'), where('is_deleted', '==', false));
                const querySnapshot = await getDocs(q);
                const hostelList = [];

                for (const hostelDoc of querySnapshot.docs) {
                    const hostelData = hostelDoc.data();
                    const capacityDoc = await getDoc(doc(firestore, 'hostel_capacities', hostelData.hostelName));
                    if (capacityDoc.exists()) {
                        const { capacity, occupancy } = capacityDoc.data();
                        hostelList.push({ 
                            id: hostelDoc.id, 
                            ...hostelData, 
                            capacity, 
                            occupancy, 
                            vacancy: capacity - occupancy 
                        });
                    }
                }

                hostelList.sort((a, b) => a.hostelId.localeCompare(b.hostelId));
                setHostels(hostelList);
            } catch (error) {
                console.error('Error fetching hostels:', error);
            }
        };

        fetchHostelCounter();
        fetchHostels();
    }, []);

    useEffect(() => {
        // Concatenate address fields whenever addressLine, district, or zipcode change
        setAddress(`${addressLine}, ${district}, ${zipcode}`);
    }, [addressLine, district, zipcode]);

    const handleAddHostel = async (e) => {
        e.preventDefault();

        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('email', '==', managerEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error('Manager not found');
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;
            const hostelId = `HST${String(hostelCounter).padStart(4, '0')}`;

            if (editingHostelId) {
                // Update existing hostel
                await updateDoc(doc(firestore, 'hostels', editingHostelId), {
                    hostelName,
                    addressLine,
                    district,
                    zipcode,
                    address,  // Store concatenated address
                    managerName,
                    managerEmail,
                    managerPhoneNumber,
                    capacity: parseInt(capacity, 10),
                    userId,
                    is_deleted: false
                });

                await updateDoc(doc(firestore, 'users', userId), {
                    hostelId
                });

                // Update hostel capacities
                await updateDoc(doc(firestore, 'hostel_capacities', hostelName), {
                    capacity: parseInt(capacity, 10)
                });

                toast.success('Hostel updated successfully');
            } else {
                // Add new hostel
                await setDoc(doc(firestore, 'hostels', hostelName), {
                    hostelName,
                    addressLine,
                    district,
                    zipcode,
                    address,  // Store concatenated address
                    managerName,
                    managerEmail,
                    managerPhoneNumber,
                    userId,
                    hostelId,
                    capacity: parseInt(capacity, 10),
                    occupancy: 0,  // Only set occupancy to 0 for new hostels
                    is_deleted: false
                });

                await setDoc(doc(firestore, 'counters', 'hostelCounter'), {
                    count: hostelCounter + 1,
                });

                await updateDoc(doc(firestore, 'users', userId), {
                    hostelId
                });

                // Add to hostel capacities collection
                await setDoc(doc(firestore, 'hostel_capacities', hostelName), {
                    hostelName,
                    capacity: parseInt(capacity, 10),
                    userId,
                    is_deleted: false,
                    occupancy: 0  // Only set occupancy to 0 for new hostels
                });

                toast.success('Hostel added successfully');
            }

            resetForm();
            setEditingHostelId(null);
        } catch (error) {
            console.error('Error adding or updating hostel', error);
            toast.error('Failed to add or update hostel');
        }
    };

    const handleEditHostel = async (hostelId) => {
        try {
            const hostelDoc = await getDoc(doc(firestore, 'hostels', hostelId));
            if (hostelDoc.exists()) {
                const hostelData = hostelDoc.data();
                setHostelName(hostelData.hostelName);
                setAddressLine(hostelData.addressLine);
                setDistrict(hostelData.district);
                setZipcode(hostelData.zipcode);
                setAddress(hostelData.address); // Set address from Firestore
                setManagerName(hostelData.managerName);
                setManagerEmail(hostelData.managerEmail);
                setManagerPhoneNumber(hostelData.managerPhoneNumber);
                setCapacity(hostelData.capacity);
                setEditingHostelId(hostelId);
            }
        } catch (error) {
            console.error('Error fetching hostel data', error);
            toast.error('Failed to fetch hostel data');
        }
    };

    const handleDeleteHostel = async (hostelId) => {
        try {
            await updateDoc(doc(firestore, 'hostels', hostelId), { is_deleted: true });
            await updateDoc(doc(firestore, 'hostel_capacities', hostelName), { is_deleted: true });
            setHostels(hostels.filter(hostel => hostel.id !== hostelId));
            toast.success('Hostel deleted successfully');
        } catch (error) {
            console.error('Error deleting hostel', error);
            toast.error('Failed to delete hostel');
        }
    };

    const resetForm = () => {
        setHostelName('');
        setAddressLine('');
        setDistrict('');
        setZipcode('');
        setManagerName('');
        setManagerEmail('');
        setManagerPhoneNumber('');
        setCapacity('');
        setEditingHostelId(null);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(hostels.length / itemsPerPage)) setCurrentPage(currentPage + 1);
    };

    const filteredHostels = hostels.filter(hostel =>
        hostel.hostelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hostel.hostelName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHostels = filteredHostels.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <AdminLayout>
            <div className="hostel-container">
                <div className="left-section">
                    <div className="add-hostel-container">
                        <h2>{editingHostelId ? "Edit Hostel" : "Add Hostel"}</h2>
                        <form onSubmit={handleAddHostel}>
                            <label>
                                Hostel Name:
                                <input
                                    type="text"
                                    value={hostelName}
                                    onChange={(e) => setHostelName(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Address Line:
                                <input
                                    type="text"
                                    value={addressLine}
                                    onChange={(e) => setAddressLine(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                District:
                                <input
                                    type="text"
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Zipcode:
                                <input
                                    type="text"
                                    value={zipcode}
                                    onChange={(e) => setZipcode(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Name of the Manager:
                                <input
                                    type="text"
                                    value={managerName}
                                    onChange={(e) => setManagerName(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Manager's Email:
                                <input
                                    type="email"
                                    value={managerEmail}
                                    onChange={(e) => setManagerEmail(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Manager's Phone Number:
                                <input
                                    type="tel"
                                    value={managerPhoneNumber}
                                    onChange={(e) => setManagerPhoneNumber(e.target.value)}
                                    required
                                />
                            </label>
                            <label>
                                Capacity:
                                <input
                                    type="number"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    required
                                />
                            </label>
                            <div className="form-buttons">
                                <button type="button" onClick={resetForm} className="reset-button">
                                    <GrPowerReset /> Reset
                                </button>
                                <button type="submit" className="add-button">{editingHostelId ? "Update Hostel" : "Add Hostel"}</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="right-section">
                    <div className="hostel-cards-container">
                        <h2>Hostels</h2>
                        <div className="search-bar-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                className="hostel-search-input"
                                placeholder="Search by ID or Name"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="card-container">
                            {currentHostels.map(hostel => (
                                <div className="card" key={hostel.id}>
                                    <p><strong>ID:</strong> {hostel.hostelId}</p>
                                    <p><strong>Name:</strong> {hostel.hostelName}</p>
                                    <p><strong>Manager:</strong> {hostel.managerName}</p>
                                    <p><strong>Email:</strong> {hostel.managerEmail}</p>
                                    <p><strong>Address:</strong> {hostel.address}</p>
                                    <p><strong>Capacity:</strong> {hostel.capacity}</p>
                                    <p><strong>Occupancy:</strong> {hostel.occupancy}</p>
                                    <p><strong>Vacancy:</strong> {hostel.vacancy}</p>
                                    <div className="card-actions">
                                        <button className="edit-button" onClick={() => handleEditHostel(hostel.id)}>
                                            <FaEdit />
                                        </button>
                                        <button className="delete-button" onClick={() => handleDeleteHostel(hostel.id)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pagination">
                            <button onClick={handlePrevPage} disabled={currentPage === 1}>
                                <FaArrowCircleLeft />
                            </button>
                            <button onClick={handleNextPage} disabled={currentPage === Math.ceil(hostels.length / itemsPerPage)}>
                                <FaArrowCircleRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AddHostel;
