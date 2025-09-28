import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Card, Button, Table, Alert, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import GroupsPage from './GroupsPage';
import DocumentUploader from './DocumentUploader';
const API_URL = process.env.REACT_APP_API_URL;

const InstituteDashboard = () => {
    const [instituteId, setInstituteId] = useState(null);
    const [pending, setPending] = useState([]);
    const [linkedUsers, setLinkedUsers] = useState([]); // Placeholder for linked accounts
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ msg: '', variant: 'danger' });
    const [rejected, setRejected] = useState([]);
    const [groups, setGroups] = useState([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);


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
        fetchGroups();
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
    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${API_URL}/dashboard/institute/groups`, config);
            setGroups(res.data);
        } catch (err) {
            console.error('Failed to fetch groups', err);
        }
    }


    const handleAction = async (userId, action) => {
        if (action === 'approve') {
            const request = pending.find(req => req.userId._id === userId);
            setSelectedRequest(request);
            setShowGroupModal(true);
            return;
        }

        try {
            const endpoint = `/dashboard/institute/${action}/${userId}`; // 'approve' or 'reject'

            const requestToMove = pending.find(req => req.userId._id === userId);
            setPending(pending.filter(req => req.userId._id !== userId));
            if (action === 'approve' && requestToMove) {
                // Add the approved user to the linkedUsers list instantly
                setLinkedUsers([...linkedUsers, requestToMove.userId]);
            } else if (action === 'reject' && requestToMove) {
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
    const handleGroupAssignment = async (e, groupId, newGroupName) => {
        e.preventDefault();

        if (!selectedRequest) return;

        const userId = selectedRequest.userId._id;

        if (!groupId && !newGroupName) {
            setMessage({ msg: 'Group must be selected or created.', variant: 'warning' });
            return;
        }

        setShowGroupModal(false); // Close the modal immediately

        try {
            const endpoint = `/dashboard/institute/approve/${userId}`;

            // 1. Optimistic UI Update (before API call)
            const requestToMove = pending.find(req => req.userId._id === userId);
            setPending(pending.filter(req => req.userId._id !== userId));
            if (requestToMove) {
                setLinkedUsers([...linkedUsers, requestToMove.userId]);
            }

            // 2. Send API Call with Group Data
            const res = await axios.put(`${API_URL}${endpoint}`, { groupId, newGroupName }, config);

            // 3. Update Groups List if a new group was created
            if (newGroupName) {
                fetchGroups(); // Re-fetch all groups to get the new ID
            }

            setMessage({ msg: res.data.msg, variant: 'success' }); // Display the success message from the backend

        } catch (err) {
            // Revert UI on failure (re-fetch correct data)
            setMessage({ msg: `Approval failed: ${err.response?.data?.msg || 'Server error'}`, variant: 'danger' });
            fetchPendingApprovals();
            fetchLinkedUsers();
        }
        finally {
            setSelectedRequest(null); // Clear selected request
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

    // 💡 NEW COMPONENT: Group Assignment Modal
    const GroupAssignmentModal = () => {
        const [selectedGroupId, setSelectedGroupId] = useState('');
        const [newGroupName, setNewGroupName] = useState('');
        const [isNewGroup, setIsNewGroup] = useState(false);

        if (!selectedRequest) return null;

        const userToApprove = selectedRequest.userId.name;

        const handleSubmit = (e) => {
            handleGroupAssignment(e, isNewGroup ? null : selectedGroupId, isNewGroup ? newGroupName : null);
        };

        const handleClose = () => {
            setShowGroupModal(false);
            setSelectedRequest(null); // Clear selected request on close
        };

        return (
            <Modal show={showGroupModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Approve & Assign Group for **{userToApprove}**</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="newGroupSwitch"
                                label="Create New Group"
                                checked={isNewGroup}
                                onChange={() => {
                                    setIsNewGroup(!isNewGroup);
                                    setSelectedGroupId(''); // Clear selected group when switching
                                }}
                                className="mb-3"
                            />

                            {!isNewGroup && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Select Existing Group</Form.Label>
                                    <Form.Select
                                        value={selectedGroupId}
                                        onChange={(e) => setSelectedGroupId(e.target.value)}
                                        required={!isNewGroup}
                                    >
                                        <option value="">Choose Existing Group...</option>
                                        {groups.map(group => (
                                            <option key={group._id} value={group._id}>{group.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            {isNewGroup && (
                                <Form.Group className="mb-3">
                                    <Form.Label>New Group Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter new group name"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        required={isNewGroup}
                                    />
                                </Form.Group>
                            )}
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={handleClose} className="me-2">
                                Cancel
                            </Button>
                            <Button variant="success" type="submit" disabled={
                                // Disable button if neither a group is selected nor a new name is entered
                                (!selectedGroupId && !newGroupName)
                            }>
                                Approve & Assign
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        );
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

                <Tab eventKey="Share Documents" title={`ShareDocuments`}>
                    <DocumentUploader />
                </Tab>
                <Tab eventKey="groups" title={`Groups`}>
                    <GroupsPage />
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
            <GroupAssignmentModal />
        </Container>
    );
};

export default InstituteDashboard;