"use client";
import { useAuthStore } from "../lib/authStore";

const AuthButton = () => {
  const { user, signInWithGoogle, signOut, loading } = useAuthStore();

  if (loading) return null;

  if (user) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-500 truncate max-w-[140px]">{user.email}</span>
        <button
          onClick={signOut}
          className="w-40 ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-gray-600 to-gray-400 text-gray-500 hover:text-white focus:outline-none focus:ring-0"
        >
          <span className="w-full relative px-6 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
            Sign Out
          </span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="w-40 ml-4 mr-4 relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-bold text-heading group bg-gradient-to-br from-blue-500 to-green-400 text-blue-500 hover:text-white focus:outline-none focus:ring-0"
    >
      <span className="w-full relative px-4 py-3 transition-all ease-in duration-350 bg-gray-100 group-hover:bg-transparent">
        Sign in with Google
      </span>
    </button>
  );
};

export default AuthButton;