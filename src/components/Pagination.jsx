import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useEffect, useState } from "react";

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  visibleItems,
  onPageChange,
  disabled = false,
}) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const safeTotalPages = Math.max(1, totalPages);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= safeTotalPages;

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), safeTotalPages);
    onPageChange(nextPage);
  };

  const submitPageInput = () => {
    const parsedPage = Number(pageInput);

    if (!Number.isFinite(parsedPage)) {
      setPageInput(String(currentPage));
      return;
    }

    goToPage(parsedPage);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "Enter") {
      submitPageInput();
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-600">
        Menampilkan <span className="font-medium">{visibleItems}</span> dari{" "}
        <span className="font-medium">{totalItems}</span> data
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(1)}
          disabled={disabled || isFirstPage}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          title="Halaman pertama"
        >
          <ChevronsLeft size={16} />
        </button>

        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={disabled || isFirstPage}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          title="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1">
          <span className="text-sm text-gray-600">Halaman</span>
          <input
            type="number"
            min="1"
            max={safeTotalPages}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={submitPageInput}
            onKeyDown={handleInputKeyDown}
            disabled={disabled}
            className="h-7 w-16 rounded border border-gray-200 px-2 text-center text-sm font-medium text-gray-800 outline-none focus:border-[#00923F] disabled:bg-gray-100"
          />
          <span className="text-sm text-gray-600">dari {safeTotalPages}</span>
        </div>

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={disabled || isLastPage}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          title="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>

        <button
          type="button"
          onClick={() => goToPage(safeTotalPages)}
          disabled={disabled || isLastPage}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          title="Halaman terakhir"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
