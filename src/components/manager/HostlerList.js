import React, { useState, useEffect } from 'react';
import { firestore, auth } from '../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import moment from 'moment';
import ManagerLayout from '../common/ManagerLayout';
import { FaChevronCircleLeft, FaChevronCircleRight, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { IoIosSearch } from 'react-icons/io';  
import { IoDocument } from "react-icons/io5";
import '../../styles/Manager/HostlerList.css';

const HostlerList = () => {
    const [hostlers, setHostlers] = useState([]);
    const [editValues, setEditValues] = useState({});
    const [isEditing, setIsEditing] = useState({});
    const [userId, setUserId] = useState(sessionStorage.getItem('userId') || '');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
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
        const fetchHostlers = async () => {
            if (userId) {
                const hostlerQuery = query(collection(firestore, 'hostlers'), where('userId', '==', userId), where('is_deleted', '==', false));
                const hostlerSnapshot = await getDocs(hostlerQuery);
                const hostlerData = hostlerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHostlers(sortByRoomNo(hostlerData));
            }
        };

        fetchHostlers();
    }, [userId]);

    const sortByRoomNo = (data) => {
        return data.sort((a, b) => {
            const roomNoA = a.roomNo.toString();
            const roomNoB = b.roomNo.toString();
            return roomNoA.localeCompare(roomNoB, undefined, { numeric: true, sensitivity: 'base' });
        });
    };

    const handleInputChange = (id, field, value) => {
        setEditValues((prevValues) => ({
            ...prevValues,
            [id]: {
                ...prevValues[id],
                [field]: value
            }
        }));
    };

    const handleEditClick = (id) => {
        setIsEditing((prevValues) => ({
            ...prevValues,
            [id]: true
        }));
        setEditValues((prevValues) => ({
            ...prevValues,
            [id]: hostlers.find(hostler => hostler.id === id)
        }));
    };

    const handleUpdate = async (id) => {
        try {
            const updatedValues = editValues[id];
            const hostlerDocRef = doc(firestore, 'hostlers', id);
            await updateDoc(hostlerDocRef, updatedValues);

            setHostlers((prevHostlers) =>
                prevHostlers.map((hostler) =>
                    hostler.id === id ? { ...hostler, ...updatedValues } : hostler
                )
            );

            setIsEditing((prevValues) => ({
                ...prevValues,
                [id]: false
            }));

            toast.success('Hostler updated successfully');
        } catch (error) {
            console.error('Error updating hostler', error);
            toast.error('Failed to update hostler');
        }
    };

    const handleCancelEdit = (id) => {
        setIsEditing((prevValues) => ({
            ...prevValues,
            [id]: false
        }));
    };

    const handleDelete = async (id) => {
        try {
            const hostlerDocRef = doc(firestore, 'hostlers', id);
            await updateDoc(hostlerDocRef, { is_deleted: true });

            setHostlers((prevHostlers) => prevHostlers.filter((hostler) => hostler.id !== id));
            toast.success('Hostler marked as deleted');
        } catch (error) {
            console.error('Error deleting hostler', error);
            toast.error('Failed to mark hostler as deleted');
        }
    };

    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value);
    };

    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(filteredHostlers.length / itemsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const filteredHostlers = hostlers.filter((hostler) => {
        const joiningDate = new Date(hostler.joiningDate);
        const month = joiningDate.getMonth() + 1;
        const year = joiningDate.getFullYear();
        return (
            (!selectedMonth || month === parseInt(selectedMonth)) &&
            (!selectedYear || year === parseInt(selectedYear)) &&
            (hostler.roomNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
            hostler.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    const currentHostlers = filteredHostlers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <ManagerLayout>
            <div className="hostler-list-container">
                <h2>Hostler List</h2>
                <div className="filter-container">
                    <label>Filter by Joining Month:</label>
                    <select value={selectedMonth} onChange={handleMonthChange}>
                        <option value="">All</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <label className='year'>Filter by Joining Year:</label>
                    <select value={selectedYear} onChange={handleYearChange}>
                        <option value="">All</option>
                        {Array.from({ length: 25 }, (_, i) => (
                            <option key={2015 + i} value={2015 + i}>
                                {2015 + i}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="hostler-search-bar-container">
                
                    <input
                        type="text"
                        placeholder="Search by Room No or Name"
                        value={searchTerm}
                        onChange={handleSearch}
                        
                        className="hostler-search-bar"
                    />
                    <IoIosSearch className="hostler-search-icon" />
                </div>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Room No</th>
                                <th>Name</th>
                                <th>Phone No</th>
                                <th>Email</th>
                                <th>ID Document</th>
                                <th>Address Line</th>
                                <th>District</th>
                                <th>Zip Code</th>
                                <th>Joining Date</th>
                                <th>Relieving Date</th>
                                <th>Document</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentHostlers.map((hostler) => (
                                <tr key={hostler.id}>
                                    <td>{isEditing[hostler.id] ? <input type="text" value={editValues[hostler.id]?.roomNo || ''} onChange={(e) => handleInputChange(hostler.id, 'roomNo', e.target.value)} /> : hostler.roomNo}</td>
                                    <td>{isEditing[hostler.id] ? <input type="text" value={editValues[hostler.id]?.name || ''} onChange={(e) => handleInputChange(hostler.id, 'name', e.target.value)} /> : hostler.name}</td>
                                    <td>{isEditing[hostler.id] ? <input type="text" value={editValues[hostler.id]?.phoneNo || ''} onChange={(e) => handleInputChange(hostler.id, 'phoneNo', e.target.value)} /> : <a href={`tel:${hostler.phoneNo}`}>{hostler.phoneNo}</a>}</td>
                                    <td>{isEditing[hostler.id] ? <input type="text" value={editValues[hostler.id]?.email || ''} onChange={(e) => handleInputChange(hostler.id, 'email', e.target.value)} /> : <a href={`mailto:${hostler.email}`}>{hostler.email}</a>}</td>
                                    <td>{isEditing[hostler.id] ? <input type="text" value={editValues[hostler.id]?.idDocument || ''} onChange={(e) => handleInputChange(hostler.id, 'idDocument', e.target.value)} /> : hostler.idDocument}</td>
                                    <td>{isEditing[hostler.id] ? <input type="text" value={editValues[hostler.id]?.addressLine || ''} onChange={(e) => handleInputChange(hostler.id, 'addressLine', e.target.value)} /> : hostler.addressLine}</td>
                                    <td>{isEditing[hostler.id] ? <input type="text" value={editValues[hostler.id]?.district || ''} onChange={(e) => handleInputChange(hostler.id, 'district', e.target.value)} /> : hostler.district}</td>
                                    <td>{isEditing[hostler.id] ? <input type="text" value={editValues[hostler.id]?.zipcode || ''} onChange={(e) => handleInputChange(hostler.id, 'zipcode', e.target.value)} /> : hostler.zipcode}</td>
                                    <td>{isEditing[hostler.id] ? <input type="date" value={editValues[hostler.id]?.joiningDate || ''} onChange={(e) => handleInputChange(hostler.id, 'joiningDate', e.target.value)} /> : moment(hostler.joiningDate).format('DD MMM, YYYY')}</td>
                                    <td>{isEditing[hostler.id] ? <input type="date" value={editValues[hostler.id]?.dateOfRelieving || ''} onChange={(e) => handleInputChange(hostler.id, 'dateOfRelieving', e.target.value)} /> : hostler.dateOfRelieving ? moment(hostler.dateOfRelieving).format('DD MMM, YYYY') : 'N/A'}</td>
                                    <td>
                                        <a href={hostler.filePath} target="_blank" rel="noopener noreferrer">
                                            <IoDocument />  {/* Using IoDocument icon here */}
                                        </a>
                                    </td>
                                    <td>
                                        {isEditing[hostler.id] ? (
                                            <>
                                                <FaCheck className="action-icon" onClick={() => handleUpdate(hostler.id)} />
                                                <FaTimes className="action-icon" onClick={() => handleCancelEdit(hostler.id)} />
                                            </>
                                        ) : (
                                            <>
                                                <FaEdit className="action-icon" onClick={() => handleEditClick(hostler.id)} />
                                                <FaTrash className="action-icon" onClick={() => handleDelete(hostler.id)} />
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="pagination">
                    <button className="page-button" onClick={handlePreviousPage} disabled={currentPage === 1}>
                        <FaChevronCircleLeft />
                    </button>
                    <button className="page-button" onClick={handleNextPage} disabled={currentPage >= Math.ceil(filteredHostlers.length / itemsPerPage)}>
                        <FaChevronCircleRight />
                    </button>
                </div>
            </div>
        </ManagerLayout>
    );
};

export default HostlerList;
