import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Card, Button, Table, Alert, Form } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
const API_URL = process.env.REACT_APP_API_URL;

const UserDashboard = () => {
    const [userId, setUserId] = useState(null);
    const [institutes, setInstitutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [joinInstituteId, setJoinInstituteId] = useState(''); // New state for the ID input
    const [joinMessage, setJoinMessage] = useState({ msg: '', variant: '' });



    const navigate = useNavigate();

    // Helper to configure Axios with the JWT token
    const config = {
        headers: {
            'x-auth-token': localStorage.getItem('token'),
        },
    };

    useEffect(() => {
        // Basic route protection check
        const token = localStorage.getItem('token');
        if (localStorage.getItem('role') !== 'user' || !token) {
            navigate('/');
            return;
        }
        try {
            // Decode the token to get the user information (ID and role)
            const decoded = jwtDecode(token);
            setUserId(decoded.user.id); // Set the userId from the payload
        } catch (e) {
            console.error("Failed to decode token:", e);
            // Handle corrupted token by logging out
            localStorage.clear();
            navigate('/');
            return;
        }
        fetchInstitutes();
    }, [navigate]);

    const fetchInstitutes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/dashboard/user/institutes`, config);
            setInstitutes(res.data);
        } catch (err) {
            setError('Failed to fetch institute details. You might need to log in again.');
            console.error(err);
            // Clear token and redirect if 401 Unauthorized
            if (err.response && err.response.status === 401) {
                localStorage.clear();
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleJoinSubmit = async (e) => {
        e.preventDefault();
        setJoinMessage({ msg: '', variant: '' }); // Clear previous message

        const instituteId = joinInstituteId.trim();

        if (!instituteId) {
            setJoinMessage({ msg: 'Please enter a valid Institute ID.', variant: 'warning' });
            return;
        }

        // Check if the ID format looks plausible (optional, but good practice for Mongo IDs)
        if (instituteId.length !== 24) {
            setJoinMessage({ msg: 'Invalid Institute ID format. Please check the ID.', variant: 'danger' });
            return;
        }

        try {
            // API call to POST /api/dashboard/user/join/:instituteId
            console.log("sending a join req to :");
            console.log(`${API_URL}/dashboard/user/join/${instituteId}`);
            const res = await axios.post(`${API_URL}/dashboard/user/join/${instituteId}`, {}, config);


            setJoinMessage({ msg: res.data.msg, variant: 'success' });
            setJoinInstituteId(''); // Clear input on success

            // Optionally refresh connected institutes list if the join was automatic/approved instantly (not our case, but good habit)
            // fetchInstitutes(); 

        } catch (err) {
            // The backend should return 404 if the ID is wrong, or 400 for existing pending/approved.
            const msg = err.response?.data?.msg || 'Failed to send join request. Please verify the ID.';
            setJoinMessage({ msg, variant: 'danger' });
            console.error("Join Request Error:", err.response);
        }
    };

    const handleLeave = async (instituteId, instituteName) => {
        if (!window.confirm(`Are you sure you want to leave ${instituteName}?`)) {
            return;
        }
        try {
            await axios.post(`${API_URL}/dashboard/user/leave/${instituteId}`, {}, config);
            // Refresh the list after leaving
            setInstitutes(institutes.filter(inst => inst._id !== instituteId));
        } catch (err) {
            setError(`Failed to leave institute: ${err.response?.data?.msg || 'Server error'}`);
        }
    };



    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    if (loading) return <Container className="mt-5">Loading Dashboard...</Container>;

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>User Dashboard</h2>
                <Button variant="outline-secondary" onClick={handleLogout}>Logout</Button>
            </div>

            {/* 💡 Display User ID for Development */}
            {userId && <Alert variant="info" className="text-break">
                **DEV INFO:** Your User ID is: **`{userId}`**
            </Alert>}

            {error && <Alert variant="danger">{error}</Alert>}

            <Tabs defaultActiveKey="documents" id="user-dashboard-tabs" className="mb-3">
                <Tab eventKey="documents" title="Documents">
                    <Card><Card.Body><Card.Title>Your Documents</Card.Title><Card.Text>This is the placeholder for your document management system.</Card.Text></Card.Body></Card>
                </Tab>

                <Tab eventKey="institute-details" title="Connected Institutes">
                    <Card>
                        <Card.Body>
                            <Card.Title>My Institutions ({institutes.length})</Card.Title>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Institute Name</th>
                                        <th>Admin Contact</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {institutes.length > 0 ? (
                                        institutes.map((inst) => (
                                            <tr key={inst._id}>
                                                <td>{inst.name}</td>
                                                <td>{inst.adminEmail}</td>
                                                <td>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleLeave(inst._id, inst.name)}
                                                    >
                                                        Leave
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="3" className="text-center">Not connected to any institutes.</td></tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="join-institute" title="Join Institute">
                    <Card>
                        <Card.Body>
                            <Card.Title>Request to Join by Institute ID</Card.Title>
                            <p className="text-muted">
                                To join an organization, enter the unique Institute ID provided by their administrator.
                            </p>
                            {joinMessage.msg && <Alert variant={joinMessage.variant}>{joinMessage.msg}</Alert>}

                            <Form onSubmit={handleJoinSubmit}>
                                <Form.Group className="mb-3" controlId="instituteIdInput">
                                    <Form.Label>Institute ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter the 24-character Institute ID"
                                        value={joinInstituteId}
                                        onChange={(e) => setJoinInstituteId(e.target.value)}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        This ID is specific to the Institute you wish to join.
                                    </Form.Text>
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={!joinInstituteId.trim()}
                                >
                                    Submit Join Request
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>

            </Tabs>
        </Container>
    );
};

export default UserDashboard;