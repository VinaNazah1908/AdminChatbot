import { FileText, Info, MessageSquare, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "../assets/logo_secondary.png";

export function Sidebar({ isOpen }) {
  const menuItems = [
    { icon: FileText, label: "Dokumen RAG", path: "/" },
    { icon: Info, label: "Data Layanan", path: "/data_layanan" },
    { icon: MessageSquare, label: "Data Intent", path: "/data-intent" },
    { icon: Users, label: "Riwayat Konsultasi", path: "/riwayat-konsultasi" },
  ];

  return (
    <aside
      className={`h-screen w-64 shrink-0 border-r border-gray-200 bg-white p-4 ${
        isOpen ? "block" : "hidden"
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />

        <div className="leading-tight text-[#1fa34a]">
          <h1 className="text-[16px] font-bold">Kemahasiswaan</h1>
          <p className="text-[10px] font-semibold md:text-[13px]">
            Universitas Bina Insani
          </p>
        </div>
      </div>

      <div className="mb-4 border-t border-gray-200" />

      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => {
          const IconComponent = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 ${
                  isActive
                    ? "bg-[#e6f4ec] font-semibold text-[#1fa34a]"
                    : "text-[#1fa34a] hover:bg-[#f5faf6]"
                }`
              }
            >
              <IconComponent size={18} />
              <span className="text-[14px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
