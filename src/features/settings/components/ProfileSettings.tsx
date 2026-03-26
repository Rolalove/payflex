"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/src/utils/supabase/client";

export function ProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    phone_number: "",
    bio: "",
    country: "",
    avatar_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            username: data.username || "",
            phone_number: data.phone_number || "",
            bio: data.bio || "",
            country: data.country || "",
            avatar_url: data.avatar_url || "",
          });
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  const validatePhone = (phone: string) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!validatePhone(profile.phone_number)) {
      newErrors.phone_number = "Please enter a valid phone number (10-15 digits)";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: `${profile.first_name} ${profile.last_name}`.trim(),
          username: profile.username,
          phone_number: profile.phone_number,
          bio: profile.bio,
          country: profile.country,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      
      if (error) {
        alert("Error updating profile: " + error.message);
      } else {
        alert("Profile updated successfully");
      }
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-500">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl border-4 border-white shadow-sm overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (profile.first_name?.charAt(0) || profile.last_name?.charAt(0) || profile.email?.charAt(0) || "U").toUpperCase()
              )}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              {profile.first_name || profile.last_name ? `${profile.first_name} ${profile.last_name}` : "User"}
            </h3>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">First Name</label>
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              className="w-full bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Elon"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Last Name</label>
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              className="w-full bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Musk"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full bg-sidebar-bg border border-border rounded-xl py-3 pl-8 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="username"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Phone Number</label>
            <input
              type="tel"
              value={profile.phone_number}
              onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
              className={`w-full bg-sidebar-bg border ${errors.phone_number ? 'border-red-500' : 'border-border'} rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all`}
              placeholder="+234 800 000 0000"
            />
            {errors.phone_number && <p className="text-[10px] text-red-500 font-medium">{errors.phone_number}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Country</label>
            <input
              type="text"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className="w-full bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Nigeria"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-muted border border-border rounded-xl py-3 px-4 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px] resize-none"
            placeholder="Tell us a bit about yourself..."
          />
        </div>

        <div className="pt-4 border-t border-border mt-8">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-900 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
