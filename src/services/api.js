const BASE_URL = import.meta.env.VITE_API_URL;

// ====================
// DATA LAYANAN
// ====================

export const getDataLayanan = async () => {
  const res = await fetch(`${BASE_URL}/data-layanan`);
  return res.json();
};

export const tambahDataLayanan = async (data) => {
  const res = await fetch(`${BASE_URL}/data-layanan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const updateDataLayanan = async (id, data) => {
  const res = await fetch(`${BASE_URL}/data-layanan/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const hapusDataLayanan = async (id) => {
  await fetch(`${BASE_URL}/data-layanan/${id}`, {
    method: "DELETE",
  });
};

// ====================
// INTENT EMBEDDINGS
// ====================

export const getIntentEmbeddings = async () => {
  const res = await fetch(`${BASE_URL}/intent-embeddings`);
  if (!res.ok) throw new Error("Gagal mengambil data intent");
  return res.json();
};

export const tambahIntentEmbedding = async (data) => {
  const res = await fetch(`${BASE_URL}/intent-embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok || result.success === false) {
    throw new Error(result.message || "Gagal menyimpan intent");
  }

  return result;
};

export const updateIntentEmbedding = async (id, data) => {
  const res = await fetch(`${BASE_URL}/intent-embeddings/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok || result.success === false) {
    throw new Error(result.message || "Gagal memperbarui intent");
  }

  return result;
};

export const hapusIntentEmbedding = async (id) => {
  const res = await fetch(`${BASE_URL}/intent-embeddings/${id}`, {
    method: "DELETE",
  });

  const result = await res.json();
  if (!res.ok || result.success === false) {
    throw new Error(result.message || "Gagal menghapus intent");
  }

  return result;
};

// ====================
// DOKUMEN RAG
// ====================

export const getDokumen = async () => {
  const res = await fetch(`${BASE_URL}/dokumen-rag`);
  return res.json();
};

export const uploadDokumen = async (formData) => {
  const res = await fetch(`${BASE_URL}/dokumen-rag`, {
    method: "POST",
    body: formData,
  });

  const result = await res.json();
  if (!res.ok || result.success === false) {
    throw new Error(result.message || "Gagal upload dokumen");
  }

  return result;
};

export const hapusDokumen = async (id) => {
  await fetch(`${BASE_URL}/dokumen-rag/${id}`, {
    method: "DELETE",
  });
};

export const lihatDokumen = (id) => {
  window.open(`${BASE_URL}/dokumen-rag/${id}/file`, "_blank");
};

export const updateDokumen = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/dokumen-rag/${id}`, {
    method: "PUT",
    body: formData,
  });

  const result = await res.json();
  if (!res.ok || result.success === false) {
    throw new Error(result.message || "Gagal update dokumen");
  }

  return result;
};

export const rebuildDokumenRag = async () => {
  const res = await fetch(`${BASE_URL}/rebuild-dokumen-rag`, {
    method: "POST",
  });

  return res.json();
};

export const rebuildDataLayanan = async () => {
  const res = await fetch(`${BASE_URL}/rebuild-data-layanan`, {
    method: "POST",
  });

  return res.json();
};

export const getLaporans = async () => {
  const response = await fetch(`${BASE_URL}/laporans`);
  if (!response.ok) throw new Error("Gagal mengambil data laporan");
  return response.json();
};

export const getMessagesByLaporan = async (idLaporan) => {
  const response = await fetch(`${BASE_URL}/laporans/${idLaporan}/messages`);
  if (!response.ok) throw new Error("Gagal mengambil history chat");
  return response.json();
};

export const hapusLaporan = async (idLaporan) => {
  const response = await fetch(`${BASE_URL}/laporans/${idLaporan}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Gagal menghapus laporan");

  return response.json();
};

export const hapusSemuaLaporan = async () => {
  const response = await fetch(`${BASE_URL}/laporans`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Gagal menghapus semua laporan");

  return response.json();
};
