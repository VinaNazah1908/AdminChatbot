import { Menu } from "lucide-react";

export function Navbar({ onMenuClick }) {
  return (
    <header className="flex h-18 w-full items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
          type="button"
        >
          <Menu size={22} />
        </button>
      </div>

      <span className="text-sm text-gray-600">Hello, User</span>
    </header>
  );
}