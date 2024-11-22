import React from 'react';
import ManagerLayout from '../common/ManagerLayout';
import '../../styles/Manager/ManagerDashboard.css';

const ManagerDashboard = () => {
    return (
        <ManagerLayout>
            <div className="manager-dashboard">
                <center><h2 className='text'>Welcome, Manager!</h2></center>
            </div>
        </ManagerLayout>
    );
};

export default ManagerDashboard;
