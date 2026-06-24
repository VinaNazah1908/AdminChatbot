import { useEffect, useMemo, useState } from "react";
import {
  getDokumen,
  uploadDokumen,
  hapusDokumen,
  lihatDokumen,
  updateDokumen,
} from "../services/api";
import { Pagination } from "../components/Pagination";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function DokumenRag() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState("");
  const [isProcessing, setIsProcessing] = useState(false); // ← Loading state

  const itemsPerPage = 10; // saya naikkan jadi 10, lebih nyaman

  

  const emptyForm = { judul: "", file: null };
  const [formData, setFormData] = useState(emptyForm);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
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
      doc.judul?.toLowerCase().includes(keyword),
    );
  }, [documents, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDocuments.length / itemsPerPage),
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
    setFormData({ judul: doc.judul || "", file: null });
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile && selectedFile.type !== "application/pdf") {
      alert("File harus PDF.");
      return;
    }
    setFormData((prev) => ({ ...prev, file: selectedFile }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.judul) {
    return alert("Judul wajib diisi.");
  }

  if (mode === "add" && !formData.file) {
    return alert("File PDF wajib diisi.");
  }

  closeModal();
  setIsProcessing(true);

  try {
    const form = new FormData();
    form.append("judul", formData.judul);

    if (formData.file) {
      form.append("file", formData.file);
    }

    if (mode === "add") {
      await uploadDokumen(form);
      showToast("Dokumen berhasil diupload dan diindex.");
    } else {
      await updateDokumen(selectedId, form);
      showToast("Dokumen berhasil diupdate.");
    }

    await fetchDocuments();
  } catch (err) {
    console.log(err);
    showToast(err.message || "Gagal memproses dokumen.");
  } finally {
    setIsProcessing(false);
  }
};

  const handleDelete = async (id) => {
    if (
      !window.confirm("Yakin ingin menghapus dokumen ini beserta vector-nya?")
    )
      return;

    try {
      await hapusDokumen(id);
      await fetchDocuments();
      showToast("Dokumen berhasil dihapus.");
    } catch (error) {
      console.error(error);
      showToast("Gagal menghapus dokumen.");
    }
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm outline-none"
                />
                <div className="px-3 text-[#00923F]">
                  <Search size={18} />
                </div>
              </div>
            </div>

            <button
              onClick={openAddModal}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-md border border-[#00923F] px-4 py-2 text-sm font-medium text-[#00923F] hover:bg-[#f3fbf6] disabled:opacity-50"
            >
              <Plus size={16} />
              Tambah Dokumen
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
                  Judul Dokumen
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center">
                  Status Index
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
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {doc.judul}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {doc.chunk_count && doc.chunk_count > 0 ? (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-green-600 font-medium">
                              {doc.chunk_count} chunks
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} className="text-red-500" />
                            <span className="text-red-500 text-xs">
                              Belum diindex
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => lihatDokumen(doc.id)}
                          className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                          title="Lihat PDF"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(doc)}
                          className="rounded p-1.5 text-amber-600 hover:bg-amber-50"
                          title="Edit Judul"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="border border-gray-300 px-3 py-8 text-center text-gray-500"
                  >
                    Tidak ada dokumen ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDocuments.length}
          visibleItems={paginatedDocuments.length}
          onPageChange={setCurrentPage}
          disabled={isProcessing}
        />
      </div>

      {/* MODAL dengan Loading */}
      {/* MODAL */}
      {isModalOpen && (
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
              {mode === "add" ? "Tambah Dokumen RAG" : "Edit Judul Dokumen"}
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
                  placeholder="Contoh: Panduan Akademik 2026"
                  className="w-full rounded-md border-2 border-[#34a853] px-4 py-2.5 text-sm outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                  File PDF
                </label>

                <div className="flex overflow-hidden rounded-lg border border-[#34a853]">
                  <input
                    type="text"
                    value={formData.file?.name || ""}
                    readOnly
                    placeholder={
                      mode === "edit"
                        ? "Pilih file baru jika ingin mengganti PDF"
                        : "Belum ada file dipilih"
                    }
                    className="w-full bg-white px-4 py-3 text-sm outline-none"
                  />

                  <label className="flex cursor-pointer items-center justify-center whitespace-nowrap bg-[#00923F] px-5 py-3 text-sm font-medium text-white hover:bg-[#007a35]">
                    Pilih File
                    <input
                      type="file"
                      accept=".pdf"
                      hidden
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                {mode === "edit" && (
                  <p className="mt-2 text-xs text-gray-500">
                    Kosongkan jika tidak ingin mengganti file PDF.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-md bg-[#00923F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#007a35] disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {mode === "add" ? "Upload & Index" : "Simpan Perubahan"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="w-96 rounded-xl bg-white p-8 shadow-xl">
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={50} className="animate-spin text-[#00923F]" />

              <h3 className="text-lg font-bold text-[#00923F]">
                Memproses Dokumen
              </h3>

              <p className="text-center text-sm text-gray-600">
                Dokumen sedang diupload, dilakukan chunking, embedding, dan
                indexing ke database.
                <br />
                Mohon tunggu beberapa saat...
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
