import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebaseConfig';
import { Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { toast } from 'react-toastify';
import AdminLayout from '../common/AdminLayout';
import '../../styles/Admin/ReportPage.css';

// Register necessary components for Chart.js
Chart.register(...registerables);

const ReportPage = () => {
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState('');
    const [hostelData, setHostelData] = useState(null);
    const [managerDetails, setManagerDetails] = useState(null);
    
    useEffect(() => {
        const fetchHostels = async () => {
            const hostelsSnapshot = await getDocs(collection(firestore, 'hostels'));
            const hostelsData = hostelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHostels(hostelsData);
        };

        fetchHostels();
    }, []);

    useEffect(() => {
        if (selectedHostel) {
            const fetchHostelData = async () => {
                // Fetch capacity and occupancy from hostel_capacities collection
                const capacityDoc = await getDocs(query(collection(firestore, 'hostel_capacities'), where('hostelName', '==', selectedHostel)));
                if (!capacityDoc.empty) {
                    const capacityData = capacityDoc.docs[0].data();
                    setHostelData({
                        ...capacityData,
                        totalAdvance: capacityData.totalAdvance || 0,
                        totalMonthlyPay: capacityData.totalMonthlyPay || 0,
                        totalPending: capacityData.totalPending || 0
                    });
                    fetchManagerDetails(capacityData.userId);
                   
                } else {
                    toast.error('Hostel data not found');
                }
            };

            const fetchManagerDetails = async (userId) => {
                const userDoc = await getDoc(doc(firestore, 'users', userId));
                if (userDoc.exists()) {
                    setManagerDetails(userDoc.data());
                } else {
                    toast.error('Manager details not found');
                }
            };

            fetchHostelData();
        }
    }, [selectedHostel]);

    const handleHostelChange = (e) => {
        setSelectedHostel(e.target.value);
    };

    const occupancyData = {
        labels: ['Occupancy', 'Vacancy'],
        datasets: [
            {
                data: [hostelData?.occupancy || 0, (hostelData?.capacity || 0) - (hostelData?.occupancy || 0)],
                backgroundColor: ['#FF6384', '#36A2EB'],
                hoverBackgroundColor: ['#FF85A1', '#6ABCFD'],
            }
        ]
    };

    return (
        <AdminLayout>
            <div className="report-page-container">
                <h2>Hostel Reports</h2>
                <div className="hostel-selection">
                    <label>Select Hostel: </label>
                    <select value={selectedHostel} onChange={handleHostelChange}>
                        <option value="" disabled>Select Hostel</option>
                        {hostels.map(hostel => (
                            <option key={hostel.id} value={hostel.hostelName}>{hostel.hostelName}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-container">
                    {managerDetails && (
                        <div className="hostel-info">
                            <p><strong>Manager Name:</strong> {managerDetails.username}</p>
                            <p><strong>Manager Email:</strong> {managerDetails.email}</p>
                            <p><strong>Phone Number:</strong> {managerDetails.phoneNumber}</p>
                        </div>
                    )}
                    {hostelData && (
                        <div className="chart-container">
                            <div className="occupancy-chart">
                                <Doughnut data={occupancyData} options={{ plugins: { title: { display: true, text: 'Hostel Occupancy' } } }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default ReportPage;
