import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../App';
import { invoiceApi } from '../services/api';
import { FaFileDownload } from 'react-icons/fa';

function Spinner() {
  return (
    <div className="d-flex justify-content-center align-items-center py-4">
      <div className="spinner-border" style={{ color: '#1F2120' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default function InvoiceHistory() {
  const { user } = useContext(AuthContext);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    setLoadingInvoices(true);
    invoiceApi.getInvoices().then(setInvoices).finally(() => setLoadingInvoices(false));
  }, []);

  if (!user) return null;

  return (
    <div className="container py-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-light fw-bold">Invoice History</div>
        <div className="card-body">
          {loadingInvoices ? <Spinner /> : invoices.length > 0 ? (
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Paid</th>
                  <th>Date</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.invoiceId || inv.invoice_id}>
                    <td>{inv.invoiceId || inv.invoice_id}</td>
                    <td>{inv.amount}</td>
                    <td>{inv.currency}</td>
                    <td>
                      <span className={`badge bg-${inv.paid ? 'success' : 'danger'}`}>{inv.paid ? 'Yes' : 'No'}</span>
                    </td>
                    <td>{inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : ''}</td>
                    <td>
                      <a
                        href={`$${process.env.VITE_API_URL || ''}/api/invoices/${inv.invoiceId || inv.invoice_id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                        title="Download invoice"
                        aria-label="Download invoice"
                      >
                        <FaFileDownload className="me-1" />Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="text-muted">No invoices found.</div>}
        </div>
      </div>
    </div>
  );
} 