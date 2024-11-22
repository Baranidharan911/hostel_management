import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, query, where } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebaseConfig';
import ManagerLayout from '../common/ManagerLayout';
import '../../styles/Manager/DashboardOverview.css';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { toast } from 'react-toastify';
import { FaChevronCircleLeft, FaChevronCircleRight } from 'react-icons/fa';
import { IoDocument } from 'react-icons/io5'; // Importing the document icon
import moment from 'moment';

Chart.register(...registerables);

const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) {
        return '₹0';
    }
    let [integer, decimal] = amount.toFixed(0).split('.');
    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (integer.length > 4 && integer.includes(",,")) {
        integer = integer.replace(",,", ",");
    }

    return `₹${integer}${decimal ? '.' + decimal : ''}`;
};

const DashboardOverview = () => {
    const [userId, setUserId] = useState(sessionStorage.getItem('userId') || '');
    const [hostelName, setHostelName] = useState(sessionStorage.getItem('hostelName') || '');
    const [totalProfit, setTotalProfit] = useState(Number(sessionStorage.getItem('totalProfit')) || 0);
    const [totalExpense, setTotalExpense] = useState(Number(sessionStorage.getItem('totalExpense')) || 0);
    const [profit, setProfit] = useState(Number(sessionStorage.getItem('profit')) || 0);
    const [selectedMonth, setSelectedMonth] = useState(moment().format('MMMM'));
    const [selectedYear, setSelectedYear] = useState(moment().format('YYYY'));
    const [hostelData, setHostelData] = useState({
        capacity: Number(sessionStorage.getItem('capacity')) || 0,
        occupancy: Number(sessionStorage.getItem('occupancy')) || 0
    });
    const [hostlers, setHostlers] = useState(JSON.parse(sessionStorage.getItem('hostlers')) || []);
    const [username, setUsername] = useState(sessionStorage.getItem('username') || '');
    const [email, setEmail] = useState(sessionStorage.getItem('email') || '');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUsername(userData.username);
                    setEmail(userData.email);
                    setUserId(user.uid);
                    setHostelName(userData.hostelName);
                    sessionStorage.setItem('username', userData.username);
                    sessionStorage.setItem('email', userData.email);
                    sessionStorage.setItem('userId', user.uid);
                    sessionStorage.setItem('hostelName', userData.hostelName);
                } else {
                    toast.error('User data not found');
                }
            }
        };

        if (!userId || !username || !email || !hostelName) {
            fetchUserData();
        }
    }, [userId, username, email, hostelName]);

    useEffect(() => {
        const fetchHostelData = async () => {
            if (userId && hostelName) {
                try {
                    const monthYear = `${selectedMonth}-${selectedYear}`;
                    const totalsProfitRef = doc(firestore, `totals/${hostelName}/totalprofit/${monthYear}`);
                    const totalsExpenseRef = doc(firestore, `totals/${hostelName}/totalexpense/${monthYear}`);

                    // Fetch or create the profit document
                    const profitDoc = await getDoc(totalsProfitRef);
                    if (!profitDoc.exists()) {
                        console.log('Profit document does not exist. Creating it...');
                        await setDoc(totalsProfitRef, { totalPaid: 0 });
                    }
                    const profitAmount = parseFloat((await getDoc(totalsProfitRef)).data().totalPaid || 0);

                    // Fetch or create the expense document
                    const expenseDoc = await getDoc(totalsExpenseRef);
                    if (!expenseDoc.exists()) {
                        console.log('Expense document does not exist. Creating it...');
                        await setDoc(totalsExpenseRef, { totalAmount: 0 });
                    }
                    const expenseAmount = parseFloat((await getDoc(totalsExpenseRef)).data().totalAmount || 0);

                    console.log('Fetched Total Profit:', profitAmount); // Debug log
                    console.log('Fetched Total Expense:', expenseAmount); // Debug log

                    setTotalProfit(profitAmount);
                    setTotalExpense(expenseAmount);
                    setProfit(profitAmount - expenseAmount);

                    sessionStorage.setItem('totalProfit', profitAmount);
                    sessionStorage.setItem('totalExpense', expenseAmount);
                    sessionStorage.setItem('profit', profitAmount - expenseAmount);

                    // Fetch hostel data and hostlers
                    const hostelQuery = query(collection(firestore, 'hostels'), where('userId', '==', userId));
                    const hostelSnapshot = await getDocs(hostelQuery);
                    if (!hostelSnapshot.empty) {
                        const hostelDoc = hostelSnapshot.docs[0];
                        const hostelInfo = hostelDoc.data();
                        const hostelName = hostelInfo.hostelName;

                        const capacityDoc = await getDoc(doc(firestore, 'hostel_capacities', hostelName));
                        if (capacityDoc.exists()) {
                            const capacityData = capacityDoc.data();
                            setHostelData({
                                capacity: capacityData.capacity,
                                occupancy: capacityData.occupancy
                            });
                            sessionStorage.setItem('capacity', capacityData.capacity);
                            sessionStorage.setItem('occupancy', capacityData.occupancy);
                        } else {
                            toast.error('Hostel capacity data not found');
                        }

                        fetchHostlers();
                    } else {
                        toast.error('Hostel data not found');
                    }
                } catch (error) {
                    toast.error('Error fetching hostel data');
                }
            }
        };

        const fetchHostlers = async () => {
            try {
                const hostlerQuery = query(
                    collection(firestore, 'hostlers'),
                    where('userId', '==', userId),
                    where('is_deleted', '==', false)
                );
                const hostlerSnapshot = await getDocs(hostlerQuery);
                const hostlerData = hostlerSnapshot.docs.map(doc => doc.data());
                hostlerData.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true, sensitivity: 'base' }));
                setHostlers(hostlerData);
                sessionStorage.setItem('hostlers', JSON.stringify(hostlerData));
            } catch (error) {
                toast.error('Error fetching hostlers');
            }
        };

        // Only fetch data when necessary
        if ((!hostlers.length || totalProfit === 0 || totalExpense === 0 || profit === 0)) {
            fetchHostelData();
        }
    }, [userId, hostelName, selectedMonth, selectedYear, hostlers.length, totalProfit, totalExpense, profit]);

    const barChartData = {
        labels: ['Total Profit', 'Total Expense', 'Profit'],
        datasets: [
            {
                label: 'Amount (₹)',
                data: [totalProfit, totalExpense, profit],
                backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
            }
        ]
    };

    const doughnutChartData = {
        labels: ['Occupancy', 'Vacancy'],
        datasets: [
            {
                data: [hostelData.occupancy, hostelData.capacity - hostelData.occupancy],
                backgroundColor: ['#FF4500', '#00b000'],
                hoverBackgroundColor: ['#FF6347', '#00FF7F'],
            }
        ]
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
            <div className="dashboard-overview-container">
                <h2>Dashboard Overview</h2>
                <div className="filter-container">
                    <label htmlFor="month-filter">Filter by Month: </label>
                    <select
                        id="month-filter"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {moment.months().map((month) => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                    <label htmlFor="year-filter">Filter by Year: </label>
                    <select
                        id="year-filter"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {Array.from({ length: 25 }, (_, i) => 2010 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="charts-container">
                    <div className="chart-container-unique">
                        <h6>Profit Management</h6>
                        <Bar data={barChartData} />
                    </div>
                    <div className="chart-container-unique">
                        {/* <h6>Hostel Capacity</h6> */}
                        <Doughnut data={doughnutChartData} />
                    </div>
                    <div className="user-info">
                        <p><strong>Username:</strong> {username}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Total Capacity:</strong> {hostelData.capacity}</p>
                        <p><strong>Occupancy:</strong> {hostelData.occupancy}</p>
                    </div>
                </div>
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
                            <th>Zipcode</th>
                            <th>Joining Date</th>
                            <th>Document</th>
                            <th>Security deposit</th>
                            <th>Monthly Pay</th>
                            <th>Pending</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHostlers.map((hostler, index) => (
                            <tr key={index}>
                                <td>{hostler.roomNo}</td>
                                <td>{hostler.name}</td>
                                <td><a href={`tel:${hostler.phoneNo}`}>{hostler.phoneNo}</a></td>
                                <td><a href={`mailto:${hostler.email}`}>{hostler.email}</a></td>
                                <td>{hostler.idDocument}</td>
                                <td>{hostler.addressLine}</td>
                                <td>{hostler.district}</td>
                                <td>{hostler.zipcode}</td>
                                <td>{moment(hostler.joiningDate).format('DD MMM, YYYY')}</td>
                                <td>
                                    <a href={hostler.filePath} target="_blank" rel="noopener noreferrer">
                                        <IoDocument />
                                    </a>
                                </td>
                                <td>{formatCurrency(hostler.advance)}</td>
                                <td>{formatCurrency(hostler.monthlyPay)}</td>
                                <td>{formatCurrency(hostler.totalPendingPerson)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="pagination">
                    <button className="page-button" onClick={handlePreviousPage} disabled={currentPage === 1}>
                        <FaChevronCircleLeft />
                    </button>
                    <button className="page-button" onClick={handleNextPage} disabled={currentPage >= Math.ceil(hostlers.length / itemsPerPage)}>
                        <FaChevronCircleRight />
                    </button>
                </div>
            </div>
        </ManagerLayout>
    );
};

export default DashboardOverview;
