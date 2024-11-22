import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, getDoc, setDoc } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebaseConfig';
import { FaArrowCircleLeft, FaArrowCircleRight, FaEdit, FaTrash } from 'react-icons/fa';
import { GrPowerReset } from 'react-icons/gr';
import ManagerLayout from '../common/ManagerLayout';
import { toast } from 'react-toastify';
import moment from 'moment';
import '../../styles/Manager/ExpensePage.css';

const ExpensePage = () => {
    const [expenses, setExpenses] = useState([]);
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [filterMonth, setFilterMonth] = useState(moment().format('MMMM'));
    const [filterYear, setFilterYear] = useState(moment().format('YYYY'));
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [isEditing, setIsEditing] = useState(null);
    const [userId, setUserId] = useState('');
    const [hostelName, setHostelName] = useState('');

    const months = useMemo(() => [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ], []);

    const years = useMemo(() => {
        const startYear = 2010;
        const endYear = moment().year() + 10;
        let yearList = [];
        for (let year = startYear; year <= endYear; year++) {
            yearList.push(year);
        }
        return yearList;
    }, []);

    // Fetch userId and hostelName on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                setUserId(user.uid);  // Store userId
                const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                if (userDoc.exists()) {
                    setHostelName(userDoc.data().hostelName);
                }
            }
        };

        fetchUserData();
    }, []);

    // Fetch expenses once userId is set
    useEffect(() => {
        if (userId) {
            const fetchExpenses = async () => {
                const q = query(collection(firestore, 'expenses'), where('userId', '==', userId));
                const expenseSnapshot = await getDocs(q);
                const expenseData = expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setExpenses(expenseData);
            };

            fetchExpenses();
        }
    }, [userId]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const newExpense = {
                expenseName,
                amount: parseFloat(amount),
                date,
                userId, // Include userId here
            };

            if (isEditing) {
                const expenseRef = doc(firestore, 'expenses', isEditing);
                await updateDoc(expenseRef, newExpense);
                setExpenses(expenses.map(exp => (exp.id === isEditing ? { id: isEditing, ...newExpense } : exp)));
                await updateTotalExpense(date, parseFloat(amount), isEditing);
                setIsEditing(null);
                toast.success('Expense updated successfully');
            } else {
                const docRef = await addDoc(collection(firestore, 'expenses'), newExpense);
                setExpenses([...expenses, { id: docRef.id, ...newExpense }]);
                await updateTotalExpense(date, parseFloat(amount));
                toast.success('Expense added successfully');
            }
            handleReset();
        } catch (error) {
            console.error('Error adding expense', error);
            toast.error('Failed to add expense');
        }
    };

    const updateTotalExpense = async (date, newAmount, isEditing = false) => {
        if (hostelName) {
            const month = moment(date).format('MMMM');
            const year = moment(date).format('YYYY');
            const monthYear = `${month}-${year}`;
            const totalsRef = doc(firestore, `totals/${hostelName}/totalexpense`, monthYear);
            const totalsDoc = await getDoc(totalsRef);

            let updatedTotal = newAmount;

            if (totalsDoc.exists()) {
                updatedTotal += parseFloat(totalsDoc.data().totalAmount || 0);
            }

            if (totalsDoc.exists() && isEditing) {
                const previousAmount = expenses.find(exp => exp.id === isEditing).amount;
                updatedTotal = updatedTotal - previousAmount + newAmount;
            }

            await setDoc(totalsRef, {
                monthYear,
                totalAmount: updatedTotal.toFixed(2),
                userId // Ensure userId is stored
            });
        }
    };

    const handleEditExpense = (expense) => {
        setIsEditing(expense.id);
        setExpenseName(expense.expenseName);
        setAmount(expense.amount);
        setDate(expense.date);
    };

    const handleDeleteExpense = async (id) => {
        try {
            const expenseToDelete = expenses.find(exp => exp.id === id);
            await deleteDoc(doc(firestore, 'expenses', id));
            setExpenses(expenses.filter(exp => exp.id !== id));
            await updateTotalExpense(expenseToDelete.date, -expenseToDelete.amount);
            toast.success('Expense deleted successfully');
        } catch (error) {
            console.error('Error deleting expense', error);
            toast.error('Failed to delete expense');
        }
    };

    const handleReset = () => {
        setExpenseName('');
        setAmount('');
        setDate(moment().format('YYYY-MM-DD'));
        setIsEditing(null);
    };

    const handleNextPage = () => {
        if (currentPage < Math.ceil(filteredExpenses.length / itemsPerPage)) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleFilterChange = (e) => {
        if (e.target.name === 'filterMonth') {
            setFilterMonth(e.target.value);
        } else {
            setFilterYear(e.target.value);
        }
        setCurrentPage(1);
    };

    const filteredExpenses = expenses.filter(expense => {
        const month = moment(expense.date).format('MMMM');
        const year = moment(expense.date).format('YYYY');
        return month === filterMonth && year === filterYear;
    });

    const currentExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalExpenseForPage = currentExpenses.reduce((total, exp) => total + exp.amount, 0);

    // Store total expense for the month
    useEffect(() => {
        if (hostelName && filteredExpenses.length > 0) {
            const month = moment(filterMonth, 'MMMM').format('MMMM'); // Make sure month is in full text format
            const year = moment(filterYear, 'YYYY').format('YYYY');
            const monthYear = `${month}-${year}`;
            const totalsRef = doc(firestore, `totals/${hostelName}/totalexpense`, monthYear);
            const totalAmount = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

            setDoc(totalsRef, {
                monthYear,
                totalAmount: totalAmount.toFixed(2),
                userId // Ensure userId is stored here as well
            });
        }
    }, [filteredExpenses, hostelName, filterMonth, filterYear, userId]);

    return (
        <ManagerLayout>
            <div className="expense-page-container">
                <h2 className="expense-page-title">Expense Management</h2>
                <div className="filter-container-expense-page">
                    <label htmlFor="filterMonth">Month:</label>
                    <select
                        id="filterMonth"
                        name="filterMonth"
                        value={filterMonth}
                        onChange={handleFilterChange}
                        className="month-filter-select-expense-page"
                    >
                        {months.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                    </select>
                    <label htmlFor="filterYear">Year:</label>
                    <select
                        id="filterYear"
                        name="filterYear"
                        value={filterYear}
                        onChange={handleFilterChange}
                        className="year-filter-select-expense-page"
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <table className="expense-page-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Expense Name</th>
                            <th>Amount (₹)</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentExpenses.map((expense, index) => (
                            <tr key={expense.id}>
                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td>{expense.expenseName}</td>
                                <td>₹ {expense.amount}</td>
                                <td className="expense-page-action-buttons">
                                    <button onClick={() => handleEditExpense(expense)}><FaEdit /></button>
                                    <button onClick={() => handleDeleteExpense(expense.id)}><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td colSpan="3" className="total-expense-expense-page">Total Expense for this Page</td>
                            <td>₹ {totalExpenseForPage.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="expense-page-pagination">
                    <button
                        className="page-button-expense-page"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        <FaArrowCircleLeft />
                    </button>
                    <span className="page-number-expense-page">{currentPage}</span>
                    <button
                        className="page-button-expense-page"
                        onClick={handleNextPage}
                        disabled={currentPage === Math.ceil(filteredExpenses.length / itemsPerPage)}
                    >
                        <FaArrowCircleRight />
                    </button>
                </div>
                <div className="expense-form-container-expense-page">
                    <h1 className='heading-expense'>Expense Form</h1>
                    <form onSubmit={handleAddExpense} className="expense-form-expense-page">
                        <div className="form-group-expense-page">
                            <label>Expense Name:</label>
                            <input
                                type="text"
                                value={expenseName}
                                onChange={(e) => setExpenseName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group-expense-page">
                            <label>Amount (₹):</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group-expense-page">
                            <label>Date:</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-buttons-expense-page">
                            <button type="button" onClick={handleReset} className="reset-button-expense-page">
                                <GrPowerReset /> Reset
                            </button>
                            <button type="submit" className="expense-submit-button-expense-page">
                                {isEditing ? 'Update Expense' : 'Add Expense'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ManagerLayout>
    );
};

export default ExpensePage;
