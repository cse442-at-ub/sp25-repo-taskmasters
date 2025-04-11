import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import the illustration
import LoginIllustration from '../assets/LoginIllustration.jpeg';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="container-fluid min-vh-100" style={{ background: 'linear-gradient(to bottom right, #f3f0ff, #ffffff)' }}>
      {/* Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
        <div className="container">
          <div className="navbar-brand d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#9706e9" className="bi bi-list me-2" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
            </svg>
            <span className="fw-medium">TaskMasters</span>
          </div>
          <div className="d-flex gap-2">
            <button 
              onClick={() => navigate('/login')}
              className="btn"
              style={{ borderColor: '#9706e9', color: '#9706e9', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(151, 6, 233, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn text-white"
              style={{ backgroundColor: '#9706e9', borderColor: '#9706e9', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#8005cc'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9706e9'}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container py-5">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <h1 className="display-4 fw-bold mb-4">
              Manage Your Tasks Seamlessly with TaskMasters
            </h1>
            <p className="lead text-muted mb-4">
              Track progress, set priorities, and earn rewards as you accomplish your tasks.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="btn btn-lg text-white"
              style={{ backgroundColor: '#9706e9', borderColor: '#9706e9', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#8005cc'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9706e9'}
            >
              Sign Up Now
            </button>
          </div>
          <div className="col-lg-6 text-center">
            <img
              src={LoginIllustration}
              alt="Task management illustration"
              className="img-fluid shadow-lg"
              style={{ maxWidth: '500px' }}
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-5">
        <h2 className="text-center fw-bold mb-5">Features</h2>
        <div className="row g-4">
          {/* Feature 1 */}
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="mb-3" style={{ color: '#9706e9' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-clipboard-check" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/>
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                  </svg>
                </div>
                <h3 className="h5 fw-bold mb-2">Progress Tracking</h3>
                <p className="text-muted mb-0">Monitor your task completion and stay on top of deadlines.</p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="mb-3" style={{ color: '#9706e9' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-flag" viewBox="0 0 16 16">
                    <path d="M14.778.085A.5.5 0 0 1 15 .5V8a.5.5 0 0 1-.314.464L14.5 8l.186.464-.003.001-.006.003-.023.009a12.435 12.435 0 0 1-.397.15c-.264.095-.631.223-1.047.35-.816.252-1.879.523-2.71.523-.847 0-1.548-.28-2.158-.525l-.028-.01C7.68 8.71 7.14 8.5 6.5 8.5c-.7 0-1.638.23-2.437.477A19.626 19.626 0 0 0 3 9.342V15.5a.5.5 0 0 1-1 0V.5a.5.5 0 0 1 1 0v.282c.226-.079.496-.17.79-.26C4.606.272 5.67 0 6.5 0c.84 0 1.524.277 2.121.519l.043.018C9.286.788 9.828 1 10.5 1c.7 0 1.638-.23 2.437-.477a19.587 19.587 0 0 0 1.349-.476l.019-.007.004-.002h.001"/>
                  </svg>
                </div>
                <h3 className="h5 fw-bold mb-2">Priority Settings</h3>
                <p className="text-muted mb-0">Organize your tasks by priority to increase productivity.</p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="col-md-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="mb-3" style={{ color: '#9706e9' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-trophy" viewBox="0 0 16 16">
                    <path d="M2.5.5A.5.5 0 0 1 3 0h10a.5.5 0 0 1 .5.5c0 .538-.012 1.05-.034 1.536a3 3 0 1 1-1.133 5.89c-.79 1.865-1.878 2.777-2.833 3.011v2.173l1.425.356c.194.048.377.135.537.255L13.3 15.1a.5.5 0 0 1-.3.9H3a.5.5 0 0 1-.3-.9l1.838-1.379c.16-.12.343-.207.537-.255L6.5 13.11v-2.173c-.955-.234-2.043-1.146-2.833-3.012a3 3 0 1 1-1.132-5.89A33.076 33.076 0 0 1 2.5.5z"/>
                  </svg>
                </div>
                <h3 className="h5 fw-bold mb-2">Rewards for Achievements</h3>
                <p className="text-muted mb-0">Earn rewards as you complete tasks and achieve milestones.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container py-5">
        <h2 className="text-center fw-bold mb-5">Testimonials</h2>
        <div className="row g-4">
          {/* Testimonial 1 */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(to bottom right, #f3f0ff, #ffffff)' }}>
              <div className="card-body">
                <p className="lead fst-italic mb-3">
                  "TaskMasters has revolutionized the way I manage my workload. The progress tracking feature is a game-changer!"
                </p>
                <p className="text-end text-muted mb-0">- Ashton Hall</p>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(to bottom right, #f3f0ff, #ffffff)' }}>
              <div className="card-body">
                <p className="lead fst-italic mb-3">
                  "I love the priority settings feature. It helps me focus on what's important and get things done efficiently."
                </p>
                <p className="text-end text-muted mb-0">- Samantha Lee</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-top py-4">
        <div className="container text-center text-muted">
          <p className="mb-0">© 2024 TaskMasters. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
