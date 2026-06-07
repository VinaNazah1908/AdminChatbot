import { useEffect, useMemo, useState } from "react";
import {
  getDokumen,
  uploadDokumen,
  hapusDokumen,
  lihatDokumen,
  updateDokumen,
  rebuildDokumenRag,
} from "../services/api";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  X,
  Save,
  Upload,
} from "lucide-react";

export default function DokumenRag() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState("");
  const [isRebuilding, setIsRebuilding] = useState(false);

  const itemsPerPage = 5;

  const emptyForm = {
    judul: "",
    file: null,
  };

  const [formData, setFormData] = useState(emptyForm);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchDocuments = async () => {
    try {
      const data = await getDokumen();
      setDocuments(data);
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil dokumen.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    const keyword = search.toLowerCase();

    return documents.filter((doc) =>
      doc.judul?.toLowerCase().includes(keyword)
    );
  }, [documents, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocuments.length / itemsPerPage)
  );

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDocuments.slice(start, start + itemsPerPage);
  }, [filteredDocuments, currentPage]);

  const openAddModal = () => {
    setMode("add");
    setSelectedId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (doc) => {
    setMode("edit");
    setSelectedId(doc.id);
    setFormData({
      judul: doc.judul || "",
      file: null,
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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;

    if (selectedFile && selectedFile.type !== "application/pdf") {
      alert("File harus PDF.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      file: selectedFile,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.judul) {
      alert("Judul wajib diisi.");
      return;
    }

    try {
      if (mode === "add") {
        if (!formData.file) {
          alert("File wajib diisi.");
          return;
        }

        const form = new FormData();
        form.append("judul", formData.judul);
        form.append("file", formData.file);

        await uploadDokumen(form);
        showToast("Dokumen berhasil diupload.");
      }

      if (mode === "edit") {
        await updateDokumen(selectedId, {
          judul: formData.judul,
        });

        showToast("Judul dokumen berhasil diedit.");
      }

      await fetchDocuments();
      closeModal();
    } catch (error) {
      console.error(error);
      showToast("Gagal menyimpan dokumen.");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus dokumen ini?");
    if (!confirmDelete) return;

    try {
      await hapusDokumen(id);
      await fetchDocuments();
      showToast("Dokumen berhasil dihapus.");
    } catch (error) {
      console.error(error);
      showToast("Gagal menghapus dokumen.");
    }
  };

  const handleRebuild = async () => {
    const ok = window.confirm("Yakin ingin rebuild dokumen RAG?");
    if (!ok) return;

    try {
      setIsRebuilding(true);

      const result = await rebuildDokumenRag();

      if (result.success) {
        showToast("Rebuild dokumen RAG berhasil.");
      } else {
        showToast("Rebuild dokumen RAG gagal.");
        console.error(result.error);
      }
    } catch (error) {
      console.error(error);
      showToast("Terjadi error saat rebuild.");
    } finally {
      setIsRebuilding(false);
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
            Dokumen RAG
          </h1>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-xs">
              <div className="flex items-center overflow-hidden rounded-md border border-gray-300">
                <input
                  type="text"
                  placeholder="Cari dokumen..."
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
                  Judul Dokumen
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedDocuments.length > 0 ? (
                paginatedDocuments.map((doc, index) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      {doc.judul}
                    </td>

                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => lihatDokumen(doc.id)}
                          disabled={isRebuilding}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Lihat Dokumen"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(doc)}
                          disabled={isRebuilding}
                          className="rounded p-1 text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Edit Judul"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
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
                    colSpan="3"
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
            Menampilkan {paginatedDocuments.length} dari{" "}
            {filteredDocuments.length} data
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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
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
              )
            )}

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
          <div className="relative w-full max-w-lg rounded-md bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={18} />
            </button>

            <h2 className="mb-6 text-center text-2xl font-bold text-[#00923F]">
              {mode === "add" && "Tambah Dokumen RAG"}
              {mode === "edit" && "Edit Judul Dokumen"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                  Judul Dokumen
                </label>
                <input
                  type="text"
                  name="judul"
                  value={formData.judul}
                  onChange={handleChange}
                  placeholder="Contoh: Pedoman Akademik"
                  className="w-full rounded-md border-2 border-[#34a853] px-4 py-2.5 text-sm outline-none"
                />
              </div>

              {mode === "add" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                    File PDF
                  </label>

                  <div className="flex overflow-hidden rounded-md border-2 border-[#34a853]">
                    <input
                      type="text"
                      value={formData.file?.name || ""}
                      placeholder="Pilih file PDF"
                      readOnly
                      className="w-full px-4 py-2.5 text-sm outline-none"
                    />

                    <label className="flex cursor-pointer items-center gap-2 bg-[#00923F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#007a35]">
                      <Upload size={16} />
                      Upload
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              )}

              {mode === "edit" && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  Edit hanya mengubah judul dokumen. File PDF tetap sama.
                </div>
              )}

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
            </form>
          </div>
        </div>
      )}

      {isRebuilding && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex w-[350px] flex-col items-center rounded-2xl bg-white px-8 py-8 shadow-2xl">
            <div className="mb-5 h-16 w-16 animate-spin rounded-full border-4 border-[#00923F] border-t-transparent" />

            <h2 className="text-xl font-bold text-[#00923F]">
              Rebuilding RAG
            </h2>

            <p className="mt-3 text-center text-sm text-gray-600">
              Sistem sedang memproses dokumen, membuat embedding, dan
              memperbarui FAISS index.
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