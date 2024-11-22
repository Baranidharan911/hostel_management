import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { firestore, auth } from '../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { IoArrowBackCircleOutline } from "react-icons/io5"; // Importing the back icon
import '../../styles/Common/Profile.css';  // Ensure the path is correct

const Profile = () => {
    const [userData, setUserData] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    
    const navigate = useNavigate(); // Initializing the navigate function
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchUserData = async () => {
            if (userId) {
                const userDocRef = doc(firestore, 'users', userId);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                    setFormData(userDoc.data());
                } else {
                    toast.error('User data not found');
                }
            }
        };

        fetchUserData();
    }, [userId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const userDocRef = doc(firestore, 'users', userId);
            await updateDoc(userDocRef, formData);
            setUserData(formData);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile', error);
            toast.error('Failed to update profile');
        }
    };

    return (
        <div>
            <header className="header">
                <IoArrowBackCircleOutline className="back-icon" onClick={() => navigate(-1)} /> 
                <h1>Hostel Management</h1>
            </header>
            <div className="profile-container">
                <h2>Profile</h2>
                {!isEditing ? (
                    <div className="profile-details">
                        <p><strong>Hostel Name:</strong> {userData.hostelName}</p>
                        <p><strong>Username:</strong> {userData.username}</p>
                        <p><strong>Email ID:</strong> {userData.email}</p>
                        <p><strong>Address Line:</strong> {userData.addressLine}</p>
                        <p><strong>District:</strong> {userData.district}</p>
                        <p><strong>Zipcode:</strong> {userData.zipcode}</p>
                        <p><strong>Phone Number:</strong> {userData.phoneNumber}</p>
                        <button onClick={() => setIsEditing(true)}>Edit Profile</button>
                    </div>
                ) : (
                    <form onSubmit={handleUpdate} className="profile-edit-form">
                        <label>
                            Hostel Name:
                            <input
                                type="text"
                                name="hostelName"
                                value={formData.hostelName || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            Username:
                            <input
                                type="text"
                                name="username"
                                value={formData.username || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            Email ID:
                            <input
                                type="email"
                                name="email"
                                value={formData.email || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            Address Line:
                            <input
                                type="text"
                                name="addressLine"
                                value={formData.addressLine || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            District:
                            <input
                                type="text"
                                name="district"
                                value={formData.district || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            Zipcode:
                            <input
                                type="text"
                                name="zipcode"
                                value={formData.zipcode || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <label>
                            Phone Number:
                            <input
                                type="text"
                                name="phoneNumber"
                                value={formData.phoneNumber || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </label>
                        <button type="submit">Update Profile</button>
                        <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;
