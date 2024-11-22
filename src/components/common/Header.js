import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoc, doc } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebaseConfig';
import '../../styles/Common/Header.css';
import profileImage from '../../assets/profile-removebg-preview.png'; // Ensure this path is correct

const Header = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [username, setUsername] = useState(sessionStorage.getItem('username') || '');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUsername(userData.username); // Assuming username field is in the users collection
                    sessionStorage.setItem('username', userData.username); // Store username in session storage
                }
            }
        };

        if (!username) { // Fetch user data only if username is not already set
            fetchUserData();
        }
    }, [username]);

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const handleViewProfile = () => {
        navigate('/profile'); // Update with your profile route
        setShowDropdown(false);
    };

    const handleSignOut = () => {
        // Add your sign out logic here, including clearing session storage
        sessionStorage.removeItem('username');
        auth.signOut(); // Assuming Firebase authentication
        navigate('/');
        setShowDropdown(false);
    };

    return (
        <header className="header-bar">
            <h1>Hostel Management System</h1>
            <div className="user-greeting">
                <h2 className='head'>Hi, {username}!</h2>
                <img src={profileImage} alt="Profile" className="profile-icon" onClick={toggleDropdown} />
            </div>
            {showDropdown && (
                <div className="dropdown-menu">
                    <div className="dropdown-item" onClick={handleViewProfile}>View Profile</div>
                    <div className="dropdown-item" onClick={handleSignOut}>Sign Out</div>
                </div>
            )}
        </header>
    );
};

export default Header;
