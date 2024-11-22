import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaEdit, FaTrash, FaArrowCircleLeft, FaArrowCircleRight, FaSearch } from 'react-icons/fa';
import { GrPowerReset } from 'react-icons/gr';
import { auth, firestore } from '../../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import '../../styles/Admin/AddManager.css';
import { toast } from 'react-toastify';
import AdminLayout from '../common/AdminLayout';

const AddManager = () => {
    const [hostelName, setHostelName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [district, setDistrict] = useState('');
    const [zipcode, setZipcode] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [managerCounter, setManagerCounter] = useState(1);
    const [editingManagerId, setEditingManagerId] = useState(null);
    const [managers, setManagers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [searchQuery, setSearchQuery] = useState(''); // Search query state

    useEffect(() => {
        const fetchManagerCounter = async () => {
            try {
                const counterDoc = await getDoc(doc(firestore, 'counters', 'managerCounter'));
                if (counterDoc.exists()) {
                    setManagerCounter(counterDoc.data().count);
                }
            } catch (error) {
                console.error('Error fetching manager counter:', error);
            }
        };

        const fetchManagers = async () => {
            try {
                const q = query(collection(firestore, 'users'), where('role', '==', 'manager'), where('is_deleted', '==', false));
                const querySnapshot = await getDocs(q);
                const managerList = [];
                querySnapshot.forEach((doc) => {
                    managerList.push({ id: doc.id, ...doc.data() });
                });
                // Sort managers by managerId
                managerList.sort((a, b) => a.managerId.localeCompare(b.managerId));
                setManagers(managerList);
            } catch (error) {
                console.error('Error fetching managers:', error);
            }
        };

        fetchManagerCounter();
        fetchManagers();
    }, []);

    const handleAddManager = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (editingManagerId) {
            // Update existing manager
            try {
                const managerDocRef = doc(firestore, 'users', editingManagerId);
                await updateDoc(managerDocRef, {
                    hostelName,
                    email,
                    username,
                    addressLine,
                    district,
                    zipcode,
                    phoneNumber,
                });

                setManagers(managers.map(manager => manager.id === editingManagerId ? { ...manager, hostelName, email, username, addressLine, district, zipcode, phoneNumber } : manager));
                toast.success('Manager updated successfully');
                resetForm();
                setEditingManagerId(null);
            } catch (error) {
                console.error('Error updating manager', error);
                toast.error('Failed to update manager');
            }
        } else {
            // Add new manager
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userId = userCredential.user.uid;
                const managerId = `MNG${String(managerCounter).padStart(4, '0')}`;

                await setDoc(doc(firestore, 'users', userId), {
                    hostelName,
                    email,
                    username,
                    addressLine,
                    district,
                    zipcode,
                    phoneNumber,
                    role: 'manager',
                    managerId,
                    is_deleted: false,
                });

                await setDoc(doc(firestore, 'counters', 'managerCounter'), {
                    count: managerCounter + 1,
                });

                toast.success('Manager added successfully');
                resetForm();
            } catch (error) {
                console.error('Error adding manager', error);
                toast.error('Failed to add manager');
            }
        }
    };

    const handleEditManager = async (managerId) => {
        try {
            const managerDoc = await getDoc(doc(firestore, 'users', managerId));
            if (managerDoc.exists()) {
                const managerData = managerDoc.data();
                setHostelName(managerData.hostelName);
                setEmail(managerData.email);
                setUsername(managerData.username);
                setAddressLine(managerData.addressLine);
                setDistrict(managerData.district);
                setZipcode(managerData.zipcode);
                setPhoneNumber(managerData.phoneNumber);
                setEditingManagerId(managerId);
            }
        } catch (error) {
            console.error('Error fetching manager data', error);
            toast.error('Failed to fetch manager data');
        }
    };

    const handleDeleteManager = async (managerId) => {
        try {
            const managerDocRef = doc(firestore, 'users', managerId);
            await updateDoc(managerDocRef, { is_deleted: true });
            setManagers(managers.filter(manager => manager.id !== managerId));
            toast.success('Manager deleted successfully');
        } catch (error) {
            console.error('Error deleting manager', error);
            toast.error('Failed to delete manager');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const resetForm = () => {
        setHostelName('');
        setEmail('');
        setUsername('');
        setAddressLine('');
        setDistrict('');
        setZipcode('');
        setPhoneNumber('');
        setPassword('');
        setConfirmPassword('');
        setEditingManagerId(null);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(managers.length / itemsPerPage)) setCurrentPage(currentPage + 1);
    };

    const filteredManagers = managers.filter(manager =>
        manager.managerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manager.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentManagers = filteredManagers.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <AdminLayout>
            <div className="manager-container">
                <div className="left-section">
                    <div className="add-manager-container">
                        <h2>{editingManagerId ? "Edit Manager" : "Add Manager"}</h2>
                        <form onSubmit={handleAddManager}>
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
                                Email ID:
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={editingManagerId !== null} // Disable email editing when in edit mode
                                />
                            </label>
                            <label>
                                Username:
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
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
                                Phone Number:
                                <input
                                    type="text"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </label>
                            {!editingManagerId && (
                                <>
                                    <label className="password-container-add-manager">
                                        Password:
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <span className="eye-icon" onClick={togglePasswordVisibility}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </label>
                                    <label className="password-container-add-manager">
                                        Confirm Password:
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                        <span className="eye-icon" onClick={toggleConfirmPasswordVisibility}>
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </label>
                                </>
                            )}
                            <div className="form-buttons">
                                <button type="button" onClick={resetForm} className="reset-button">
                                    <GrPowerReset /> Reset
                                </button>
                                <button type="submit" className="add-button">{editingManagerId ? "Update Manager" : "Add Manager"}</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="right-section">
                    <div className="manager-cards-container">
                        <h2>Managers</h2>
                        <div className="search-bar-container">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                className="manager-search-input"
                                placeholder="Search by ID or Username"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="card-container">
                            {currentManagers.map(manager => (
                                <div className="card" key={manager.id}>
                                    <p><strong>ID:</strong> {manager.managerId}</p>
                                    <p><strong>Username:</strong> {manager.username}</p>
                                    <p><strong>Hostel:</strong> {manager.hostelName}</p>
                                    <p><strong>Email:</strong> {manager.email}</p>
                                    <div className="card-actions">
                                        <button className="edit-button" onClick={() => handleEditManager(manager.id)}>
                                            <FaEdit />
                                        </button>
                                        <button className="delete-button" onClick={() => handleDeleteManager(manager.id)}>
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
                            <button onClick={handleNextPage} disabled={currentPage === Math.ceil(managers.length / itemsPerPage)}>
                                <FaArrowCircleRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AddManager;