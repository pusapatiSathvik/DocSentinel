import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const DocumentUploader = () => {
    const [file, setFile] = useState(null);
    const [groups, setGroups] = useState([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState([]);
    const [expiryDays, setExpiryDays] = useState(7); // Default expiry of 7 days
    const [viewOnce, setViewOnce] = useState(false);
    const [watermark, setWatermark] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ msg: '', variant: '' });
    
    const navigate = useNavigate();

    const config = {
        headers: { 'x-auth-token': localStorage.getItem('token') },
    };

    useEffect(() => {
        // Basic Auth check
        if (localStorage.getItem('role') !== 'institute' || !localStorage.getItem('token')) {
            navigate('/');
            return;
        }
        fetchGroups();
    }, [navigate]);

    const fetchGroups = async () => {
        try {
            // Reusing the group fetch logic from the dashboard
            const res = await axios.get(`${API_URL}/dashboard/institute/groups`, config);
            setGroups(res.data);
        } catch (err) {
            console.error('Failed to fetch groups', err);
            setMessage({ msg: 'Failed to load recipient groups.', variant: 'danger' });
        }
    };

    const handleGroupToggle = (groupId) => {
        setSelectedGroupIds(prevIds => 
            prevIds.includes(groupId)
                ? prevIds.filter(id => id !== groupId) // Remove
                : [...prevIds, groupId] // Add
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage({ msg: 'Please select a file to upload.', variant: 'warning' });
            return;
        }
        if (selectedGroupIds.length === 0) {
            setMessage({ msg: 'Please select at least one recipient group.', variant: 'warning' });
            return;
        }

        setLoading(true);
        setMessage({ msg: '', variant: '' });

        // 💡 Use FormData to send the file along with JSON metadata
        const formData = new FormData();
        formData.append('document', file);
        formData.append('recipients', JSON.stringify(selectedGroupIds));
        formData.append('expiryDays', expiryDays);
        formData.append('viewOnce', viewOnce);
        formData.append('watermark', watermark);

        try {
            const uploadConfig = {
                headers: {
                    ...config.headers,
                    'Content-Type': 'multipart/form-data', // Crucial for file uploads
                },
            };

            const res = await axios.post(`${API_URL}/documents/upload`, formData, uploadConfig);
            
            setMessage({ 
                msg: res.data.msg || 'Document uploaded and permissions set successfully!', 
                variant: 'success' 
            });

            // Reset form
            setFile(null);
            setSelectedGroupIds([]);
            setExpiryDays(7);
            setViewOnce(false);
            setWatermark(true);
            document.getElementById('document-file').value = null; // Clear file input

        } catch (err) {
            console.error('Upload Error:', err);
            setMessage({ 
                msg: err.response?.data?.msg || 'Upload failed. Check server logs.', 
                variant: 'danger' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Secure Document Uploader</h2>
                {/* <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </Button> */}
            </div>

            {message.msg && <Alert variant={message.variant} onClose={() => setMessage({ msg: '', variant: '' })} dismissible>{message.msg}</Alert>}

            <Card>
                <Card.Header as="h5">Upload Document & Set Permissions</Card.Header>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        
                        {/* 1. File Input */}
                        <Form.Group controlId="document-file" className="mb-4">
                            <Form.Label>Select File (PDF recommended for security)</Form.Label>
                            <Form.Control 
                                type="file" 
                                accept=".pdf,.doc,.docx" // Restrict file types
                                onChange={(e) => setFile(e.target.files[0])} 
                                required
                            />
                        </Form.Group>

                        <Row className="mb-4">
                            {/* 2. Security Options */}
                            <Col md={6}>
                                <h5>Security & Expiry</h5>
                                <Form.Group controlId="expiry-days" className="mb-3">
                                    <Form.Label>Link Expiry (Days)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={expiryDays}
                                        onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                                        required
                                    />
                                </Form.Group>

                                <Form.Check 
                                    type="switch"
                                    id="view-once-switch"
                                    label="Allow View-Once Access (Link expires after first click)"
                                    checked={viewOnce}
                                    onChange={(e) => setViewOnce(e.target.checked)}
                                    className="mb-3"
                                />

                                <Form.Check 
                                    type="switch"
                                    id="watermark-switch"
                                    label="Apply Watermark with Recipient Info (Recommended)"
                                    checked={watermark}
                                    onChange={(e) => setWatermark(e.target.checked)}
                                    className="mb-3"
                                />
                            </Col>

                            {/* 3. Recipient Groups */}
                            <Col md={6}>
                                <h5>Select Recipients (Groups)</h5>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                                    {groups.length > 0 ? (
                                        groups.map(group => (
                                            <Form.Check
                                                key={group._id}
                                                type="checkbox"
                                                id={`group-${group._id}`}
                                                label={`${group.name} (${group.members?.length || 0} users)`}
                                                checked={selectedGroupIds.includes(group._id)}
                                                onChange={() => handleGroupToggle(group._id)}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-muted">No groups found. Please create groups first.</p>
                                    )}
                                </div>
                                {selectedGroupIds.length === 0 && (
                                     <Alert variant="warning" className="mt-2 p-2">Select at least one group.</Alert>
                                )}
                            </Col>
                        </Row>

                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={loading || !file || selectedGroupIds.length === 0}
                            className="w-100"
                        >
                            {loading ? 'Processing...' : 'Upload & Distribute Document'}
                        </Button>

                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DocumentUploader;