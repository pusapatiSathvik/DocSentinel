import React, { useState } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import AuthModal from './AuthModal';

const LandingPage = () => {
  // State to control which modal is open and the role (user or institute)
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('login'); // 'login' or 'signup'
  const [role, setRole] = useState('user'); // 'user' or 'institute'

  const handleShow = (type, selectedRole) => {
    setModalType(type);
    setRole(selectedRole);
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  return (
    <Container className="text-center mt-5">
      <h1 className="mb-4">Welcome to the Project Hub</h1>
      <p className="lead mb-5">Select your access type to continue.</p>

      <Row className="justify-content-center">
        {/* Institute Access Card */}
        <Col md={5} className="mb-4">
          <Card className="shadow-lg h-100">
            <Card.Body>
              <Card.Title className="h3">Institute / Organization Access</Card.Title>
              <Card.Text className="text-muted">
                Manage groups, linked accounts, and pending approvals.
              </Card.Text>
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => handleShow('login', 'institute')}
                >
                  Institute Login
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="lg" 
                  onClick={() => handleShow('signup', 'institute')}
                >
                  Institute Sign Up
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* User Access Card */}
        <Col md={5} className="mb-4">
          <Card className="shadow-lg h-100">
            <Card.Body>
              <Card.Title className="h3">User / Student Access</Card.Title>
              <Card.Text className="text-muted">
                Access your documents and view connected institute details.
              </Card.Text>
              <div className="d-grid gap-2">
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={() => handleShow('login', 'user')}
                >
                  User Login
                </Button>
                <Button 
                  variant="outline-success" 
                  size="lg" 
                  onClick={() => handleShow('signup', 'user')}
                >
                  User Sign Up
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Auth Modal Component */}
      <AuthModal 
        show={showModal} 
        handleClose={handleClose} 
        type={modalType} 
        role={role} 
      />
    </Container>
  );
};

export default LandingPage;