import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

dotenv.config();
console.log(process.env.DATABASE_URL);

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runPythonSync(action, payload) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || "python";
    const scriptPath =
      process.env.VECTOR_SYNC_SCRIPT ||
      path.resolve(__dirname, "..", "..", "Chatbot-Testing", "vector_sync.py");
    const child = spawn(pythonPath, [scriptPath, action, JSON.stringify(payload || {})], {
      cwd: process.cwd(),
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || "Python sync gagal"));
        return;
      }

      try {
        const jsonLine = stdout
          .trim()
          .split(/\r?\n/)
          .reverse()
          .find((line) => line.trim().startsWith("{"));

        if (!jsonLine) {
          reject(new Error(stdout.trim() || "Output Python kosong"));
          return;
        }

        const result = JSON.parse(jsonLine);
        resolve(result);
      } catch (error) {
        reject(new Error(`Gagal parsing output Python: ${error.message}`));
      }
    });
  });
}

// Helper untuk proses ke Python vector service
async function processDocumentToVector(doc_id, judul, file_buffer) {
  try {
    const result = await runPythonSync("add-document", {
      doc_id: parseInt(doc_id),
      judul,
      file_base64: file_buffer.toString("base64"),
    });

    if (result.success) {
      console.log(`✅ Vector berhasil untuk dokumen ${doc_id}`);
      return result;
    }

    console.warn(`⚠️ Vector gagal: ${result.message}`);
    throw new Error(result.message || "Vector processing gagal");
  } catch (error) {
    console.error(`❌ Vector processing gagal:`, error.message);
    throw error;
  }
}

async function syncIntentToVector(intent, utterance) {
  const result = await runPythonSync("sync-intent", { intent, utterance });

  if (!result.success) {
    throw new Error(result.message || "Gagal sinkron intent ke vector service");
  }

  return result;
}

async function updateIntentVector(id, intent, utterance) {
  const result = await runPythonSync("update-intent", { id, intent, utterance });

  if (!result.success) {
    throw new Error(result.message || "Gagal update intent ke vector service");
  }

  return result;
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

    await runPythonSync("sync-data-layanan", layananBaru);

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
    await runPythonSync("sync-data-layanan", layanan);

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
// INTENT EMBEDDINGS
// =======================

app.get("/intent-embeddings", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id,
        intent,
        utterance,
        updated_at,
        embedding IS NOT NULL AS indexed
      FROM intent_embeddings
      ORDER BY updated_at DESC, id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET /intent-embeddings error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data intent",
      error: error.message,
    });
  }
});

app.post("/intent-embeddings", async (req, res) => {
  const { intent, utterance } = req.body;

  if (!intent || !utterance) {
    return res.status(400).json({
      success: false,
      message: "Intent dan utterance wajib diisi",
    });
  }

  try {
    const syncResult = await syncIntentToVector(intent, utterance);
    const result = await db.query(
      `
      SELECT
        id,
        intent,
        utterance,
        updated_at,
        embedding IS NOT NULL AS indexed
      FROM intent_embeddings
      WHERE id = $1
      `,
      [syncResult.id],
    );

    res.json({
      success: true,
      message: "Intent berhasil disimpan dan diindex",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("POST /intent-embeddings error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal menyimpan intent",
      error: error.message,
    });
  }
});

app.put("/intent-embeddings/:id", async (req, res) => {
  const { id } = req.params;
  const { intent, utterance } = req.body;

  if (!intent || !utterance) {
    return res.status(400).json({
      success: false,
      message: "Intent dan utterance wajib diisi",
    });
  }

  try {
    const oldResult = await db.query(
      "SELECT id, intent, utterance FROM intent_embeddings WHERE id = $1",
      [id],
    );

    if (oldResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Intent tidak ditemukan",
      });
    }

    const syncResult = await updateIntentVector(id, intent, utterance);

    const result = await db.query(
      `
      SELECT
        id,
        intent,
        utterance,
        updated_at,
        embedding IS NOT NULL AS indexed
      FROM intent_embeddings
      WHERE id = $1
      `,
      [syncResult.id],
    );

    res.json({
      success: true,
      message: "Intent berhasil diperbarui dan diindex ulang",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PUT /intent-embeddings/:id error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal memperbarui intent",
      error: error.message,
    });
  }
});

app.delete("/intent-embeddings/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM intent_embeddings WHERE id = $1", [
      req.params.id,
    ]);

    res.json({
      success: true,
      message: "Intent berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE /intent-embeddings/:id error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus intent",
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
  let newDoc = null;

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

    newDoc = result.rows[0];

    // 2. Proses vector setelah INSERT berhasil
    const vectorResult = await processDocumentToVector(newDoc.id, newDoc.judul, file);

    res.json({
      success: true,
      message: "Dokumen berhasil diupload dan diindex",
      data: newDoc,
      chunk_count: vectorResult.chunk_count,
    });
  } catch (error) {
    if (newDoc?.id) {
      try {
        await db.query("DELETE FROM dokumen_rag WHERE id = $1", [newDoc.id]);
      } catch (cleanupError) {
        console.error("Cleanup dokumen gagal:", cleanupError);
      }
    }

    console.error("POST /dokumen-rag error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal upload dokumen",
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
      const vectorResult = await processDocumentToVector(doc.id, doc.judul, file);

      return res.json({
        success: true,
        message: "Dokumen berhasil diupdate dan diindex ulang",
        data: doc,
        chunk_count: vectorResult.chunk_count,
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
      message: error.message || "Gagal update dokumen",
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

app.post("/rebuild-dokumen-rag", async (req, res) => {
  try {
    const result = await runPythonSync("rebuild-dokumen-rag", {});

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("POST /rebuild-dokumen-rag error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal rebuild dokumen RAG",
      error: error.message,
    });
  }
});

app.post("/rebuild-data-layanan", async (req, res) => {
  try {
    const result = await runPythonSync("rebuild-data-layanan", {});

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
