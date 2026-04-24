"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { searchMusic, MusicTrack, Song } from "@/lib/music";
import SearchSection from "@/components/SearchSection";
import PlaylistSection from "../components/PlaylistSection";
import { Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const q = query(collection(db, "songs"), orderBy("createdAt", "asc"));
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
    } catch (err: any) {
      setDbError(err.message);
      setLoading(false);
    }
  }, []);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const addSong = async (track: MusicTrack) => {
    // Check for explicit content
    if (track.isExplicit) {
      showMessage("체육대회에서는 19금 노래를 추천할 수 없습니다! 🚫", "error");
      return;
    }

    // Check for duplicates
    const isDuplicate = songs.some((song) => song.trackId === track.trackId);
    if (isDuplicate) {
      showMessage("이미 추가된 노래입니다!", "error");
      return;
    }

    try {
      await addDoc(collection(db, "songs"), {
        ...track,
        createdAt: serverTimestamp(),
      });
      showMessage("노래가 추천되었습니다!", "success");
    } catch (error) {
      console.error("Error adding song:", error);
      showMessage("추천 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfdff] pb-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-14">
        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-bg rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl shadow-blue-100">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
              <Music size={18} />
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">2026 명서중학교 체육한마당</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  우리가 만드는<br />
                  <span className="text-yellow-200">플레이리스트 🎧</span>
                </h1>
                <p className="text-sm sm:text-base text-blue-50 font-medium leading-relaxed max-w-md opacity-90">
                  체육대회 중 듣고 싶은 노래를 자유롭게 추천해 주세요. <br />
                  여러분의 추천으로 모인 플레이리스트를 틀어드립니다!
                </p>
              </div>

              {/* Notice Box - Light Yellow 포인트 */}
              <div className="bg-yellow-100/95 backdrop-blur-sm rounded-2xl p-4 border border-yellow-200/50 space-y-1.5 shadow-sm">
                <p className="text-[10px] sm:text-xs font-black text-yellow-700 uppercase tracking-widest flex items-center gap-1.5">
                  ⚠️ 주의사항
                </p>
                <ul className="text-[11px] sm:text-sm font-bold text-yellow-800/90 space-y-0.5 list-disc list-inside leading-snug">
                  <li>일부 19세 이상 이용가 노래는 검색이 제한될 수 있습니다.</li>
                  <li>추천된 노래는 <span className="text-blue-600 font-black">방송부의 심의</span> 후 방송됩니다.</li>
                </ul>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between border-t border-white/10">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 border border-white/10"
              >
                <span>문의하기</span>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></div>
              </button>

              <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-60">
                명서중학교 방송부 MSB
              </div>
            </div>
          </div>
        </section>

        {/* Inquiry Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 w-full h-full bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-hidden"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-blue-50 space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-2 rotate-3 shadow-sm">
                      <Music size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">도움이 필요한가요? 📡</h3>
                    <p className="text-slate-500 text-sm font-medium">방송부 MSB가 친절하게 안내해 드릴게요.</p>
                  </div>

                  <div className="space-y-3">
                    <a
                      href="https://www.instagram.com/ms_broadcast"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-all border border-transparent hover:border-blue-200 group"
                    >
                      <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                        <Music size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Instagram</p>
                        <p className="text-sm font-bold text-slate-800">방송부 인스타그램 DM</p>
                      </div>
                    </a>

                    <a
                      href="https://www.instagram.com/iamkimhansol/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-2xl transition-all border border-transparent hover:border-yellow-200 group"
                    >
                      <div className="p-3 bg-white rounded-xl shadow-sm text-yellow-600 group-hover:scale-110 transition-transform">
                        <Music size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-wider">Manager</p>
                        <p className="text-sm font-bold text-slate-800">방송부장 3116 김한솔</p>
                      </div>
                    </a>
                  </div>

                  <div className="flex justify-center pt-2">
                    <a
                      href="/admin"
                      className="text-[10px] font-bold text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-widest"
                    >
                      관리자 모드
                    </a>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-4 bg-sky-600 text-white rounded-2xl font-bold text-sm hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200"
                  >
                    확인했어요
                  </button>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Search Section */}
        <section className="relative pt-2">
          <div className="mb-8 px-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
              노래 찾기 <span className="text-2xl">🔍</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium">플레이리스트에 추가할 곡을 검색하세요.</p>
          </div>
          <SearchSection onAddSong={addSong} />
        </section>

        {/* Playlist Section */}
        <section>
          <PlaylistSection songs={songs} loading={loading} />
          {dbError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-mono break-all">
              <strong>DB 에러 발생:</strong> {dbError}
            </div>
          )}
        </section>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-medium z-50 ${message.type === "success" ? "bg-green-500" : "bg-red-500"
              }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
