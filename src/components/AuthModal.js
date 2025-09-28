import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

console.log('--- AuthModal Component Initial Load ---');
console.log('Base API_URL (from .env):', API_URL);
console.log('--------------------------------------');

const AuthModal = ({ show, handleClose, type, role }) => {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isLogin = type === 'login';
  const isInstitute = role === 'institute';

  const getTitle = () => {
    const action = isLogin ? 'Login' : 'Sign Up';
    const accessType = isInstitute ? 'Institute' : 'User';
    return `${accessType} ${action}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic frontend validation for passwords
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    
    // Determine the correct backend endpoint
    const endpoint = isLogin
      ? `/auth/${role}/login`
      : `/auth/${role}/signup`;
      
    // Prepare data for the API call
    const data = isInstitute && !isLogin 
        ? { // Institute Signup needs specific fields
            name: formData.name, 
            adminName: formData.adminName, 
            adminEmail: formData.email, 
            password: formData.password 
          }
        : { email: formData.email, password: formData.password, name: formData.name };

        const finalUrl = `${API_URL}${endpoint}`;
        console.log('--- API Request Details ---');
        console.log(`Action: ${isLogin ? 'LOGIN' : 'SIGNUP'}`);
        console.log(`Role: ${role}`);
        console.log('Endpoint Path:', endpoint);
        console.log('🔥 Final Target URL:', finalUrl);
        console.log('Data Payload:', data);
        console.log('---------------------------');

    try {
      const res = await axios.post(finalUrl, data);
      
      // Store the JWT token
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', role);

      // Close modal and navigate to the respective dashboard
      handleClose();
      navigate(`/dashboard/${role}`);

    } catch (err) {
      // Display error message from the backend (e.g., 'Invalid Credentials')
      const msg = err.response?.data?.msg || 'An unknown error occurred.';
      console.error('API Error:', err.response);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{getTitle()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          {/* Institute Name / User Name Fields (Unchanged from previous code) */}
          {!isLogin && isInstitute && (
            <Form.Group className="mb-3" controlId="formInstituteName">
              <Form.Label>Institute Name</Form.Label>
              <Form.Control type="text" name="name" placeholder="Enter institute name" onChange={handleChange} required />
            </Form.Group>
          )}

          {!isLogin && (
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>{isInstitute ? 'Admin Name' : 'Full Name'}</Form.Label>
              <Form.Control 
                type="text" 
                name={isInstitute ? 'adminName' : 'name'} 
                placeholder={`Enter ${isInstitute ? 'admin' : 'your'} name`} 
                onChange={handleChange} 
                required 
              />
            </Form.Group>
          )}
          
          {/* Email Field */}
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>{isInstitute ? 'Admin Email' : 'Email address'}</Form.Label>
            <Form.Control type="email" name="email" placeholder="Enter email" onChange={handleChange} required />
          </Form.Group>

          {/* Password Field */}
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" name="password" placeholder="Password" onChange={handleChange} required />
          </Form.Group>

          {/* Confirm Password */}
          {!isLogin && (
            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} required />
            </Form.Group>
          )}
          
          <div className="d-grid mt-4">
            <Button variant={isLogin ? 'primary' : 'success'} type="submit" disabled={loading}>
              {loading ? 'Loading...' : getTitle()}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AuthModal;