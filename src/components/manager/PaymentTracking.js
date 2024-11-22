import React, { useState, useEffect, useCallback } from 'react';
import { firestore, auth } from '../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { sendEmail } from '../../services/emailService';
import ManagerLayout from '../common/ManagerLayout';
import { FaChevronCircleLeft, FaChevronCircleRight, FaFileDownload, FaRegEdit, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import '../../styles/Manager/PaymentTracking.css';
import logo from '../../assets/logo.png';
import tickImage from '../../assets/tick.png';
import moment from 'moment';
import Modal from 'react-modal';

const numberToWords = (num) => {
    const a = [
        '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];
    const b = [
        '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];

    const toWords = (n) => {
        if (n < 20) return a[n];
        const digit = n % 10;
        if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 === 0 ? '' : ' and ' + toWords(n % 100));
        return toWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + toWords(n % 1000) : '');
    };

    return toWords(num).toUpperCase();
};

const PaymentTracking = () => {
    const [hostlers, setHostlers] = useState([]);
    const [editValues, setEditValues] = useState({});
    const [isEditing, setIsEditing] = useState({});
    const [userId, setUserId] = useState(sessionStorage.getItem('userId') || '');
    const [hostelDetails, setHostelDetails] = useState({ hostelName: '', address: '' });
    const [totals, setTotals] = useState({
        totalAdvance: 0,
        totalMonthlyPay: 0,
        totalPending: 0
    });
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [extraForm, setExtraForm] = useState({ reason: '', amount: '' });
    const [currentHostlerId, setCurrentHostlerId] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false); // Flag to check if we're updating extra details
    const itemsPerPage = 10;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const currentMonth = months[new Date().getMonth()];

    useEffect(() => {
        // Set default to current month and year
        setSelectedMonth(currentMonth);
        setSelectedYear(currentYear.toString());

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

        const fetchHostelDetails = async () => {
            if (userId) {
                const q = query(collection(firestore, 'hostels'), where('userId', '==', userId));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const hostelData = querySnapshot.docs[0].data();
                    setHostelDetails({
                        hostelName: hostelData.hostelName,
                        address: `${hostelData.addressLine}, ${hostelData.district}, ${hostelData.zipcode}`
                    });
                } else {
                    toast.error('Hostel details not found');
                }
            }
        };

        fetchUserData();
        fetchHostelDetails();
    }, [userId, currentMonth, currentYear]);

    useEffect(() => {
        const fetchHostlers = async () => {
            if (userId) {
                let hostlerQuery = query(collection(firestore, 'hostlers'), where('userId', '==', userId));
                const hostlerSnapshot = await getDocs(hostlerQuery);
                const hostlerData = hostlerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHostlers(sortHostlersByRoomNo(hostlerData));
            }
        };

        fetchHostlers();
    }, [userId]);

    const sortHostlersByRoomNo = (hostlers) => {
        return hostlers.sort((a, b) => {
            const roomNoA = a.roomNo?.toString() || '';
            const roomNoB = b.roomNo?.toString() || '';
            return roomNoA.localeCompare(roomNoB, undefined, { numeric: true, sensitivity: 'base' });
        });
    };

    const calculateTotals = useCallback(async () => {
        let totalAdvance = 0;
        let totalMonthlyPay = 0;
        let totalPending = 0;

        const updatedHostlers = await Promise.all(hostlers.map(async (hostler) => {
            const hostlerTotalPending = hostler.monthArray?.reduce((acc, monthData) => acc + parseFloat(monthData.pending || 0), 0) || 0;

            const hostlerDocRef = doc(firestore, 'hostlers', hostler.id);

            // Update totalPendingPerson in Firestore
            await updateDoc(hostlerDocRef, { totalPendingPerson: hostlerTotalPending });

            totalAdvance += parseFloat(hostler.advance || 0);
            totalMonthlyPay += parseFloat(hostler.monthlyPay || 0);

            const monthYear = `${selectedMonth}-${currentYear}`;
            const monthData = hostler.monthArray?.find(entry => entry.monthYear === monthYear) || {};
            totalPending += selectedMonth ? parseFloat(monthData.pending || 0) : hostlerTotalPending;

            return {
                ...hostler,
                totalPendingPerson: hostlerTotalPending,
                monthArray: hostler.monthArray, // Ensure we update monthArray to the latest version
                monthData
            };
        }));

        setTotals({ totalAdvance, totalMonthlyPay, totalPending });
        setHostlers(sortHostlersByRoomNo(updatedHostlers));
    }, [hostlers, selectedMonth, currentYear]);

    useEffect(() => {
        if (hostlers.length > 0) {
            calculateTotals();
        }
    }, [hostlers, calculateTotals]);

    const handleInputChange = (id, field, value) => {
        const updatedEditValues = {
            ...editValues,
            [id]: {
                ...editValues[id],
                [field]: value
            }
        };

        setEditValues(updatedEditValues);
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

    const handleCancelEdit = (id) => {
        setIsEditing((prevValues) => ({
            ...prevValues,
            [id]: false
        }));
        setEditValues((prevValues) => ({
            ...prevValues,
            [id]: {} // Reset edit values for this hostler
        }));
    };

    const updateTotalsCollection = async (monthYear) => {
        const hostelName = hostelDetails.hostelName;
        if (!hostelName) return;

        let totalPaidForMonth = 0;

        // Sum up the paid amounts for the specified monthYear across all hostlers
        hostlers.forEach((hostler) => {
            const monthData = hostler.monthArray?.find(entry => entry.monthYear === monthYear) || {};
            totalPaidForMonth += parseFloat(monthData.paid || 0);
        });

        // Reference to the totals collection, using the `totalprofit` subcollection
        const totalProfitRef = doc(firestore, `totals/${hostelName} /totalprofit`, monthYear);

        // Update the totals document with the new totals for the month
        await setDoc(totalProfitRef, {
            monthYear,
            totalPaid: totalPaidForMonth.toFixed(2),
            userId,
        }, { merge: true });
    };

    const handleUpdate = async (id, updatedValues) => {
        try {
            const hostlerDocRef = doc(firestore, 'hostlers', id);
            const hostlerDoc = await getDoc(hostlerDocRef);
            let monthArray = hostlerDoc.exists() && hostlerDoc.data().monthArray ? hostlerDoc.data().monthArray : [];
    
            const monthYear = `${updatedValues.month || selectedMonth}-${currentYear}`;
            const pendingAmount = parseFloat(updatedValues.pending || 0);
            const advance = parseFloat(updatedValues.advance || 0);
            const monthlyPay = parseFloat(updatedValues.monthlyPay || 0);
            const modeOfPay = updatedValues.modeOfPay || 'default';
    
            const existingEntryIndex = monthArray.findIndex(entry => entry.monthYear === monthYear);
    
            if (existingEntryIndex >= 0) {
                monthArray[existingEntryIndex] = { 
                    monthYear, 
                    pending: pendingAmount, 
                    paid: monthlyPay - pendingAmount, 
                    modeOfPay 
                };
            } else {
                monthArray.push({ 
                    monthYear, 
                    pending: pendingAmount, 
                    paid: monthlyPay - pendingAmount, 
                    modeOfPay 
                });
            }
    
            const hostlerTotalPending = monthArray.reduce((acc, curr) => acc + parseFloat(curr.pending || 0), 0);
    
            // Update Firestore with the new details including modeOfPay
            await updateDoc(hostlerDocRef, {
                advance,
                monthlyPay,
                monthArray,
                totalPendingPerson: hostlerTotalPending
            });
    
            // Update local state
            const updatedHostlers = hostlers.map((hostler) =>
                hostler.id === id ? { 
                    ...hostler, 
                    ...updatedValues, 
                    monthArray, 
                    totalPendingPerson: hostlerTotalPending,
                    modeOfPay 
                } : hostler
            );
    
            setHostlers(updatedHostlers);
            setEditValues(prevValues => ({ ...prevValues, [id]: {} }));
            setIsEditing(prevValues => ({ ...prevValues, [id]: false }));
    
            await updateTotalsCollection(monthYear);
            calculateTotals();
    
            toast.success('Payment updated successfully');
    
            // Reload the entire page to reflect updates
            window.location.reload();
        } catch (error) {
            console.error('Error updating payment', error);
            toast.error('Failed to update payment');
        }
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

    const sendReminderEmail = async () => {
        const managerEmail = auth.currentUser.email;
        const pendingHostlers = hostlers.filter(hostler => hostler.totalPendingPerson > 0);

        const message = pendingHostlers.map(hostler =>
            `Name: ${hostler.name}\nRoom No: ${hostler.roomNo}\nMobile No: ${hostler.phoneNo}\nPending Amount: ₹${hostler.totalPendingPerson}`
        ).join('\n\n');

        try {
            await sendEmail(managerEmail, 'Pending Rental Reminder', message);
            toast.success('Reminder email sent successfully');
        } catch (error) {
            console.error('Error sending reminder email:', error);
            toast.error('Failed to send reminder email');
        }
    };

    const downloadBillingForm = (hostler) => {
        const doc = new jsPDF();
        const currentDate = new Date().toLocaleString();
    
        const imgData = logo;
        const tickImg = tickImage;
    
        doc.addImage(imgData, 'PNG', 10, 10, 30, 30);
    
        doc.setFontSize(14);
        doc.text('Balamurugan Thunai', 105, 15, null, null, 'center');
        doc.setFontSize(18);
        doc.text(hostelDetails.hostelName.toUpperCase(), 105, 25, null, null, 'center');
        doc.setFontSize(12);
        doc.text(hostelDetails.address, 105, 33, null, null, 'center');
        doc.setFontSize(12);
        doc.text('Cell : 9043308194, 7299055657, 9710811124', 105, 40, null, null, 'center');
    
        doc.setFontSize(16);
        doc.text('Receipt', 105, 55, null, null, 'center');
        doc.setFontSize(12);
        doc.text(`Date : ${currentDate}`, 140, 60);
        doc.text('No.', 10, 60);
        doc.text('Room No. :', 10, 70);
        doc.text(`${hostler.roomNo}`, 40, 70);
        doc.text('Name :', 10, 80);
        doc.text(`${hostler.name}`, 40, 80);
    
        doc.setFontSize(14);
        doc.text('Particulars', 50, 100);
        doc.text('Amount', 150, 100);
        doc.setLineWidth(0.5);
        doc.line(10, 95, 200, 95);
        doc.line(10, 105, 200, 105);
        doc.line(100, 95, 100, 135);
    
        const monthlyPay = parseFloat(hostler.monthlyPay || 0);
        const pending = parseFloat(hostler.pending || 0);
        const paid = monthlyPay - pending;
        const total = paid;
    
        doc.setFontSize(12);
        doc.text('Security Deposit', 12, 115);
        doc.text(`${hostler.advance}`, 160, 115);
        doc.text('Room Rent & Mess Fees', 12, 125);
        doc.text(`${monthlyPay}`, 160, 125);
    
        const totalAmountInWords = numberToWords(total);
    
        doc.setLineWidth(0.5);
        doc.line(10, 135, 200, 135);
        doc.text('Rupees', 12, 145);
        doc.text(totalAmountInWords, 50, 145);
        doc.text('Total Paid :', 150, 145);
        doc.text(`${total}`, 180, 145);
        doc.line(10, 150, 200, 150);
    
        doc.text('Bill Amount :', 140, 160);
        doc.text(`${monthlyPay}`, 180, 160);
        doc.text('Pending :', 140, 170);
        doc.text(`${pending}`, 180, 170);
        doc.text('Total Paid :', 140, 180);
        doc.text(`${paid}`, 180, 180);
        doc.text('Balance :', 140, 190);
        doc.text(`${pending}`, 180, 190);
    
        doc.text('Payment :', 10, 215);
        doc.rect(40, 210, 10, 10);
        if (hostler.modeOfPay === 'Cash') {
            doc.addImage(tickImg, 'PNG', 41, 211, 8, 8);
        } else if (hostler.modeOfPay === 'Online') {
            doc.addImage(tickImg, 'PNG', 81, 211, 8, 8);
        }
        doc.text('CASH', 55, 220);
        doc.rect(80, 210, 10, 10);
        doc.text('A/c', 95, 220);
    
        doc.text('Received by', 160, 220);
    
        doc.save(`Billing_Form_${hostler.roomNo}.pdf`);
    };

    const prepareHostlerData = (hostler) => {
        const monthYear = `${selectedMonth}-${currentYear}`;
        const hostlerMonthData = hostler.monthArray?.find(entry => entry.monthYear === monthYear) || {
            monthYear,
            pending: 0,
            paid: 0,
            modeOfPay: 'default'
        };

        return {
            ...hostler,
            pending: hostlerMonthData.pending || 0,
            modeOfPay: hostlerMonthData.modeOfPay || 'default',
        };
    };

    const filteredHostlers = hostlers
        .filter(hostler => {
            // Filter by DOJ: Show only if they joined on or before the selected month and year
            const dojMonth = moment(hostler.joiningDate).format('MMMM');
            const dojYear = moment(hostler.joiningDate).format('YYYY');
            return (moment(`${dojMonth}-${dojYear}`, 'MMMM-YYYY').isSameOrBefore(`${selectedMonth}-${selectedYear}`, 'month'));
        })
        .map(hostler => prepareHostlerData(hostler));

    const currentHostlers = filteredHostlers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const calculatePendingTotal = (monthArr, extraArr, category) => {
        let totalPending = 0;

        if (monthArr && monthArr.length) {
            monthArr.forEach((pay) => {
                totalPending += parseFloat(pay[category] || 0);
            });
        }

        if (extraArr && extraArr.length) {
            extraArr.forEach((extra) => {
                totalPending += parseFloat(extra.amount || 0);
            });
        }

        return totalPending.toLocaleString('en-IN');
    };

    const calculateMonth = (doj, dor) => {
        let startingDate = moment(doj);
        let endingDate = dor ? moment(dor) : moment(new Date().toISOString().slice(0, 10));
        return endingDate.diff(startingDate, 'months');
    };

    const handleExtraSubmit = async () => {
        if (!extraForm.reason || !extraForm.amount) {
            toast.error('Please fill in both reason and amount');
            return;
        }

        try {
            const hostlerDocRef = doc(firestore, 'hostlers', currentHostlerId);
            const hostlerDoc = await getDoc(hostlerDocRef);
            let extraArray = hostlerDoc.exists() && hostlerDoc.data().extra ? hostlerDoc.data().extra : [];

            // If updating, find the item in the array and update it
            if (isUpdating) {
                const extraIndex = extraArray.findIndex((item) => item.reason === extraForm.reason);
                if (extraIndex >= 0) {
                    extraArray[extraIndex] = {
                        reason: extraForm.reason,
                        amount: parseFloat(extraForm.amount)
                    };
                }
            } else {
                // If adding a new item
                extraArray.push({
                    reason: extraForm.reason,
                    amount: parseFloat(extraForm.amount)
                });
            }

            await updateDoc(hostlerDocRef, { extra: extraArray });

            setHostlers(
                hostlers.map((hostler) =>
                    hostler.id === currentHostlerId
                        ? { ...hostler, extra: extraArray }
                        : hostler
                )
            );

            toast.success(isUpdating ? 'Extra details updated successfully' : 'Extra details added successfully');
            setIsModalOpen(false);
            setExtraForm({ reason: '', amount: '' });
            setIsUpdating(false);
        } catch (error) {
            console.error('Error updating extra details:', error);
            toast.error('Failed to update extra details');
        }
    };

    const openExtraModal = (id) => {
        setCurrentHostlerId(id);
        const hostler = hostlers.find((hostler) => hostler.id === id);
        if (hostler && hostler.extra && hostler.extra.length) {
            const existingExtra = hostler.extra[0]; // Assuming you want to edit the first extra entry
            setExtraForm({ reason: existingExtra.reason, amount: existingExtra.amount });
            setIsUpdating(true);
        } else {
            setExtraForm({ reason: '', amount: '' });
            setIsUpdating(false);
        }
        setIsModalOpen(true);
    };

    const closeExtraModal = () => {
        setIsModalOpen(false);
        setExtraForm({ reason: '', amount: '' });
        setIsUpdating(false);
    };

    return (
        <ManagerLayout>
            <div className="payment-tracking-container">
                <h2>Payment Tracking</h2>
                <div className="filter-container">
                    <label htmlFor="month-filter">Filter by Month: </label>
                    <select
                        id="month-filter"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {months.map((month) => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                    <label htmlFor="year-filter">Filter by Year: </label>
                    <select
                        id="year-filter"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        {Array.from({ length: 25 }, (_, i) => 2010 + i).map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="totals-container-unique">
                    <div className="total-item">Security deposit: {totals.totalAdvance}</div>
                    <div className="total-item">Total Monthly Paid: {totals.totalMonthlyPay}</div>
                    <div className="total-item">Total Pending: {totals.totalPending}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Room No</th>
                            <th style={{ width: '240px' }}>Name</th>
                            <th>Security Deposit</th>
                            <th>Monthly Pay</th>
                            <th>Pending</th>
                            <th>Month</th>
                            <th>Total</th>
                            <th>Mode of Pay</th>
                            <th>Action</th>
                            <th>Bills</th>
                            <th>Extra</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHostlers.map((hostler) => (
                            <tr key={hostler.id}>
                                <td>{hostler.roomNo}</td>
                                <td>
                                    <div>{hostler.name}</div>
                                    <div>
                                        <strong>DOJ : </strong>{moment(hostler.joiningDate).format('DD MMM, YYYY')}
                                    </div>
                                    <div>
                                        <strong>Months : </strong>{calculateMonth(hostler.joiningDate, hostler.dateOfRelieving)}
                                    </div>
                                    <div>
                                        <strong>Total Paid : </strong> ₹{calculatePendingTotal(hostler.monthArray, hostler.extra, 'paid')}
                                    </div>
                                    <div>
                                        <strong>Total Pending : </strong> ₹{calculatePendingTotal(hostler.monthArray, hostler.extra, 'pending')}
                                    </div>
                                    <div>{hostler.dateOfRelieving ? `Releived On : ${moment(hostler.dateOfRelieving).format('DD MMM, YYYY')}` : 'Staying'}</div>
                                </td>
                                <td>
                                    {isEditing[hostler.id] ? (
                                        <input
                                            type="text"
                                            value={editValues[hostler.id]?.advance || ''}
                                            onChange={(e) => handleInputChange(hostler.id, 'advance', e.target.value)}
                                        />
                                    ) : (
                                        hostler.advance
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostler.id] ? (
                                        <input
                                            type="text"
                                            value={editValues[hostler.id]?.monthlyPay || ''}
                                            onChange={(e) => handleInputChange(hostler.id, 'monthlyPay', e.target.value)}
                                        />
                                    ) : (
                                        hostler.monthlyPay
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostler.id] ? (
                                        <input
                                            type="number"
                                            value={editValues[hostler.id]?.pending || ''}
                                            onChange={(e) => handleInputChange(hostler.id, 'pending', e.target.value)}
                                        />
                                    ) : (
                                        selectedMonth ? hostler.monthData?.pending : hostler.totalPendingPerson
                                    )}
                                </td>
                                <td>
                                    {isEditing[hostler.id] ? (
                                        <select
                                            value={editValues[hostler.id]?.month || selectedMonth}
                                            onChange={(e) => handleInputChange(hostler.id, 'month', e.target.value)}
                                        >
                                            <option value="" disabled>Select Month</option>
                                            {months.map((month) => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        selectedMonth === '' ? 'All' : selectedMonth
                                    )}
                                </td>
                                <td>
                                    {parseFloat(hostler?.monthlyPay || 0) - parseFloat(hostler?.pending || 0)}
                                </td>
                                <td>
                                    <select
                                        value={editValues[hostler.id]?.modeOfPay || hostler.modeOfPay || 'default'}
                                        onChange={(e) => handleInputChange(hostler.id, 'modeOfPay', e.target.value)}
                                        disabled={!isEditing[hostler.id]}
                                    >
                                        <option value="default">Default</option>
                                        <option value="Online">Online</option>
                                        <option value="Cash">Cash</option>
                                    </select>
                                </td>
                                <td>
                                    {isEditing[hostler.id] ? (
                                        <>
                                            <button className="icon-button" onClick={() => handleUpdate(hostler.id, editValues[hostler.id])}>
                                                <FaCheck />
                                            </button>
                                            <button className="icon-button" onClick={() => handleCancelEdit(hostler.id)}>
                                                <FaTimes />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleEditClick(hostler.id)}><FaRegEdit /></button>
                                    )}
                                </td>

                                <td>
                                    <button onClick={() => downloadBillingForm(hostler)}><FaFileDownload /></button>
                                </td>
                                <td>
                                    <button onClick={() => openExtraModal(hostler.id)}><FaPlus /></button>
                                </td>
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
                        disabled={currentPage === Math.ceil(filteredHostlers.length / itemsPerPage)}
                    >
                        <FaChevronCircleRight />
                    </button>
                </div>
                <div className="email-buttons">
                    <button onClick={sendReminderEmail}>Send Reminder Email</button>
                </div>
            </div>

            {/* Extra Modal */}
            <Modal
                isOpen={isModalOpen}
                onRequestClose={closeExtraModal}
                contentLabel="Extra Modal"
                className="modal"
                overlayClassName="overlay"
            >
                <h2>{isUpdating ? 'Update Extra Payment' : 'Add Extra Payment'}</h2>
                <label>
                    Reason:
                    <input
                        type="text"
                        value={extraForm.reason}
                        onChange={(e) => setExtraForm({ ...extraForm, reason: e.target.value })}
                    />
                </label>
                <label>
                    Amount:
                    <input
                        type="number"
                        value={extraForm.amount}
                        onChange={(e) => setExtraForm({ ...extraForm, amount: e.target.value })}
                    />
                </label>
                <div className="modal-buttons">
                    <button onClick={handleExtraSubmit}>{isUpdating ? 'Update' : 'Submit'}</button>
                    <button onClick={closeExtraModal}>Cancel</button>
                </div>
            </Modal>
        </ManagerLayout>
    );
};

export default PaymentTracking;
