import React from 'react';
import Header from '../common/Header';
import { NavLink } from 'react-router-dom'; // Use NavLink instead of Link
import '../../styles/Manager/ManagerLayout.css';

const ManagerLayout = ({ children }) => {
    return (
        <div className="manager-layout">
            <Header />
            <div className="main-content">
                <div className="sidebar">
                    <h2>Manager Dashboard</h2>
                    <div>
                        <NavLink 
                            to="/manager/dashboard-overview" 
                            activeClassName="active"
                            exact
                        >
                            Dashboard Overview
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/room-availability" 
                            activeClassName="active"
                            exact
                        >
                            Room Availability
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/hostler-entry" 
                            activeClassName="active"
                            exact
                        >
                            Hostler Entry
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/notification" 
                            activeClassName="active"
                            exact
                        >
                            Send Notification
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/payment-tracking" 
                            activeClassName="active"
                            exact
                        >
                            Payment Tracking
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/room-change-tracking" 
                            activeClassName="active"
                            exact
                        >
                            Room Change Tracking
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/csv" 
                            activeClassName="active"
                            exact
                        >
                            CSV Management
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/hostel-info" 
                            activeClassName="active"
                            exact
                        >
                            Hostel Information
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/hostler-list" 
                            activeClassName="active"
                            exact
                        >
                            Hostler List
                        </NavLink>
                    </div>
                    <div>
                        <NavLink 
                            to="/manager/expense-page" 
                            activeClassName="active"
                            exact
                        >
                            Expense Management
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

export default ManagerLayout;
