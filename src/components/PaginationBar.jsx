import React from 'react';

const PaginationBar = ({ page, setPage, pageSize, setPageSize, total }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const getPageNumbers = () => {
    const delta = 2;
    let start = Math.max(1, page - delta);
    let end = Math.min(totalPages, page + delta);
    if (page <= delta) end = Math.min(1 + 2 * delta, totalPages);
    if (page > totalPages - delta) start = Math.max(1, totalPages - 2 * delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const baseBtnStyle = {
    border: '1px solid #D2691E',
    borderRadius: 4,
    padding: '0.3em 0.7em',
    minWidth: 32,
    margin: '0 2px',
    fontSize: '0.95em',
    boxShadow: 'none',
    transition: 'background 0.2s, color 0.2s',
    fontWeight: 500,
    outline: 'none',
    background: '#fff',
    color: '#1F2120',
    cursor: 'pointer',
  };
  const disabledBtnStyle = {
    ...baseBtnStyle,
    background: '#faf9f7',
    color: '#bbb',
    cursor: 'not-allowed',
  };
  const activeBtnStyle = {
    ...baseBtnStyle,
    background: '#D2691E',
    color: '#fff',
    fontWeight: 700,
  };

  return (
    <nav
      className="pagination-bar"
      role="navigation"
      aria-label="Pagination"
      style={{
        display: 'flex',
        gap: 0,
        justifyContent: 'center',
        margin: '0.5rem 0 0.5rem 0',
        background: '#fffbe6',
        borderRadius: 6,
        boxShadow: 'none',
        padding: '0.2em 0.2em',
      }}
    >
      <button
        className="pagination-btn"
        onClick={() => setPage(1)}
        disabled={page === 1}
        aria-label="First page"
        style={page === 1 ? disabledBtnStyle : baseBtnStyle}
      >«</button>
      <button
        className="pagination-btn"
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        style={page === 1 ? disabledBtnStyle : baseBtnStyle}
      >‹</button>
      {getPageNumbers().map(p => (
        <button
          key={p}
          className="pagination-btn"
          onClick={() => setPage(p)}
          aria-label={`Go to page ${p}`}
          aria-current={p === page ? "page" : undefined}
          style={p === page ? activeBtnStyle : baseBtnStyle}
        >{p}</button>
      ))}
      <button
        className="pagination-btn"
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        style={page === totalPages ? disabledBtnStyle : baseBtnStyle}
      >›</button>
      <button
        className="pagination-btn"
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages}
        aria-label="Last page"
        style={page === totalPages ? disabledBtnStyle : baseBtnStyle}
      >»</button>
      <div className="ms-2">
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto', display: 'inline-block', fontSize: '0.95em', padding: '0.2em 0.5em' }}
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          aria-label="Select page size"
        >
          {[5, 10, 20, 50, 100].map(size => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>
      </div>
    </nav>
  );
};

export default PaginationBar; 