import { useEffect, useMemo, useState } from "react";
import {
  getDataLayanan,
  tambahDataLayanan,
  updateDataLayanan,
  hapusDataLayanan,
  rebuildDataLayanan,
} from "../services/api";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  Save,
  Phone,
  RefreshCw,
} from "lucide-react";

export default function DataLayanan() {
  const [dataLayanan, setDataLayanan] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState("");
  const [isRebuilding, setIsRebuilding] = useState(false);

  const itemsPerPage = 10;

  const emptyForm = {
    title: "",
    description: "",
    contactName: "",
    whatsapp: "",
    jam: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchDataLayanan = async () => {
    try {
      const data = await getDataLayanan();
      setDataLayanan(data);
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil data layanan.");
    }
  };

  useEffect(() => {
    fetchDataLayanan();
  }, []);

  const filteredDataLayanan = useMemo(() => {
    const keyword = search.toLowerCase();

    return dataLayanan.filter((item) => {
      return (
        item.nama_layanan?.toLowerCase().includes(keyword) ||
        item.deskripsi?.toLowerCase().includes(keyword) ||
        item.nama_kontak?.toLowerCase().includes(keyword) ||
        item.nomor_wa?.toLowerCase().includes(keyword) ||
        item.jam?.toLowerCase().includes(keyword)
      );
    });
  }, [dataLayanan, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDataLayanan.length / itemsPerPage)
  );

  const paginatedDataLayanan = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDataLayanan.slice(start, start + itemsPerPage);
  }, [filteredDataLayanan, currentPage]);

  const openAddModal = () => {
    setMode("add");
    setSelectedId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setMode("edit");
    setSelectedId(item.id);
    setFormData({
      title: item.nama_layanan || "",
      description: item.deskripsi || "",
      contactName: item.nama_kontak || "",
      whatsapp: item.nomor_wa || "",
      jam: item.jam || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRebuild = async () => {
    const ok = window.confirm("Yakin ingin rebuild data layanan?");
    if (!ok) return;

    try {
      setIsRebuilding(true);

      const result = await rebuildDataLayanan();

      if (result.success) {
        showToast("Rebuild data layanan berhasil.");
      } else {
        showToast("Rebuild data layanan gagal.");
        console.error(result.error);
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi error saat rebuild.");
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.description ||
      !formData.contactName ||
      !formData.whatsapp ||
      !formData.jam
    ) {
      alert("Semua field wajib diisi.");
      return;
    }

    const payload = {
      nama_layanan: formData.title,
      deskripsi: formData.description,
      nama_kontak: formData.contactName,
      nomor_wa: formData.whatsapp,
      jam: formData.jam,
    };

    try {
      if (mode === "add") {
        await tambahDataLayanan(payload);
        showToast("Data berhasil disimpan.");
      }

      if (mode === "edit" && selectedId !== null) {
        await updateDataLayanan(selectedId, payload);
        showToast("Data berhasil diedit.");
      }

      await fetchDataLayanan();
      closeModal();
    } catch (error) {
      console.error(error);
      showToast("Gagal menyimpan data.");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Yakin ingin menghapus layanan ini?");
    if (!ok) return;

    try {
      await hapusDataLayanan(id);
      await fetchDataLayanan();
      showToast("Data berhasil dihapus.");
    } catch (error) {
      console.error(error);
      showToast("Gagal menghapus data.");
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
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
            Data Layanan
          </h1>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-xs">
              <div className="flex items-center overflow-hidden rounded-md border border-gray-300">
                <input
                  type="text"
                  placeholder="Cari data layanan..."
                  value={search}
                  onChange={handleSearchChange}
                  disabled={isRebuilding}
                  className="w-full px-3 py-2 text-sm outline-none disabled:bg-gray-100"
                />
                <div className="px-3 text-[#00923F]">
                  <Search size={18} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openAddModal}
                disabled={isRebuilding}
                className="flex items-center gap-2 rounded-md border border-[#00923F] px-4 py-2 text-sm font-medium text-[#00923F] hover:bg-[#f3fbf6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Tambah
              </button>

              <button
                type="button"
                onClick={handleRebuild}
                disabled={isRebuilding}
                className="flex items-center gap-2 rounded-md border border-[#00923F] px-4 py-2 text-sm font-medium text-[#00923F] hover:bg-[#f3fbf6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={isRebuilding ? "animate-spin" : ""}
                />
                {isRebuilding ? "Rebuilding..." : "Re-build"}
              </button>
            </div>
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
                  Nama Layanan
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Deskripsi
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Kontak
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Jam
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedDataLayanan.length > 0 ? (
                paginatedDataLayanan.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {item.nama_layanan}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {item.deskripsi}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      <div>
                        <p className="font-medium">{item.nama_kontak}</p>
                        <p className="text-gray-600">{item.nomor_wa}</p>
                      </div>
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {item.jam}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isRebuilding}
                          className="rounded p-1 text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isRebuilding}
                          className="rounded p-1 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="border border-gray-300 px-3 py-4 text-center text-gray-500"
                  >
                    Data tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-gray-600">
            Menampilkan {paginatedDataLayanan.length} dari{" "}
            {filteredDataLayanan.length} data
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isRebuilding}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                disabled={isRebuilding}
                className={`rounded-md px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                  currentPage === page
                    ? "bg-[#00923F] text-white"
                    : "border border-gray-300 text-gray-700"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || isRebuilding}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && !isRebuilding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-md bg-white shadow-xl">
            <div className="shrink-0 border-b border-gray-200 p-6">
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-4 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>

              <h2 className="text-center text-2xl font-bold text-[#00923F]">
                {mode === "add" ? "Tambah Data Layanan" : "Edit Data Layanan"}
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                    Nama Layanan
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Contoh: Layanan Kemahasiswaan"
                    className="w-full rounded-md border-2 border-[#34a853] px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                    Nama Kontak
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder="Contoh: Ibu Nadya Safitri"
                    className="w-full rounded-md border-2 border-[#34a853] px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                    WhatsApp
                  </label>
                  <div className="flex overflow-hidden rounded-md border-2 border-[#34a853]">
                    <input
                      type="text"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleChange}
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-2.5 text-sm outline-none"
                    />
                    <div className="flex items-center bg-[#00923F] px-4 text-white">
                      <Phone size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                    Jam Layanan
                  </label>
                  <input
                    type="text"
                    name="jam"
                    value={formData.jam}
                    onChange={handleChange}
                    placeholder="Contoh: 08.00 - 17.00"
                    className="w-full rounded-md border-2 border-[#34a853] px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                    Deskripsi
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Deskripsi layanan"
                    rows="5"
                    className="w-full rounded-md border-2 border-[#34a853] px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-gray-200 bg-white p-6">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-md border border-[#00923F] px-5 py-2.5 text-sm font-medium text-[#00923F] hover:bg-[#f3fbf6]"
                  >
                    <Save size={18} />
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRebuilding && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex w-350px flex-col items-center rounded-2xl bg-white px-8 py-8 shadow-2xl">
            <div className="mb-5 h-16 w-16 animate-spin rounded-full border-4 border-[#00923F] border-t-transparent" />

            <h2 className="text-xl font-bold text-[#00923F]">
              Rebuilding Data Layanan
            </h2>

            <p className="mt-3 text-center text-sm text-gray-600">
              Sistem sedang memproses data layanan, membuat embedding, dan
              memperbarui FAISS index data layanan.
            </p>

            <p className="mt-5 text-xs text-gray-400">
              Mohon tunggu sebentar...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}