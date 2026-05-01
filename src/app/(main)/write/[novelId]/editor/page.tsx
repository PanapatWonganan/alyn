"use client";

import Button from "@/components/ui/Button";
import RichTextEditor from "@/components/editor/RichTextEditor";
import {
  Save,
  ChevronLeft,
  Coins,
  Lock,
  Unlock,
  Loader2,
  Plus,
  FileText,
  Upload,
  Check,
  PenTool,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface Chapter {
  id: string;
  number: number;
  title: string;
  content?: string;
  wordCount: number;
  coinPrice: number;
  isFree: boolean;
  publishedAt: string | null;
  createdAt: string;
}

interface Novel {
  id: string;
  title: string;
  authorId: string;
}

export default function EditorPage({
  params,
}: {
  params: Promise<{ novelId: string }>;
}) {
  const { novelId } = use(params);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapterIdFromQuery = searchParams.get("chapter");

  // State
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    chapterIdFromQuery
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [coinPrice, setCoinPrice] = useState(5);

  // Loading states
  const [loadingNovel, setLoadingNovel] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(true);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch novel info
  useEffect(() => {
    const fetchNovel = async () => {
      try {
        const response = await fetch(`/api/novels/${novelId}`);
        if (!response.ok) throw new Error("Failed to fetch novel");
        const data = await response.json();
        setNovel(data.novel);
      } catch (error) {
        console.error("Error fetching novel:", error);
      } finally {
        setLoadingNovel(false);
      }
    };

    fetchNovel();
  }, [novelId]);

  // Fetch chapters list
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch(`/api/novels/${novelId}/chapters`);
        if (!response.ok) throw new Error("Failed to fetch chapters");
        const data = await response.json();
        setChapters(data.chapters || []);
      } catch (error) {
        console.error("Error fetching chapters:", error);
      } finally {
        setLoadingChapters(false);
      }
    };

    fetchChapters();
  }, [novelId]);

  // Load selected chapter
  useEffect(() => {
    if (!selectedChapterId) return;

    const fetchChapter = async () => {
      setLoadingChapter(true);
      try {
        const response = await fetch(
          `/api/novels/${novelId}/chapters/${selectedChapterId}`
        );
        if (!response.ok) throw new Error("Failed to fetch chapter");
        const data = await response.json();
        const chapter = data.chapter;

        setTitle(chapter.title);
        setContent(chapter.content || "");
        setIsFree(chapter.isFree);
        setCoinPrice(chapter.coinPrice || 5);
      } catch (error) {
        console.error("Error fetching chapter:", error);
      } finally {
        setLoadingChapter(false);
      }
    };

    fetchChapter();
  }, [selectedChapterId, novelId]);

  // Handle content change from RichTextEditor
  const handleContentChange = (html: string, text: string) => {
    setContent(html);
    setTextContent(text);
  };

  // Create new chapter
  const handleNewChapter = () => {
    setSelectedChapterId(null);
    setTitle("");
    setContent("");
    setTextContent("");
    setIsFree(true);
    setCoinPrice(5);
  };

  // Save chapter (create or update)
  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      alert("กรุณากรอกชื่อตอน");
      return;
    }
    if (!content.trim()) {
      alert("กรุณากรอกเนื้อหา");
      return;
    }

    if (publish) {
      setSaving(false);
      setPublishing(true);
    } else {
      setSaving(true);
      setPublishing(false);
    }

    try {
      const body = {
        title,
        content,
        coinPrice: isFree ? 0 : coinPrice,
        isFree,
        publish,
      };

      let response;
      if (selectedChapterId) {
        // Update existing chapter
        response = await fetch(
          `/api/novels/${novelId}/chapters/${selectedChapterId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
      } else {
        // Create new chapter
        response = await fetch(`/api/novels/${novelId}/chapters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "เกิดข้อผิดพลาด");
      }

      const data = await response.json();
      const savedChapter = data.chapter;

      // Update chapters list
      const updatedResponse = await fetch(`/api/novels/${novelId}/chapters`);
      const updatedData = await updatedResponse.json();
      setChapters(updatedData.chapters || []);

      // Set selected chapter to the saved one
      setSelectedChapterId(savedChapter.id);

      // Show success message
      setSuccessMessage(
        publish ? "เผยแพร่ตอนสำเร็จ!" : "บันทึกแบบร่างสำเร็จ!"
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving chapter:", error);
      alert(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึก"
      );
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  // Select chapter from sidebar
  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
  };

  // Calculate word count
  const wordCount = textContent.replace(/\s/g, "").length;

  // Current chapter info
  const currentChapter = chapters.find((ch) => ch.id === selectedChapterId);
  const isPublished = currentChapter?.publishedAt != null;

  if (status === "loading" || loadingNovel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Editor Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/write"
              className="flex items-center gap-2 text-sm font-medium text-brand-black/70 hover:text-brand-black transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              กลับ
            </Link>
            <div className="hidden sm:block text-sm font-medium text-brand-black">
              {novel?.title}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{wordCount.toLocaleString("th-TH")} ตัวอักษร</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">
                {showSidebar ? "ซ่อนตอน" : "แสดงตอน"}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving || publishing || loadingChapter}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">บันทึก</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar - Chapter List */}
        {showSidebar && (
          <aside className="w-64 border-r border-border bg-cream/20 min-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="p-4">
              <Button
                size="sm"
                className="w-full mb-4"
                onClick={handleNewChapter}
              >
                <Plus className="h-4 w-4" />
                ตอนใหม่
              </Button>

              {loadingChapters ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-rosegold-dark" />
                </div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <PenTool className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  ยังไม่มีตอน
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleSelectChapter(chapter.id)}
                      className={`w-full text-left rounded-lg p-3 transition-all ${
                        selectedChapterId === chapter.id
                          ? "bg-rosegold-dark text-white shadow-md"
                          : "bg-white hover:bg-cream text-brand-black"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium mb-1">
                            ตอนที่ {chapter.number}
                          </div>
                          <div className="text-sm font-semibold truncate">
                            {chapter.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {chapter.publishedAt ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <FileText className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-75">
                        <span>
                          {chapter.wordCount.toLocaleString("th-TH")} อักษร
                        </span>
                        {!chapter.isFree && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Coins className="h-3 w-3" />
                              {chapter.coinPrice}
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Main Editor Area */}
        <main className="flex-1 overflow-y-auto">
          {loadingChapter ? (
            <div className="flex justify-center items-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-8">
              {/* Success Message */}
              {showSuccess && (
                <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {successMessage}
                  </span>
                </div>
              )}

              {/* Chapter Title */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ชื่อตอน..."
                className="w-full text-2xl font-bold text-brand-black placeholder:text-muted-foreground/40 focus:outline-none border-none bg-transparent mb-6"
              />

              {/* Rich Text Editor */}
              <div className="mb-8">
                <RichTextEditor
                  content={content}
                  onChange={handleContentChange}
                  placeholder="เริ่มเขียนเนื้อหาของคุณที่นี่..."
                  editable={true}
                />
              </div>

              {/* Pricing Section */}
              <div className="mt-8 rounded-xl border border-border p-5 bg-cream/10">
                <h3 className="text-sm font-semibold text-brand-black mb-4">
                  ตั้งค่าการเผยแพร่
                </h3>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsFree(true)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                      isFree
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-border text-muted-foreground hover:border-green-300"
                    }`}
                  >
                    <Unlock className="h-4 w-4" />
                    ตอนฟรี
                  </button>
                  <button
                    onClick={() => setIsFree(false)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                      !isFree
                        ? "border-coin bg-coin-light text-coin"
                        : "border-border text-muted-foreground hover:border-coin/30"
                    }`}
                  >
                    <Lock className="h-4 w-4" />
                    ติดเหรียญ
                  </button>
                </div>

                {!isFree && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm text-muted-foreground">
                      ราคา (เหรียญ)
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {[3, 5, 7, 10, 15].map((price) => (
                        <button
                          key={price}
                          onClick={() => setCoinPrice(price)}
                          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                            coinPrice === price
                              ? "bg-coin text-white"
                              : "bg-coin-light text-coin hover:bg-coin/10"
                          }`}
                        >
                          <Coins className="h-3 w-3" />
                          {price}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => handleSave(true)}
                  disabled={saving || publishing || loadingChapter}
                >
                  {publishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังเผยแพร่...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {isPublished ? "อัปเดตและเผยแพร่" : "เผยแพร่ตอนนี้"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleSave(false)}
                  disabled={saving || publishing || loadingChapter}
                >
                  {saving && !publishing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      บันทึกแบบร่าง
                    </>
                  )}
                </Button>
              </div>

              {isPublished && (
                <div className="mt-4 text-center text-xs text-muted-foreground">
                  ตอนนี้เผยแพร่แล้ว •{" "}
                  {new Date(currentChapter!.publishedAt!).toLocaleDateString(
                    "th-TH",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
