import React, { useState, useEffect } from 'react';
import { firestore, auth } from '../../firebase/firebaseConfig';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { sendEmail } from '../../services/emailService';
import { toast } from 'react-toastify';
import { GrPowerReset } from 'react-icons/gr';
import { IoSend } from "react-icons/io5";
import ManagerLayout from '../common/ManagerLayout';
import '../../styles/Manager/Notification.css';

const Notification = () => {
    const [roomNo, setRoomNo] = useState('');
    const [message, setMessage] = useState('');
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState('');
    const [userId, setUserId] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserId(user.uid);
                } else {
                    toast.error('User data not found');
                }
            }
        };

        const fetchEmails = async () => {
            if (roomNo && userId) {
                const hostlerQuery = query(
                    collection(firestore, 'hostlers'),
                    where('roomNo', '==', roomNo),
                    where('userId', '==', userId)
                );
                const querySnapshot = await getDocs(hostlerQuery);
                const emailList = querySnapshot.docs.map(doc => doc.data().email);
                setEmails(emailList);
            }
        };

        fetchUserData();
        fetchEmails();
    }, [roomNo, userId]);

    const handleSendNotification = async (e) => {
        e.preventDefault();
        if (!selectedEmail) {
            toast.error('Please select an email');
            return;
        }

        try {
            await sendEmail(selectedEmail, 'Hostel Notification', message);
            toast.success('Notification sent successfully');
            handleReset();
        } catch (error) {
            console.error('Error sending notification', error);
            toast.error('Failed to send notification');
        }
    };

    const handleReset = () => {
        setRoomNo('');
        setMessage('');
        setEmails([]);
        setSelectedEmail('');
    };

    return (
        <ManagerLayout>
            <div className="notification-container">
                <h2>Send Notification</h2>
                <form onSubmit={handleSendNotification}>
                    <label>
                        Room No:
                        <input className='notification'
                            type="text"
                            value={roomNo}
                            onChange={(e) => setRoomNo(e.target.value)}
                            placeholder="Room No"
                            required
                        />
                    </label>
                    <label>
                        Email:
                        <select className='notification-s'
                            value={selectedEmail}
                            onChange={(e) => setSelectedEmail(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select Email</option>
                            {emails.map((email, index) => (
                                <option key={index} value={email}>{email}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Message:
                        <textarea className='notification-t'
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Message"
                            required
                        ></textarea>
                    </label>
                    <div className="form-buttons">
                        <button type="button" onClick={handleReset} className="reset-button">
                            <GrPowerReset /> Reset
                        </button>
                        <button type="submit"><IoSend/>Send</button>
                    </div>
                </form>
            </div>
        </ManagerLayout>
    );
};

export default Notification;
