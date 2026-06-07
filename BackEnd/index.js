import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
    const result = await db.query(
      `INSERT INTO data_layanan
      (nama_layanan, deskripsi, nama_kontak, nomor_wa, jam)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [nama_layanan, deskripsi, nama_kontak, nomor_wa, jam]
    );

    res.json(result.rows[0]);
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
    const result = await db.query(
      `UPDATE data_layanan
       SET nama_layanan=$1, deskripsi=$2, nama_kontak=$3, nomor_wa=$4, jam=$5
       WHERE id=$6
       RETURNING *`,
      [nama_layanan, deskripsi, nama_kontak, nomor_wa, jam, id]
    );

    res.json(result.rows[0]);
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
// DOKUMEN RAG
// =======================

app.get("/dokumen-rag", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, judul FROM dokumen_rag ORDER BY id ASC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET /dokumen-rag error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil dokumen RAG",
      error: error.message,
    });
  }
});

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
    const result = await db.query(
      "INSERT INTO dokumen_rag (judul, file) VALUES ($1, $2) RETURNING id, judul",
      [judul, file]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("POST /dokumen-rag error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal upload dokumen RAG",
      error: error.message,
    });
  }
});

app.get("/dokumen-rag/:id/file", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT judul, file FROM dokumen_rag WHERE id=$1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Dokumen tidak ditemukan",
      });
    }

    const dokumen = result.rows[0];

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${dokumen.judul}.pdf"`
    );

    res.send(dokumen.file);
  } catch (error) {
    console.error("GET /dokumen-rag/:id/file error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuka file dokumen",
      error: error.message,
    });
  }
});

app.put("/dokumen-rag/:id", async (req, res) => {
  const { judul } = req.body;

  if (!judul) {
    return res.status(400).json({
      success: false,
      message: "Judul wajib diisi",
    });
  }

  try {
    const result = await db.query(
      "UPDATE dokumen_rag SET judul=$1 WHERE id=$2 RETURNING id, judul",
      [judul, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("PUT /dokumen-rag/:id error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengubah dokumen",
      error: error.message,
    });
  }
});

app.delete("/dokumen-rag/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM dokumen_rag WHERE id=$1", [req.params.id]);

    res.json({
      success: true,
      message: "Dokumen berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE /dokumen-rag/:id error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus dokumen",
      error: error.message,
    });
  }
});

// =======================
// REBUILD DOKUMEN RAG
// =======================

app.post("/rebuild-dokumen-rag", async (req, res) => {
  try {
    const response = await fetch("http://localhost:8000/rebuild-dokumen-rag", {
      method: "POST",
    });

    const result = await response.json();

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("POST /rebuild-dokumen-rag error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghubungi Python service",
      error: error.message,
    });
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
      [id]
    );

    const messagesResult = await db.query(
      `
      SELECT *
      FROM messages_history
      WHERE id_laporan = $1
      ORDER BY timestamp ASC
      `,
      [id]
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