"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileDialog({ isOpen, onClose }: Props) {
  const supabase = createClient();

  const [age, setAge] = useState("");
  const [department, setDepartment] = useState("");
  const [hospital, setHospital] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("doctors")
        .select("age, department, hospital")
        .eq("id", user.id)
        .single();

      if (data) {
        setAge(data.age || "");
        setDepartment(data.department || "");
        setHospital(data.hospital || "");
      }
    };

    if (isOpen) fetchProfile();
  }, [isOpen, supabase]);

  const handleSave = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("doctors")
      .update({
        age: age ? Number(age) : null,
        department,
        hospital,
      })
      .eq("id", user.id);

    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Input
            placeholder="Age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
          <Input
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <Input
            placeholder="Hospital Affiliation"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
          />

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
