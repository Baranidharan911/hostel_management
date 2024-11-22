import React, { useEffect, useState } from 'react';
import { firestore } from '../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import '../../styles/Admin/HostelList.css';
import { toast } from 'react-toastify';
import AdminLayout from '../common/AdminLayout';
import { FaEdit, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';

const HostelList = () => {
    const [hostels, setHostels] = useState([]);
    const [editValues, setEditValues] = useState({});
    const [isEditing, setIsEditing] = useState({});

    useEffect(() => {
        const fetchHostels = async () => {
            const hostelSnapshot = await getDocs(collection(firestore, 'hostels'));
            const hostelData = hostelSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            // Filter out hostels marked as deleted
            const activeHostels = hostelData.filter(hostel => !hostel.is_deleted);

            // Fetch capacity and occupancy from hostel_capacities collection
            const hostelCapacitiesSnapshot = await getDocs(collection(firestore, 'hostel_capacities'));
            const hostelCapacitiesData = hostelCapacitiesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            const mergedHostelData = activeHostels.map((hostel) => {
                const capacityData = hostelCapacitiesData.find(capacity => capacity.hostelName === hostel.hostelName);
                return {
                    ...hostel,
                    capacity: capacityData?.capacity || 0,
                    occupancy: capacityData?.occupancy || 0,
                };
            });

            setHostels(mergedHostelData);
        };

        fetchHostels();
    }, []);

    const handleInputChange = (id, field, value) => {
        setEditValues((prevValues) => ({
            ...prevValues,
            [id]: {
                ...prevValues[id],
                [field]: value
            }
        }));
    };

    const handleUpdate = async (id) => {
        try {
            const updatedValues = editValues[id];
            if (!updatedValues) {
                throw new Error(`No updated values found for hostelId: ${id}`);
            }

            const hostelDocRef = doc(firestore, 'hostels', id);
            await updateDoc(hostelDocRef, updatedValues);

            // Update the corresponding hostel_capacities document
            const hostelCapacityRef = doc(firestore, 'hostel_capacities', id);
            await updateDoc(hostelCapacityRef, {
                capacity: updatedValues.capacity,
                occupancy: updatedValues.occupancy,
            });

            // Update the corresponding user's document
            if (updatedValues.managerEmail || updatedValues.managerPhoneNumber || updatedValues.managerName) {
                const userDocRef = doc(firestore, 'users', updatedValues.userId);
                await updateDoc(userDocRef, {
                    email: updatedValues.managerEmail,
                    phoneNumber: updatedValues.managerPhoneNumber,
                    username: updatedValues.managerName,
                    addressLine: updatedValues.addressLine,
                    district: updatedValues.district,
                    zipcode: updatedValues.zipcode,
                });
            }

            setHostels((prevHostels) =>
                prevHostels.map((hostel) =>
                    hostel.id === id
                        ? {
                              ...hostel,
                              ...updatedValues,
                          }
                        : hostel
                )
            );

            setIsEditing((prevValues) => ({
                ...prevValues,
                [id]: false
            }));

            toast.success('Hostel and Manager updated successfully');
        } catch (error) {
            console.error('Error updating hostel and manager', error);
            toast.error('Failed to update hostel and manager');
        }
    };

    const handleCancel = (id) => {
        setIsEditing((prevValues) => ({
            ...prevValues,
            [id]: false
        }));
        setEditValues((prevValues) => ({
            ...prevValues,
            [id]: {}
        }));
    };

    const handleDelete = async (id) => {
        try {
            const hostelDocRef = doc(firestore, 'hostels', id);
            await updateDoc(hostelDocRef, { is_deleted: true });

            const hostelCapacityRef = doc(firestore, 'hostel_capacities', id);
            await updateDoc(hostelCapacityRef, { is_deleted: true });

            setHostels((prevHostels) => prevHostels.filter((hostel) => hostel.id !== id));
            toast.success('Hostel marked as deleted successfully');
        } catch (error) {
            console.error('Error deleting hostel', error);
            toast.error('Failed to delete hostel');
        }
    };

    return (
        <AdminLayout>
            <div className="hostel-list-container">
                <h2>Hostel List</h2>
                <table className="hostel-table">
                    <thead>
                        <tr>
                            <th>Hostel Name</th>
                            <th>Address Line</th>
                            <th>District</th>
                            <th>Zipcode</th>
                            <th>Manager Name</th>
                            <th>Manager Email</th>
                            <th>Manager Phone Number</th>
                            <th>Capacity</th>
                            <th>Occupancy</th>
                            <th>Vacancy</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hostels.map((hostel) => (
                            <tr key={hostel.id}>
                                <td>{hostel.hostelName}</td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <input
                                            type="text"
                                            value={editValues[hostel.id]?.addressLine || hostel.addressLine || ''}
                                            onChange={(e) => handleInputChange(hostel.id, 'addressLine', e.target.value)}
                                        />
                                    ) : (
                                        hostel.addressLine
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <input
                                            type="text"
                                            value={editValues[hostel.id]?.district || hostel.district || ''}
                                            onChange={(e) => handleInputChange(hostel.id, 'district', e.target.value)}
                                        />
                                    ) : (
                                        hostel.district
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <input
                                            type="text"
                                            value={editValues[hostel.id]?.zipcode || hostel.zipcode || ''}
                                            onChange={(e) => handleInputChange(hostel.id, 'zipcode', e.target.value)}
                                        />
                                    ) : (
                                        hostel.zipcode
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <input
                                            type="text"
                                            value={editValues[hostel.id]?.managerName || hostel.managerName || ''}
                                            onChange={(e) => handleInputChange(hostel.id, 'managerName', e.target.value)}
                                        />
                                    ) : (
                                        hostel.managerName
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <input
                                            type="email"
                                            value={editValues[hostel.id]?.managerEmail || hostel.managerEmail || ''}
                                            onChange={(e) => handleInputChange(hostel.id, 'managerEmail', e.target.value)}
                                        />
                                    ) : (
                                        hostel.managerEmail
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <input
                                            type="text"
                                            value={editValues[hostel.id]?.managerPhoneNumber || hostel.managerPhoneNumber || ''}
                                            onChange={(e) => handleInputChange(hostel.id, 'managerPhoneNumber', e.target.value)}
                                        />
                                    ) : (
                                        hostel.managerPhoneNumber
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <input
                                            type="number"
                                            value={editValues[hostel.id]?.capacity || hostel.capacity || ''}
                                            onChange={(e) => handleInputChange(hostel.id, 'capacity', parseInt(e.target.value))}
                                        />
                                    ) : (
                                        hostel.capacity
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <input
                                            type="number"
                                            value={editValues[hostel.id]?.occupancy || hostel.occupancy || ''}
                                            onChange={(e) => handleInputChange(hostel.id, 'occupancy', parseInt(e.target.value))}
                                        />
                                    ) : (
                                        hostel.occupancy
                                    )}
                                </td>
                                <td>{(editValues[hostel.id]?.capacity || hostel.capacity || 0) - (editValues[hostel.id]?.occupancy || hostel.occupancy || 0)}</td>
                                <td>
                                    {isEditing[hostel.id] ? (
                                        <>
                                            <FaCheck className="action-icon" onClick={() => handleUpdate(hostel.id)} />
                                            <FaTimes className="action-icon" onClick={() => handleCancel(hostel.id)} />
                                        </>
                                    ) : (
                                        <>
                                            <FaEdit className="action-icon" onClick={() => setIsEditing((prevValues) => ({ ...prevValues, [hostel.id]: true }))} />
                                            <FaTrash className="action-icon" onClick={() => handleDelete(hostel.id)} />
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
};

export default HostelList;
