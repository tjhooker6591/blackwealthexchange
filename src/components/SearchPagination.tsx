// components/SearchPagination.tsx
import React from "react";

type Props = {
  currentPage: number;
  totalResults: number;
  resultsPerPage?: number;
  onPageChange: (page: number) => void;
};

const MAX_PAGES_DISPLAYED = 10; // Like Google, show up to 10 page buttons

const SearchPagination: React.FC<Props> = ({
  currentPage,
  totalResults,
  resultsPerPage = 10,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  if (totalPages <= 1) return null;

  // Pagination logic: Only show MAX_PAGES_DISPLAYED at a time, center currentPage
  let startPage = Math.max(1, currentPage - Math.floor(MAX_PAGES_DISPLAYED / 2));
  let endPage = startPage + MAX_PAGES_DISPLAYED - 1;
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - MAX_PAGES_DISPLAYED + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex items-center justify-center gap-2 mt-8 select-none">
      {currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 rounded bg-black text-gold border border-gold hover:bg-gold hover:text-black transition"
        >
          Prev
        </button>
      )}

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded ${
            page === currentPage
              ? "bg-gold text-black font-bold shadow"
              : "bg-black text-gold border border-gold hover:bg-gold hover:text-black"
          } transition`}
        >
          {page}
        </button>
      ))}

      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 rounded bg-black text-gold border border-gold hover:bg-gold hover:text-black transition"
        >
          Next
        </button>
      )}
    </nav>
  );
};

export default SearchPagination;
