"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/utils/supabase/server";

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient();

  // Type-casting here for convenience
  // In a real app, you might want to validate better
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: {
        full_name: formData.get("fullName") as string,
      },
    },
  };

  const { data: authData, error } = await supabase.auth.signUp(data);

  if (error) {
    return { error: error.message };
  }

  // Manually create doctor profile if signup was successful and we have a user
  // This avoids relying on database triggers which might be fragile
  if (authData.user) {
    const supabaseAdmin = await createAdminClient();

    // We use upsert here. If the profile was created by a trigger (if you have one working),
    // this will simply update it or do nothing. If not, it creates it.
    // This makes the code resilient to both scenarios.
    const { error: profileError } = await supabaseAdmin.from("doctors").upsert({
      id: authData.user.id,
      email: data.email,
      name: data.options.data.full_name,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Error creating doctor profile:", profileError);
      // Optional: Logic to delete auth user if profile creation fails?
      // For now, we will return the error so the user knows something went wrong
      return {
        error:
          "Account created but failed to set up profile: " +
          profileError.message,
      };
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
