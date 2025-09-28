import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Card, Button, Table, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
const API_URL = process.env.REACT_APP_API_URL;

const InstituteDashboard = () => {
  const [instituteId, setInstituteId] = useState(null);
  const [pending, setPending] = useState([]);
  const [linkedUsers, setLinkedUsers] = useState([]); // Placeholder for linked accounts
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ msg: '', variant: 'danger' }); 
  const [rejected, setRejected] = useState([]);
  const navigate = useNavigate();

  const config = {
    headers: {
      'x-auth-token': localStorage.getItem('token'),
    },
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (localStorage.getItem('role') !== 'institute' || !token) {
        navigate('/');
        return;
    }
    try {
        // Decode the token to get the institute information (ID and role)
        const decoded = jwtDecode(token);
        setInstituteId(decoded.user.id); // Set the instituteId from the payload
    } catch (e) {
        console.error("Failed to decode token:", e);
        // Handle corrupted token
        localStorage.clear();
        navigate('/');
        return;
    }
    fetchPendingApprovals();
    fetchLinkedUsers();
    fetchRejectedUsers();
  }, [navigate]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/dashboard/institute/pending`, config);
      // The response structure is { _id, userId: { _id, name, email }, instituteId, status, ... }
      setPending(res.data);
    } catch (err) {
      setMessage({ msg: 'Failed to fetch pending approvals.', variant: 'danger' });
      console.error(err);
       if (err.response && err.response.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/dashboard/institute/linked-users`, config);
            setLinkedUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch linked users', err);
            // Handle error/logout if necessary
        }
    };
    const fetchRejectedUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/dashboard/institute/rejected`, config);
            setRejected(res.data);
        } catch (err) {
            console.error('Failed to fetch rejected users', err);
        } finally {
            setLoading(false);
        }
    };


  const handleAction = async (userId, action) => {
    try {
      const endpoint = `/dashboard/institute/${action}/${userId}`; // 'approve' or 'reject'
      
      const requestToMove = pending.find(req => req.userId._id === userId);
      setPending(pending.filter(req => req.userId._id !== userId));
      if (action === 'approve' && requestToMove) {
            // Add the approved user to the linkedUsers list instantly
            setLinkedUsers([...linkedUsers, requestToMove.userId]);
      }else if (action === 'reject' && requestToMove) {
            // Add to rejected list instantly if action is reject
            setRejected([...rejected, requestToMove]); 
            setMessage({ msg: `${requestToMove.userId.name} rejected.`, variant: 'warning' });
      }

      await axios.put(`${API_URL}${endpoint}`, {}, config);
      
      // Refresh the list by refetching
    //   fetchPendingApprovals();
    //   fetchLinkedUsers();
      
    } catch (err) {
        setMessage({ msg: 'Action failed, refreshing data...', variant: 'danger' });
        fetchPendingApprovals(); 
        fetchLinkedUsers();
        fetchRejectedUsers(); 
        console.error(err);
    }
  };

  const handleDeleteRejected = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to unblock ${userName}? This will allow them to submit a new join request.`)) {
            return;
        }
        
        try {
            // DELETE /api/dashboard/institute/rejected/:userId
            await axios.delete(`${API_URL}/dashboard/institute/rejected/${userId}`, config);
            
            // 💡 Instant State Update: Filter the user out of the rejected list
            setRejected(rejected.filter(req => req.userId._id !== userId));

            setMessage({ msg: `${userName} is now unblocked and can reapply.`, variant: 'success' });
            
        } catch (err) {
            setMessage({ msg: `Failed to unblock user: ${err.response?.data?.msg || 'Server error'}`, variant: 'danger' });
            console.error(err);
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
        <h2>Institute Admin Dashboard</h2>
        <Button variant="outline-secondary" onClick={handleLogout}>Logout</Button>
      </div>

      {/* 💡 Display Institute ID for Development */}
            {instituteId && <Alert variant="warning" className="text-break">
                **DEV INFO:** Your Institute ID is: **`{instituteId}`**
            </Alert>}
      
      {message.msg && (
                <Alert 
                    variant={message.variant} 
                    onClose={() => setMessage({ msg: '', variant: 'danger' })} 
                    dismissible
                >
                    {message.msg} {/* Renders the string part of the object */}
                </Alert>
            )}

      <Tabs defaultActiveKey="groups" id="institute-dashboard-tabs" className="mb-3">
        
        <Tab eventKey="groups" title="Groups">
          <Card><Card.Body><Card.Title>Manage Groups</Card.Title><Card.Text>This area is for creating, editing, and assigning users to groups.</Card.Text></Card.Body></Card>
        </Tab>

        <Tab eventKey="pending-approvals" title={`Pending Approvals (${pending.length})`}>
    <Card>
        <Card.Body>
            {/* ... Table structure ... */}
            <tbody>
                {pending.length > 0 ? (
                    pending.map((request) => (
                        <tr key={request._id}>
                            <td>{request.userId.name}</td>
                            <td>{request.userId.email}</td>
                            <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                            <td>
                                <Button variant="success" size="sm" onClick={() => handleAction(request.userId._id, 'approve')} className="me-2">Approve</Button>
                                <Button variant="danger" size="sm" onClick={() => handleAction(request.userId._id, 'reject')}>Reject</Button> {/* ADDED REJECT */}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan="4" className="text-center">No pending approval requests.</td></tr>
                )}
            </tbody>
            {/* ... Table closure ... */}
        </Card.Body>
    </Card>
</Tab>

<Tab eventKey="linked-accounts" title={`Linked Accounts (${linkedUsers.length})`}>
    <Card>
        <Card.Body>
            <Card.Title>Currently Linked Users</Card.Title>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        {/* <th>Group</th> (Future feature) */}
                    </tr>
                </thead>
                <tbody>
                    {linkedUsers.length > 0 ? (
                        linkedUsers.map((user) => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                {/* <td>N/A</td> */}
                            </tr>
                        ))
                    ) : (
                         <tr><td colSpan="2" className="text-center">No users currently linked.</td></tr>
                    )}
                </tbody>
            </Table>
        </Card.Body>
    </Card>
</Tab>

<Tab eventKey="rejected-users" title={`Rejected Users (${rejected.length})`}>
                <Card>
                    <Card.Body>
                        <Card.Title>Previously Rejected Users</Card.Title>
                        <p className="text-muted">
                            Deleting a record will allow the user to submit a new join request.
                        </p>
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rejected.length > 0 ? (
                                    rejected.map((request) => (
                                        <tr key={request._id}>
                                            <td>{request.userId.name}</td>
                                            <td>{request.userId.email}</td>
                                            <td>
                                                <Button 
                                                    variant="warning" 
                                                    size="sm" 
                                                    onClick={() => handleDeleteRejected(request.userId._id, request.userId.name)}
                                                >
                                                    Delete Record (Allow Re-apply)
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="text-center">No rejected user records found.</td></tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            </Tab>

      </Tabs>
    </Container>
  );
};

export default InstituteDashboard;