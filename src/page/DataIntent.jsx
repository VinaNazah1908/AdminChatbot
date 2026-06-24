import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  getIntentEmbeddings,
  hapusIntentEmbedding,
  tambahIntentEmbedding,
  updateIntentEmbedding,
} from "../services/api";
import { Pagination } from "../components/Pagination";

const emptyForm = {
  intent: "",
  utterance: "",
};

let intentCache = null;

export default function DataIntent() {
  const [intents, setIntents] = useState(() => intentCache || []);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(!intentCache);
  const [isProcessing, setIsProcessing] = useState(false);

  const itemsPerPage = 10;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchIntents = async () => {
    try {
      const data = await getIntentEmbeddings();
      intentCache = data;
      setIntents(data);
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil data intent.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadIntents = async () => {
      try {
        if (!intentCache) {
          setIsLoading(true);
        }

        const data = await getIntentEmbeddings();
        if (!ignore) {
          intentCache = data;
          setIntents(data);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) {
          showToast("Gagal mengambil data intent.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadIntents();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredIntents = useMemo(() => {
    const keyword = search.toLowerCase();

    return intents.filter((item) => {
      return (
        item.intent?.toLowerCase().includes(keyword) ||
        item.utterance?.toLowerCase().includes(keyword)
      );
    });
  }, [intents, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIntents.length / itemsPerPage),
  );

  const paginatedIntents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredIntents.slice(start, start + itemsPerPage);
  }, [filteredIntents, currentPage]);

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
      intent: item.intent || "",
      utterance: item.utterance || "",
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const buildPayload = () => ({
    intent: formData.intent.trim(),
    utterance: formData.utterance.trim(),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = buildPayload();

    if (!payload.intent || !payload.utterance) {
      return alert("Intent dan contoh kalimat wajib diisi.");
    }

    closeModal();
    setIsProcessing(true);

    try {
      if (mode === "add") {
        await tambahIntentEmbedding(payload);
        showToast("Intent berhasil ditambahkan dan diindex.");
      } else {
        await updateIntentEmbedding(selectedId, payload);
        showToast("Intent berhasil diperbarui dan diindex ulang.");
      }

      await fetchIntents();
    } catch (error) {
      console.error(error);
      showToast(error.message || "Gagal menyimpan intent.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus intent ini?")) {
      return;
    }

    setIsProcessing(true);

    try {
      await hapusIntentEmbedding(id);
      await fetchIntents();
      showToast("Intent berhasil dihapus.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "Gagal menghapus intent.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
            Data Intent
          </h1>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-xs">
              <div className="flex items-center overflow-hidden rounded-md border border-gray-300">
                <input
                  type="text"
                  placeholder="Cari intent..."
                  value={search}
                  onChange={handleSearchChange}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 text-sm outline-none disabled:bg-gray-100"
                />
                <div className="px-3 text-[#00923F]">
                  <Search size={18} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-md border border-[#00923F] px-4 py-2 text-sm font-medium text-[#00923F] hover:bg-[#f3fbf6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Tambah Intent
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
                  Intent
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Contoh Kalimat
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center">
                  Status Index
                </th>
                <th className="border border-gray-300 px-3 py-2 text-left">
                  Update
                </th>
                <th className="border border-gray-300 px-3 py-2 text-center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading && paginatedIntents.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="border border-gray-300 px-3 py-8 text-center text-gray-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={18} className="animate-spin text-[#00923F]" />
                      Memuat data intent...
                    </div>
                  </td>
                </tr>
              ) : paginatedIntents.length > 0 ? (
                paginatedIntents.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-medium text-gray-800">
                      {item.intent}
                    </td>
                    <td className="max-w-md border border-gray-300 px-3 py-2">
                      <p className="line-clamp-2">{item.utterance}</p>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {item.indexed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          <CheckCircle size={14} />
                          Berhasil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          <AlertCircle size={14} />
                          Gagal
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-gray-600">
                      {formatDate(item.updated_at)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isProcessing}
                          className="rounded p-1 text-amber-600 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isProcessing}
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
                    className="border border-gray-300 px-3 py-6 text-center text-gray-500"
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
          totalItems={filteredIntents.length}
          visibleItems={paginatedIntents.length}
          onPageChange={setCurrentPage}
          disabled={isProcessing || isLoading}
        />
      </div>

      {isModalOpen && !isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-md bg-white shadow-xl">
            <div className="shrink-0 border-b border-gray-200 p-6">
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-4 top-4 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>

              <h2 className="text-center text-2xl font-bold text-[#00923F]">
                {mode === "add" ? "Tambah Intent" : "Edit Intent"}
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                    Nama Intent
                  </label>
                  <input
                    type="text"
                    name="intent"
                    value={formData.intent}
                    onChange={handleChange}
                    placeholder="Contoh: masalah_akademik_skripsi"
                    className="w-full rounded-md border-2 border-[#34a853] px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#00923F]">
                    Contoh Kalimat User
                  </label>
                  <textarea
                    name="utterance"
                    value={formData.utterance}
                    onChange={handleChange}
                    placeholder="Contoh: aku bingung mulai skripsi dari mana"
                    rows="4"
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
                    className="flex items-center gap-2 rounded-md bg-[#00923F] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#007a35]"
                  >
                    <Save size={18} />
                    Simpan & Index
                  </button>
                </div>
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
                Memproses Intent
              </h3>
              <p className="text-center text-sm text-gray-600">
                Intent sedang disimpan dan dibuat embedding ke vector database.
                Mohon tunggu beberapa saat.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
