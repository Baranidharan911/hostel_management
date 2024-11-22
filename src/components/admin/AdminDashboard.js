import React from 'react';
import AdminLayout from '../common/AdminLayout';
import '../../styles/Admin/AdminDashboard.css';

const AdminDashboard = () => {
    return (
        <AdminLayout>
           <center><h2 className='text'>Welcome, Admin!</h2></center> 
        </AdminLayout>
    );
};

export default AdminDashboard;
