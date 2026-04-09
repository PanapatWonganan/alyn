"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Camera, User, Save, Loader2, Check, Eye, EyeOff, Lock } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string;
  penName: string | null;
  avatar: string | null;
  bio: string | null;
  coinBalance: number;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    penName: "",
    bio: "",
    avatar: "",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Fetch user data
  useEffect(() => {
    if (status === "authenticated") {
      fetchUserData();
    }
  }, [status]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("Failed to fetch user data");
      const data = await res.json();
      setUserData(data.user);
      setFormData({
        name: data.user.name || "",
        penName: data.user.penName || "",
        bio: data.user.bio || "",
        avatar: data.user.avatar || "",
      });
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลได้");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setFormData((prev) => ({ ...prev, avatar: data.url }));
    } catch (err) {
      setError("ไม่สามารถอัปโหลดรูปภาพได้");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate name
    if (!formData.name.trim()) {
      setError("กรุณากรอกชื่อ");
      return;
    }

    // Validate bio length
    if (formData.bio.length > 500) {
      setError("เกี่ยวกับตัวเองต้องไม่เกิน 500 ตัวอักษร");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          penName: formData.penName.trim() || null,
          bio: formData.bio.trim() || null,
          avatar: formData.avatar || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await res.json();
      setUserData(data.user);

      // Refresh server data to update session
      router.refresh();

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    try {
      setChangingPassword(true);

      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      // Clear form and show success
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      console.error(err);
    } finally {
      setChangingPassword(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosegold-dark" />
      </div>
    );
  }

  if (!session || !userData) {
    return null;
  }

  const bioCharCount = formData.bio.length;

  return (
    <div className="min-h-screen bg-cream/30 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Success banner */}
        {showSuccess && (
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800">
            <Check className="h-5 w-5" />
            <p className="text-sm font-medium">บันทึกข้อมูลเรียบร้อยแล้ว</p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-brand-black">
            ตั้งค่าโปรไฟล์
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div>
              <label className="mb-3 block text-sm font-medium text-brand-black">
                รูปโปรไฟล์
              </label>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="h-full w-full rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-rosegold-dark border-2 border-border">
                      <User className="h-10 w-10 text-white" />
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-cream-dark disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                    {uploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูป"}
                  </button>
                  <p className="mt-2 text-xs text-muted-foreground">
                    JPG, PNG หรือ GIF (สูงสุด 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-brand-black"
              >
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-brand-black placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                placeholder="กรอกชื่อของคุณ"
              />
            </div>

            {/* Pen Name */}
            <div>
              <label
                htmlFor="penName"
                className="mb-2 block text-sm font-medium text-brand-black"
              >
                นามปากกา
              </label>
              <input
                type="text"
                id="penName"
                value={formData.penName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, penName: e.target.value }))
                }
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-brand-black placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                placeholder="นามปากกาสำหรับการเขียน (ถ้ามี)"
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium text-brand-black"
              >
                เกี่ยวกับตัวเอง
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                rows={4}
                maxLength={500}
                className="w-full resize-none rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-brand-black placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                placeholder="เขียนบางอย่างเกี่ยวกับตัวคุณ..."
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>ไม่เกิน 500 ตัวอักษร</span>
                <span
                  className={bioCharCount > 500 ? "text-red-500" : ""}
                >
                  {bioCharCount}/500
                </span>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-brand-black">
                อีเมล
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-muted-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                ไม่สามารถเปลี่ยนอีเมลได้
              </p>
            </div>

            {/* Member since (read-only) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-brand-black">
                สมาชิกตั้งแต่
              </label>
              <input
                type="text"
                value={new Date(userData.createdAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                disabled
                className="w-full rounded-xl border border-border bg-gray-50 px-4 py-2.5 text-sm text-muted-foreground"
              />
            </div>

            {/* Save button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full px-6 py-2.5 text-sm font-medium text-brand-black transition-colors hover:bg-cream"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex items-center gap-2 rounded-full bg-rosegold-dark px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rosegold disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    บันทึก
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="mt-6 rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-brand-black">
            เปลี่ยนรหัสผ่าน
          </h2>

          {/* Password Success banner */}
          {passwordSuccess && (
            <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800">
              <Check className="h-5 w-5" />
              <p className="text-sm font-medium">เปลี่ยนรหัสผ่านเรียบร้อยแล้ว</p>
            </div>
          )}

          {/* Password Error banner */}
          {passwordError && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800">
              <p className="text-sm font-medium">{passwordError}</p>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6">
            {/* Current Password */}
            <div>
              <label
                htmlFor="currentPassword"
                className="mb-2 block text-sm font-medium text-brand-black"
              >
                รหัสผ่านปัจจุบัน <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-12 text-sm text-brand-black placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-black"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-brand-black"
              >
                รหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-12 text-sm text-brand-black placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-black"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-brand-black"
              >
                ยืนยันรหัสผ่านใหม่ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-12 text-sm text-brand-black placeholder:text-muted-foreground focus:border-rosegold focus:outline-none focus:ring-2 focus:ring-rosegold/20"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-black"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={changingPassword}
                className="flex items-center gap-2 rounded-full bg-rosegold-dark px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rosegold disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังเปลี่ยนรหัสผ่าน...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    เปลี่ยนรหัสผ่าน
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
