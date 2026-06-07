import { useEffect, useState } from "react";
import { ArrowLeft, User, Bot } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getMessagesByLaporan } from "../services/api";

export default function HistoryChat() {
  const { idLaporan } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [laporan, setLaporan] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const fetchMessages = async () => {
    try {
      const data = await getMessagesByLaporan(idLaporan);

      setLaporan(data.laporan || null);
      setMessages(data.messages || []);
    } catch (error) {
      console.error(error);
      showToast("Gagal mengambil history chat.");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [idLaporan]);

  return (
    <main className="relative p-3">
      {toast && (
        <div className="fixed right-6 top-6 z-10000 rounded-md bg-#00923F px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#00923F]">History Chat</h1>
            <p className="mt-1 text-sm text-gray-500">
              ID Laporan: {idLaporan}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/riwayat-konsultasi")}
            className="flex items-center gap-2 rounded-md border border-[#00923F] px-4 py-2 text-sm font-medium text-[#00923F] hover:bg-[#f3fbf6]"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>

        {laporan && (
          <div className="mb-6 rounded-md border border-gray-300 bg-[#f9fffb] p-4 text-sm">
            <h2 className="mb-3 font-bold text-[#00923F]">Data User</h2>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-gray-500">Nama Pelapor</p>
                <p className="font-medium">
                  {laporan.nama_pelapor || "Anonim"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Nomor WhatsApp</p>
                <p className="font-medium">{laporan.nomor_pelapor}</p>
              </div>

              <div>
                <p className="text-gray-500">Bersedia Dihubungi</p>
                <p className="font-medium">
                  {laporan.bersedia_dihubungi ? "Ya" : "Tidak"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Tanggal</p>
                <p className="font-medium">
                  {laporan.created_at
                    ? new Date(laporan.created_at).toLocaleString("id-ID")
                    : "-"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-500">Isi Laporan Awal</p>
              <p className="font-medium">{laporan.isi_laporan}</p>
            </div>
          </div>
        )}

        <div className="rounded-md border border-gray-300 bg-gray-50 p-4">
          {messages.length > 0 ? (
            <div className="flex flex-col gap-4">
              {messages.map((message) => {
                const isUser = message.sender !== "agent";

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isUser
                          ? "rounded-br-sm bg-[#d8ecff] text-[#17324d]"
                          : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs font-bold opacity-75">
                        {isUser ? <User size={14} /> : <Bot size={14} />}
                        {isUser ? "User" : "Chatbot"}
                      </div>

                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>

                      <div className="mt-2 text-right text-[11px] text-gray-500">
                        {message.timestamp
                          ? new Date(message.timestamp).toLocaleString("id-ID")
                          : ""}
                      </div>

                      {message.intent && (
                        <div className="mt-2 inline-block rounded-full bg-green-50 px-2 py-1 text-[11px] text-[#00923F]">
                          {message.intent}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">
              History chat belum tersedia.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}