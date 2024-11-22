import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, getUserRole } from '../../services/authService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/Common/Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const userCredential = await signIn(email, password);
            const role = await getUserRole(userCredential.user.uid);
            if (role === 'admin') {
                navigate('/admin/add-manager');
            } else if (role === 'manager') {
                navigate('/manager/dashboard-overview');
            } else {
                toast.error('Access Denied');
            }
        } catch (error) {
            console.error('Login Error', error);
            toast.error('Login Failed');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                />
                <div className="password-container-login">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                    />
                    <span className="eye-icon" onClick={togglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>
                <button onClick={handleLogin}>LOGIN</button>
            </div>
        </div>
    );
};

export default Login;
