export default function Footer() {
  return (
    <footer className="bg-white border-top mt-5 py-4" style={{ background: 'rgba(255,255,255,0.95)' }}>
      <div className="container">
        <div className="row align-items-center gy-3">
          <div className="col-12 col-md-4 text-center text-md-start">
            <span className="fw-bold" style={{ color: '#D2691E' }}>Morres Logistics &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="col-12 col-md-4 text-center">
            <span className="me-2">Contact:</span>
            <a href="mailto:info@morreslogistics.com" className="text-decoration-underline" style={{ color: '#a14e13' }}>info@morreslogistics.com</a>
            <span className="mx-2">|</span>
            <a href="tel:+263771234567" className="text-decoration-underline" style={{ color: '#a14e13' }}>+263 77 123 4567</a>
          </div>
          <div className="col-12 col-md-4 text-center text-md-end">
            <h5 className="text-uppercase fw-bold" style={{ color: '#a14e13' }}>Follow Us</h5>
            <div className="mt-3">
              <a href="mailto:info@morreslogistics.com" className="me-3" style={{ color: '#D2691E' }}><span className="material-icons-outlined align-middle">alternate_email</span></a>
              <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="me-3" style={{ color: '#D2691E' }}><span className="material-icons-outlined align-middle">facebook</span></a>
              <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#D2691E' }}><span className="material-icons-outlined align-middle">linkedin</span></a>
            </div>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col text-center text-muted small">
            All rights reserved. | <a href="/legal" className="text-decoration-underline" style={{ color: '#a14e13' }}>Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
} 