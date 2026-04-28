"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { searchMusic, MusicTrack, Song } from "@/lib/music";
import SearchSection from "@/components/SearchSection";
import PlaylistSection from "../components/PlaylistSection";
import { Music, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AppSettings {
  startTime: any;
  endTime: any;
}

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [timeErrorModal, setTimeErrorModal] = useState<string | null>(null);

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

  // Fetch settings separately
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "recommendation"), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as AppSettings);
      }
    });
    return () => unsubSettings();
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

  const handleStart = () => {
    if (!settings) {
      setHasStarted(true);
      return;
    }

    const now = new Date();
    const start = settings.startTime?.toDate();
    const end = settings.endTime?.toDate();

    if (start && now < start) {
      const timeStr = start.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      setTimeErrorModal(`아직 추천 기간이 아닙니다!\n추천 시작: ${timeStr}`);
      return;
    }

    if (end && now > end) {
      setTimeErrorModal("노래 추천 기간이 종료되었습니다.\n참여해주셔서 감사합니다!");
      return;
    }

    setHasStarted(true);
  };

  return (
    <main className="min-h-screen bg-[#fcfdff]">
      {/* Top Navigation Bar - Only show when started */}
      {hasStarted && (
        <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-[100] h-16 shadow-sm">
          <div className="max-w-2xl mx-auto h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Music size={20} strokeWidth={2.5} />
              </div>
              <span className="font-black text-slate-800 tracking-tight text-lg">MSB PLAY</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors px-3 py-2"
              >
                문의하기
              </button>
              <button
                onClick={() => setHasStarted(false)}
                className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                처음으로
              </button>
            </div>
          </div>
        </nav>
      )}

      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="min-h-screen flex items-center justify-center px-4 max-w-2xl mx-auto py-10"
          >
            {/* Hero / Landing Section */}
            <section className="relative overflow-hidden gradient-bg rounded-[2.5rem] p-10 sm:p-14 text-white shadow-2xl shadow-blue-100 w-full">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

              <div className="relative z-10 space-y-8">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  <Music size={18} />
                  <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">2026 명서중학교 체육한마당</span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                    우리가 만드는<br />
                    <span className="text-yellow-200">플레이리스트 🎧</span>
                  </h1>
                  <p className="text-base sm:text-lg text-blue-50 font-medium leading-relaxed max-w-md opacity-90">
                    체육대회 중 듣고 싶은 노래를<br />자유롭게 추천해 주세요.
                  </p>
                </div>

                <div className="bg-yellow-100/95 backdrop-blur-sm rounded-3xl p-6 border border-yellow-200/50 space-y-2.5 shadow-sm text-yellow-900">
                  <ul className="text-sm sm:text-base font-bold space-y-2 list-none leading-snug">
                    <li className="flex gap-2">✨ <span>체육대회를 더욱더 신나게 할 노래를 추천해 주세요!</span></li>
                    <li className="flex gap-2 text-red-600">🚫 <span>19금 노래는 추천하실 수 없습니다.</span></li>
                    <li className="flex gap-2">📻 <span>모든 노래는 방송부의 심의를 거쳐 방송됩니다.</span></li>
                    <li className="flex gap-2">🔏 <span>노래 추천은 익명이며, 추천 횟수에 제한은 없습니다.</span></li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={handleStart}
                    className="w-full py-5 bg-white text-blue-600 rounded-[1.5rem] font-black text-xl shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    노래 추천 하러가기
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                  </button>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 border border-white/10"
                  >
                    방송부에 문의하기
                  </button>
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pt-24 pb-32 px-4 max-w-2xl mx-auto space-y-12"
          >
            {/* Search Section */}
            <section className="space-y-6">
              <div className="px-1">
                <h2 className="text-2xl font-black text-slate-800 mb-2">노래 찾기 🔍</h2>
                <p className="text-sm text-slate-500 font-medium font-sans">플레이리스트에 추가할 곡을 검색해 보세요.</p>
              </div>
              <SearchSection onAddSong={addSong} />
            </section>

            {/* Playlist Section */}
            <section>
              <PlaylistSection songs={songs} loading={loading} />
              {dbError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-mono break-all">
                  <strong>DB 에러:</strong> {dbError}
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>

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
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  확인했어요
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Time Error Modal */}
      <AnimatePresence>
        {timeErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTimeErrorModal(null)}
            className="fixed inset-0 w-full h-full bg-slate-900/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border-4 border-yellow-400 space-y-6 text-center"
            >
              <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Clock size={40} strokeWidth={2.5} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">앗, 잠시만요! 🚧</h3>
                <div className="text-slate-600 font-bold whitespace-pre-line leading-relaxed">
                  {timeErrorModal}
                </div>
              </div>

              <button
                onClick={() => setTimeErrorModal(null)}
                className="w-full py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-100 active:scale-95"
              >
                확인했습니다
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-black text-sm z-[200] ${message.type === "success" ? "bg-blue-600" : "bg-red-500"
              }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
