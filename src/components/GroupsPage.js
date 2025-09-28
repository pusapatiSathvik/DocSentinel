// src/components/GroupsPage.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Alert, Button } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const GroupsPage = () => {
    // ... (State declarations remain the same) ...
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ msg: '', variant: 'danger' });
    
    const navigate = useNavigate();

    const config = {
        headers: {
            'x-auth-token': localStorage.getItem('token'),
        },
    };

    useEffect(() => {
        if (localStorage.getItem('role') !== 'institute' || !localStorage.getItem('token')) {
            navigate('/');
            return;
        }
        fetchGroups();
    }, [navigate]);

    const fetchGroups = async () => {
        console.log('--- STARTING fetchGroups ---');
        setLoading(true);
        
        // 1. Log Request Setup
        const token = localStorage.getItem('token');
        const endpoint = `${API_URL}/dashboard/institute/groups`;
        console.log(`API Endpoint: ${endpoint}`);
        console.log(`Authorization Token Found: ${!!token}`);
        
        if (!token) {
            console.error('ERROR: No token found. Redirecting to login.');
            setLoading(false);
            navigate('/');
            return;
        }

        try {
            // 2. Log API Call Start
            console.log('Sending GET request to fetch groups...');
            
            const res = await axios.get(endpoint, config);
            
            // 3. Log Successful Response
            console.log('SUCCESS: API response received.');
            console.log('Raw Data:', res.data);
            
            // 4. Validate Data Structure (Crucial Check)
            if (Array.isArray(res.data) && res.data.every(g => g.members && Array.isArray(g.members))) {
                console.log('DATA OK: Groups array and populated members array found.');
                setGroups(res.data);
            } else {
                console.warn('DATA WARNING: Response is not a valid groups array with populated members. Check backend population.');
                console.log('Sample received group object:', res.data[0]);
                setGroups(res.data); // Still set the data, but log a warning
            }
            
            setMessage({ msg: '', variant: '' });

        } catch (err) {
            // 5. Log Error Details
            console.error('FETCH ERROR: Request failed.');
            if (err.response) {
                // Server responded with a status code outside the 2xx range
                console.error(`Status: ${err.response.status}`);
                console.error('Response Data:', err.response.data);
                
                // Handle specific HTTP errors
                if (err.response.status === 401 || err.response.status === 403) {
                     setMessage({ msg: 'Authentication failed or token expired. Logging out.', variant: 'danger' });
                     localStorage.clear();
                     navigate('/');
                     return;
                }
                setMessage({ msg: `Failed to fetch groups: ${err.response.data.msg || 'Server Error'}`, variant: 'danger' });
                
            } else if (err.request) {
                // The request was made but no response was received (e.g., network error)
                console.error('Network Error: No response received.', err.request);
                 setMessage({ msg: 'Network error: Could not connect to the API server.', variant: 'danger' });
            } else {
                // Something else happened in setting up the request that triggered an error
                console.error('Axios Error:', err.message);
                 setMessage({ msg: 'An unknown error occurred during the request.', variant: 'danger' });
            }
        } finally {
            setLoading(false);
            console.log('--- ENDING fetchGroups ---');
        }
    }

    if (loading) return <Container className="mt-5">Loading Groups...</Container>;

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Group Management</h2>
                {/* Optional: Button to return to the main dashboard */}
                <Button variant="outline-primary" onClick={() => navigate('/dashboard/institute/groups/edit')}>
                    Edit
                </Button>
            </div>
            
            {message.msg && (
                <Alert variant={message.variant} onClose={() => setMessage({ msg: '', variant: 'danger' })} dismissible>
                    {message.msg}
                </Alert>
            )}

            <Card>
                <Card.Body className="p-0">
                    <div className="d-flex" style={{ minHeight: '400px' }}>
                        
                        {/* 1. Group List Panel (Left Side) */}
                        <div style={{ width: '35%', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
                            <h5 className="p-3 bg-light m-0 border-bottom">All Groups ({groups.length})</h5>
                            <ul className="list-group list-group-flush">
                                {groups.length > 0 ? (
                                    groups.map((group) => (
                                        <li
                                            key={group._id}
                                            className={`list-group-item list-group-item-action ${selectedGroup && selectedGroup._id === group._id ? 'active' : ''}`}
                                            onClick={() => setSelectedGroup(group)} 
                                            style={{ cursor: 'pointer' }}
                                        >
                                            **{group.name}** <span className="badge bg-light text-dark rounded-pill float-end">
                                                {group.members?.length || 0} Members
                                            </span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="list-group-item text-center text-muted">No groups created yet.</li>
                                )}
                            </ul>
                        </div>

                        {/* 2. Group Details Panel (Right Side) */}
                        <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
                            {selectedGroup ? (
                                <>
                                    <Card.Title className="mb-3">Members in: **{selectedGroup.name}**</Card.Title>
                                    <p className="text-muted">Total Members: {selectedGroup.members.length}</p>

                                    {selectedGroup.members.length > 0 ? (
                                        <Table striped bordered hover size="sm">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedGroup.members.map(member => (
                                                    <tr key={member._id}>
                                                        <td>{member.name}</td>
                                                        <td>{member.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <Alert variant="info" className="mt-3">This group currently has no members.</Alert>
                                    )}
                                </>
                            ) : (
                                <Alert variant="secondary" className="text-center mt-5">
                                    👈 **Select a group** from the left panel to view its members.
                                </Alert>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default GroupsPage;