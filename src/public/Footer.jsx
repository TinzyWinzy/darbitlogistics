export default function Footer() {
  return (
    <footer className="bg-white border-top mt-5 py-5" style={{ background: 'rgba(255,255,255,0.95)' }}>
      <div className="container">
        <div className="row align-items-center gy-3">
          <div className="col-12 col-md-6 text-center text-md-start mb-2 mb-md-0">
            <span className="fw-bold" style={{ color: '#1F2120' }}>Morres Logistics &copy; {new Date().getFullYear()}</span>
            <span className="ms-3 badge bg-warning text-dark small align-middle">STRATEGIC OPERATIONS CONSOLE</span>
          </div>
          <div className="col-12 col-md-6 text-center text-md-end">
            <span className="me-2">Support:</span>
            <a href="mailto:jackfeng@morres.com" className="text-decoration-underline" style={{ color: '#1F2120' }}>jackfeng@morres.com</a>
            <span className="mx-2">|</span>
            <a href="tel:+263788888886" className="text-decoration-underline" style={{ color: '#1F2120' }}>+263 78 888 8886</a>
            <span className="mx-2">|</span>
            <a href="http://www.morreslogistics.com" className="text-decoration-underline" style={{ color: '#1F2120' }}>www.morreslogistics.com</a>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col text-center text-muted small">
            All rights reserved. | <a href="/legal" className="text-decoration-underline" style={{ color: '#1F2120' }}>Legal</a>
            <span className="mx-2">|</span>
            <span className="text-secondary" style={{ opacity: 0.5 }}>
              Social links disabled for internal version
            </span>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col text-center">
            <span className="badge bg-success text-white fs-6" style={{ background: '#16a34a', borderRadius: '0.5em', padding: '0.5em 1em' }}>
              Powered by Dar Logistics Technology
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
} 