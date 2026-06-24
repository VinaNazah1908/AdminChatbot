import { useEffect, useMemo, useState } from "react";
import { Search, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLaporans, hapusLaporan, hapusSemuaLaporan } from "../services/api";
import { Pagination } from "../components/Pagination";

export default function DataUser() {
  const [laporans, setLaporans] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState("");

  const navigate = useNavigate();
  const itemsPerPage = 10;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchLaporans = async () => {
    try {
      const data = await getLaporans();
      setLaporans(data);
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil data user.");
    }
  };

  useEffect(() => {
    fetchLaporans();
  }, []);

  const handleDelete = async (id) => {
    const ok = window.confirm(
      "Yakin ingin menghapus data user ini beserta seluruh history chatnya?",
    );

    if (!ok) return;

    try {
      await hapusLaporan(id);
      await fetchLaporans();
      showToast("Data berhasil dihapus.");
    } catch (error) {
      console.error(error);
      showToast("Gagal menghapus data.");
    }
  };

  const handleDeleteAll = async () => {
    const ok = window.confirm(
      "Yakin ingin menghapus SEMUA data user dan history chat?",
    );

    if (!ok) return;

    try {
      await hapusSemuaLaporan();
      await fetchLaporans();
      showToast("Semua data berhasil dihapus.");
    } catch (error) {
      console.error(error);
      showToast("Gagal menghapus semua data.");
    }
  };

  const filteredLaporans = useMemo(() => {
    const keyword = search.toLowerCase();

    return laporans.filter((item) => {
      return (
        item.nama_pelapor?.toLowerCase().includes(keyword) ||
        item.nomor_pelapor?.toLowerCase().includes(keyword) ||
        item.isi_laporan?.toLowerCase().includes(keyword)
      );
    });
  }, [laporans, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLaporans.length / itemsPerPage),
  );

  const paginatedLaporans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLaporans.slice(start, start + itemsPerPage);
  }, [filteredLaporans, currentPage]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const formatTanggal = (tanggal) => {
    if (!tanggal) return "-";

    return new Date(tanggal).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <main className="relative p-3">
      {toast && (
        <div className="fixed right-6 top-6 z-[10000] rounded-md bg-[#00923F] px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h1 className="mb-4 text-2xl font-bold text-[#00923F]">
            Data User Konsultasi
          </h1>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-xs">
              <div className="flex items-center overflow-hidden rounded-md border border-gray-300">
                <input
                  type="text"
                  placeholder="Cari user / laporan..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 text-sm outline-none"
                />

                <div className="px-3 text-[#00923F]">
                  <Search size={18} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={laporans.length === 0}
              className="flex items-center justify-center gap-2 rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Hapus Semua
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-gray-300">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[#f5f5f5] text-gray-700">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  No
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Nama Pelapor
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Nomor WhatsApp
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Isi Laporan Awal
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Bersedia Dihubungi
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Tanggal
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedLaporans.length > 0 ? (
                paginatedLaporans.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {item.nama_pelapor || "Anonim"}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {item.nomor_pelapor}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {item.isi_laporan}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {item.bersedia_dihubungi ? "Ya" : "Tidak"}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {formatTanggal(item.created_at)}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/riwayat-konsultasi/${item.id}`)
                          }
                          className="rounded p-1 text-[#00923F] hover:bg-green-50"
                          title="Lihat History Chat"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Hapus Data"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="border border-gray-300 px-3 py-4 text-center text-gray-500"
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLaporans.length}
          visibleItems={paginatedLaporans.length}
          onPageChange={setCurrentPage}
        />
      </div>
    </main>
  );
}
