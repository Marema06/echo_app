'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export async function signUp(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = signUpSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Create user profile
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('users').insert({
      id: user.id,
      email: parsed.data.email,
      subscription_tier: 'free',
      preferences: {},
    });
  }

  redirect('/dashboard');
}

export async function signIn(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const parsed = signInSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !z.string().email().safeParse(email).success) {
    return { error: 'Email invalide' };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: 'Un email de réinitialisation a été envoyé.' };
}
