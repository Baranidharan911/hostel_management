import React from 'react';
import Header from './Header';
import { NavLink } from 'react-router-dom'; // Use NavLink instead of Link
import '../../styles/Admin/AdminLayout.css';

const AdminLayout = ({ children }) => {
    return (
        <div className="admin-layout">
            <Header />
            <div className="main-content">
                <div className="sidebar">
                    <h2>Admin Dashboard </h2>
                    <div className='side'>
                        <NavLink 
                            to="/admin/add-manager" 
                            activeClassName="active"
                            exact
                        >
                            Manager
                        </NavLink>
                    </div>
                    <div className='side'>
                        <NavLink 
                            to="/admin/add-hostel" 
                            activeClassName="active"
                            exact
                        >
                            Hostel
                        </NavLink>
                    </div>
                    <div className='side'>
                        <NavLink 
                            to="/admin/hostel-list" 
                            activeClassName="active"
                            exact
                        >
                            Hostel List
                        </NavLink>
                    </div>
                    <div className='side'>
                        <NavLink 
                            to="/admin/report-page" 
                            activeClassName="active"
                            exact
                        >
                            Report Page
                        </NavLink>
                    </div>
                </div>
                <div className="content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
