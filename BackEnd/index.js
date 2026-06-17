import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import pkg from "pg";

dotenv.config();
console.log(process.env.DATABASE_URL);

const { Pool } = pkg;
const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// Helper untuk proses ke Python vector service
async function processDocumentToVector(doc_id, judul, file_buffer) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch("http://localhost:8000/add-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: parseInt(doc_id),
          judul: judul,
          file_base64: file_buffer.toString("base64"),
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Vector berhasil untuk dokumen ${doc_id}`);
        return result;
      } else {
        console.warn(`⚠️ Vector gagal: ${result.message}`);
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempts + 1} gagal:`, error.message);
    }

    attempts++;
    if (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 800)); // tunggu sebentar
    }
  }

  return {
    success: false,
    message: "Vector processing gagal setelah beberapa percobaan",
  };
}

// CEK BACKEND
app.get("/", (req, res) => {
  res.json({ message: "Backend admin persona jalan" });
});

// =======================
// DATA LAYANAN
// =======================

app.get("/data-layanan", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM data_layanan ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    console.error("GET /data-layanan error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data layanan",
      error: error.message,
    });
  }
});

app.post("/data-layanan", async (req, res) => {
  const { nama_layanan, deskripsi, nama_kontak, nomor_wa, jam } = req.body;

  try {
    // 1. Simpan data ke database
    const result = await db.query(
      `
      INSERT INTO data_layanan
      (nama_layanan, deskripsi, nama_kontak, nomor_wa, jam)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [nama_layanan, deskripsi, nama_kontak, nomor_wa, jam],
    );

    const layananBaru = result.rows[0];

    await fetch("http://localhost:8000/sync-data-layanan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(layananBaru),
    });

    res.json(layananBaru);
  } catch (error) {
    console.error("POST /data-layanan error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal menambah data layanan",
      error: error.message,
    });
  }
});

app.put("/data-layanan/:id", async (req, res) => {
  const { id } = req.params;
  const { nama_layanan, deskripsi, nama_kontak, nomor_wa, jam } = req.body;

  try {
    // 1. Update data layanan
    const result = await db.query(
      `
      UPDATE data_layanan
      SET
        nama_layanan = $1,
        deskripsi = $2,
        nama_kontak = $3,
        nomor_wa = $4,
        jam = $5
      WHERE id = $6
      RETURNING *
      `,
      [nama_layanan, deskripsi, nama_kontak, nomor_wa, jam, id],
    );

    const layanan = result.rows[0];

    // 2. Generate embedding ulang
    await fetch("http://localhost:8000/sync-data-layanan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(layanan),
    });

    res.json(layanan);
  } catch (error) {
    console.error("PUT /data-layanan/:id error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengubah data layanan",
      error: error.message,
    });
  }
});

app.delete("/data-layanan/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM data_layanan WHERE id=$1", [req.params.id]);

    res.json({
      success: true,
      message: "Data layanan berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE /data-layanan/:id error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus data layanan",
      error: error.message,
    });
  }
});

// =======================
// DOKUMEN RAG (FULL INCREMENTAL)
// =======================

// GET semua dokumen
app.get("/dokumen-rag", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, judul, 
             (SELECT COUNT(*) FROM document_chunks WHERE doc_id = dokumen_rag.id) as chunk_count
      FROM dokumen_rag 
      ORDER BY id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal mengambil data" });
  }
});

// UPLOAD BARU
app.post("/dokumen-rag", upload.single("file"), async (req, res) => {
  const { judul } = req.body;
  const file = req.file?.buffer;

  if (!judul || !file) {
    return res.status(400).json({
      success: false,
      message: "Judul dan file wajib diisi",
    });
  }

  try {
    // 1. Simpan dokumen dulu
    const result = await db.query(
      "INSERT INTO dokumen_rag (judul, file) VALUES ($1, $2) RETURNING id, judul",
      [judul, file],
    );

    const newDoc = result.rows[0];

    // 2. Proses vector setelah INSERT berhasil
    await processDocumentToVector(newDoc.id, newDoc.judul, file);

    res.json({
      success: true,
      message: "Dokumen berhasil diupload dan diindex",
      data: newDoc,
    });
  } catch (error) {
    console.error("POST /dokumen-rag error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal upload dokumen",
      error: error.message,
    });
  }
});
// LIHAT FILE PDF
app.get("/dokumen-rag/:id/file", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "SELECT file FROM dokumen_rag WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Dokumen tidak ditemukan");
    }

    const pdfBuffer = result.rows[0].file;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="dokumen_${id}.pdf"`,
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Gagal membuka dokumen");
  }
});
// EDIT (Update Judul + Re-index)
// EDIT DOKUMEN
app.put("/dokumen-rag/:id", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  const { judul } = req.body;
  const file = req.file?.buffer;

  try {
    // cek dokumen lama
    const oldDoc = await db.query("SELECT * FROM dokumen_rag WHERE id=$1", [
      id,
    ]);

    if (oldDoc.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dokumen tidak ditemukan",
      });
    }

    // =========================
    // JIKA GANTI FILE PDF
    // =========================
    if (file) {
      const result = await db.query(
        `
        UPDATE dokumen_rag
        SET judul=$1, file=$2
        WHERE id=$3
        RETURNING *
        `,
        [judul, file, id],
      );

      const doc = result.rows[0];

      // re-index hanya jika file berubah
      await processDocumentToVector(doc.id, doc.judul, file);

      return res.json({
        success: true,
        message: "Dokumen berhasil diupdate dan diindex ulang",
        data: doc,
      });
    }

    // =========================
    // JIKA HANYA GANTI JUDUL
    // =========================
    const result = await db.query(
      `
      UPDATE dokumen_rag
      SET judul=$1
      WHERE id=$2
      RETURNING *
      `,
      [judul, id],
    );

    res.json({
      success: true,
      message: "Judul berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Gagal update dokumen",
      error: error.message,
    });
  }
});
// DELETE
app.delete("/dokumen-rag/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM dokumen_rag WHERE id=$1", [req.params.id]);
    // Karena ada ON DELETE CASCADE, chunks otomatis terhapus

    res.json({
      success: true,
      message: "Dokumen beserta vector-nya berhasil dihapus",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Gagal menghapus dokumen" });
  }
});

// =======================
// REBUILD DATA LAYANAN
// =======================

app.post("/rebuild-data-layanan", async (req, res) => {
  try {
    const response = await fetch("http://localhost:8000/rebuild-data-layanan", {
      method: "POST",
    });

    const result = await response.json();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("POST /rebuild-data-layanan error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghubungi Python service",
      error: error.message,
    });
  }
});

// =======================
// RIWAYAT KONSULTASI
// =======================

app.get("/laporans", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM laporans
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET /laporans error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data laporan",
      error: error.message,
    });
  }
});

app.get("/laporans/:id/messages", async (req, res) => {
  const { id } = req.params;

  try {
    const laporanResult = await db.query(
      "SELECT * FROM laporans WHERE id = $1",
      [id],
    );

    const messagesResult = await db.query(
      `
      SELECT *
      FROM messages_history
      WHERE id_laporan = $1
      ORDER BY timestamp ASC
      `,
      [id],
    );

    res.json({
      laporan: laporanResult.rows[0] || null,
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error("GET /laporans/:id/messages error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil history chat",
      error: error.message,
    });
  }
});

app.delete("/laporans/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM laporans WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Laporan berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE /laporans/:id error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus laporan",
      error: error.message,
    });
  }
});

app.delete("/laporans", async (req, res) => {
  try {
    await db.query("DELETE FROM laporans");

    res.json({
      success: true,
      message: "Semua laporan berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE /laporans error:", error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus semua laporan",
      error: error.message,
    });
  }
});

// =======================
// RUN SERVER
// =======================

app.listen(process.env.PORT || 5000, () => {
  console.log(`Backend jalan di http://localhost:${process.env.PORT || 5000}`);
});
