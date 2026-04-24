"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Song } from "@/lib/music";
import { Trash2, ShieldCheck, LogOut, Loader2, Copy, FileDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!isAuthorized) return;

    const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const songsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Song[];
        setSongs(songsData);
        setLoading(false);
        setDbError(null);
      },
      (error) => {
        console.error("Firestore error:", error);
        setDbError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1234") { // 기본 비밀번호
      setIsAuthorized(true);
      setError("");
    } else {
      setError("비밀번호가 올바르지 않습니다.");
    }
  };

  const deleteSong = async (id: string) => {
    if (!confirm("이 노래를 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "songs", id));
    } catch (error) {
      console.error("Error deleting song:", error);
    }
  };

  const clearPlaylist = async () => {
    if (!confirm("정말로 모든 노래를 삭제하고 초기화하시겠습니까?")) return;
    try {
      const querySnapshot = await getDocs(collection(db, "songs"));
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, "songs", document.id));
      });
      await batch.commit();
    } catch (error) {
      console.error("Error clearing playlist:", error);
    }
  };

  const copyToClipboard = () => {
    const text = songs.map(song => `${song.title} - ${song.artist}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const exportToCSV = () => {
    const headers = ["Title", "Artist", "Album"];
    const rows = songs.map(song => [
      `"${song.title.replace(/"/g, '""')}"`,
      `"${song.artist.replace(/"/g, '""')}"`,
      `"${song.album.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `playlist_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-200"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl mb-4">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">관리자 로그인</h1>
            <p className="text-slate-500 text-center mt-1">관리자 비밀번호를 입력해 주세요.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full px-5 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              로그인
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-slate-800">관리자 모드</h1>
          </div>
          <button
            onClick={() => setIsAuthorized(false)}
            className="flex items-center gap-2 text-slate-500 hover:text-red-600 font-medium transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">추천 목록 관리</h2>
            <p className="text-slate-500">현재 총 {songs.length}곡이 추천되었습니다.</p>
          </div>
          <button
            onClick={clearPlaylist}
            disabled={songs.length === 0}
            className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-semibold hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-red-50 disabled:hover:text-red-600"
          >
            플레이리스트 초기화
          </button>
        </div>

        {/* Export Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={copyToClipboard}
            disabled={songs.length === 0}
            className="flex items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all group disabled:opacity-50"
          >
            {copySuccess ? (
              <>
                <Check className="text-green-500" size={20} />
                <span className="font-semibold text-green-500">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="text-slate-400 group-hover:text-blue-500" size={20} />
                <span className="font-semibold">전체 곡 정보 복사</span>
              </>
            )}
          </button>
          <button
            onClick={exportToCSV}
            disabled={songs.length === 0}
            className="flex items-center justify-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-green-400 hover:text-green-600 transition-all group disabled:opacity-50"
          >
            <FileDown className="text-slate-400 group-hover:text-green-500" size={20} />
            <span className="font-semibold">CSV 파일로 다운로드</span>
          </button>
        </div>

        {dbError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-mono break-all">
            <strong>DB 에러 발생:</strong> {dbError}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-slate-300" size={40} />
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {songs.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                추천된 노래가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <AnimatePresence>
                  {songs.map((song) => (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-slate-100">
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 line-clamp-1">{song.title}</h3>
                        <p className="text-sm text-slate-500 truncate">{song.artist}</p>
                      </div>
                      <button
                        onClick={() => deleteSong(song.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
