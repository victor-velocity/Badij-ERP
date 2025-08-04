// components/Pagination.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Pagination = ({ totalPages, currentPage, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisiblePages = 5;

  const renderPages = () => {
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    const visiblePages = pages.slice(startPage - 1, endPage);

    const pageElements = visiblePages.map(page => (
      <button
        key={page}
        onClick={() => onPageChange(page)}
        className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold transition-colors duration-200 
          ${currentPage === page ? 'bg-[#b88b1b] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
      >
        {page}
      </button>
    ));

    // Add ellipses if necessary
    if (startPage > 1) {
      pageElements.unshift(<span key="start-ellipsis" className="px-2 text-gray-400">...</span>);
      pageElements.unshift(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold transition-colors duration-200 
            ${currentPage === 1 ? 'bg-[#b88b1b] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          1
        </button>
      );
    }
    if (endPage < totalPages) {
      pageElements.push(<span key="end-ellipsis" className="px-2 text-gray-400">...</span>);
      pageElements.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold transition-colors duration-200 
            ${currentPage === totalPages ? 'bg-[#b88b1b] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          {totalPages}
        </button>
      );
    }

    return pageElements;
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
      </button>

      {renderPages()}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FontAwesomeIcon icon={faChevronRight} />
      </button>
    </div>
  );
};

export default Pagination;