import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebaseConfig';
import ManagerLayout from '../common/ManagerLayout';
import '../../styles/Manager/HostelInfo.css';
import { toast } from 'react-toastify';

const HostelInfo = () => {
    const [hostels, setHostels] = useState([]);
    const [hostelName, setHostelName] = useState(sessionStorage.getItem('hostelName') || '');

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user && !hostelName) {
                const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setHostelName(userData.hostelName);
                    sessionStorage.setItem('hostelName', userData.hostelName);
                } else {
                    toast.error('User data not found');
                }
            }
        };

        fetchUserData();
    }, [hostelName]);

    useEffect(() => {
        const fetchHostels = async () => {
            if (hostelName) {
                const hostelQuery = collection(firestore, 'hostels');
                const hostelSnapshot = await getDocs(hostelQuery);
                const hostelData = [];

                for (const hostelDoc of hostelSnapshot.docs) {
                    const hostel = { id: hostelDoc.id, ...hostelDoc.data() };
                    
                    // Filter out hostels where is_deleted is true
                    if (hostel.is_deleted) continue;
                    
                    // Fetch capacity and occupancy from the hostel_capacities collection
                    const capacityDoc = await getDoc(doc(firestore, 'hostel_capacities', hostel.hostelName));
                    if (capacityDoc.exists()) {
                        const capacityData = capacityDoc.data();
                        hostel.capacity = capacityData.capacity;
                        hostel.occupancy = capacityData.occupancy;
                    } else {
                        hostel.capacity = 'N/A';
                        hostel.occupancy = 'N/A';
                    }

                    // Fetch manager's phone number from the users collection
                    const userDoc = await getDoc(doc(firestore, 'users', hostel.userId));
                    if (userDoc.exists()) {
                        hostel.phoneNumber = userDoc.data().phoneNumber;
                    }

                    hostelData.push(hostel);
                }

                setHostels(hostelData);
            }
        };

        fetchHostels();
    }, [hostelName]);

    return (
        <ManagerLayout>
            <div className="hostel-info-container">
                <h2>Hostel Information</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Name of the Hostel</th>
                            <th>Manager Name</th>
                            <th>Manager Email</th>
                            <th>Phone Number</th>
                            <th>Address Line</th>
                            <th>District</th>
                            <th>Zip Code</th>
                            <th>Capacity</th>
                            <th>Occupancy</th>
                            <th>Vacancy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hostels.map((hostel) => (
                            <tr key={hostel.id}>
                                <td>{hostel.hostelName}</td>
                                <td>{hostel.managerName}</td>
                                <td><a href={`mailto:${hostel.managerEmail}`}>{hostel.managerEmail}</a></td>
                                <td>{hostel.phoneNumber ? <a href={`tel:${hostel.phoneNumber}`}>{hostel.phoneNumber}</a> : 'Loading...'}</td>
                                <td>{hostel.addressLine}</td>
                                <td>{hostel.district}</td>
                                <td>{hostel.zipcode}</td>
                                <td>{hostel.capacity}</td>
                                <td>{hostel.occupancy}</td>
                                <td>{hostel.capacity - hostel.occupancy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ManagerLayout>
    );
};

export default HostelInfo;
