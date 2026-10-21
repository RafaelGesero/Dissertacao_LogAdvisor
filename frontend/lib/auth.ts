"use client"

import { useEffect, useState } from "react"
import { storedLanguage } from "@/lib/i18n"

const TOKEN_KEY = "loggingadvisor_token"

export const API_URL = process.env.NEXT_PUBLIC_API_URL

export type CurrentUser = {
  id: number
  email: string
  role: "USER" | "ADMIN"
  createdAt: string | null
  analyses: number
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
  cachedUser = null
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  cachedUser = null
}

export function signOut() {
  clearToken()
  window.location.href = "/login"
}

export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Makes the backend answer (messages and LLM output) in the language chosen with the switch. */
export function languageHeaders(): Record<string, string> {
  return { "Accept-Language": storedLanguage() === "pt" ? "pt-PT" : "en" }
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string> | undefined),
      ...languageHeaders(),
      ...authHeaders(),
    },
  })
  if (res.status === 401) {
    clearToken()
    window.location.href = "/login"
  }
  return res
}

/** POST/PUT a JSON body with the auth header. */
export function apiJson(input: string, method: string, body: unknown): Promise<Response> {
  return apiFetch(input, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

/** The backend sends {"message": "..."} for errors it raises on purpose. */
export async function errorMessage(res: Response, fallback?: string): Promise<string> {
  try {
    const data = await res.json()
    if (data?.message) return data.message
  } catch {
    // not JSON
  }
  return fallback ?? `Server error: ${res.status}`
}

let cachedUser: CurrentUser | null = null

/** The signed-in user (fetched once per page load and shared between components). */
export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser)

  useEffect(() => {
    if (cachedUser || !getToken()) return
    let active = true
    apiFetch(`${API_URL}/auth/me`)
      .then((r) => (r.ok ? r.json() : null))
      .then((u: CurrentUser | null) => {
        cachedUser = u
        if (active) setUser(u)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return user
}
