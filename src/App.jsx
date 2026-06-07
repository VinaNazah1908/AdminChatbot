import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./page/sidebar";
import { Navbar } from "./page/navbar";
import Dokumen from "./page/DokumenRag";
import Hotline from "./page/DataLayanan";
import RiwayatKonsultasi from "./page/RiwayatKonsultasi";
import HistoryChat from "./page/HistoryChat";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />

        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Dokumen />} />
            <Route path="/data_layanan" element={<Hotline />} />
            <Route path="/riwayat-konsultasi" element={<RiwayatKonsultasi />} />
            <Route path="/riwayat-konsultasi/:idLaporan" element={<HistoryChat />}/>
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;