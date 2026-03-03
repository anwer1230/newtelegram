import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type StatusResponse = z.infer<typeof api.telegram.status.responses[200]>;

export function useTelegramStatus() {
  return useQuery({
    queryKey: [api.telegram.status.path],
    queryFn: async () => {
      const res = await fetch(api.telegram.status.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      return api.telegram.status.responses[200].parse(await res.json());
    },
    // Poll every 5 seconds to keep dashboard up to date
    refetchInterval: 5000,
  });
}

export function useTelegramLogin() {
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const payload = api.telegram.login.input.parse({ phoneNumber });
      const res = await fetch(api.telegram.login.path, {
        method: api.telegram.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل تسجيل الدخول");
      return api.telegram.login.responses[200].parse(data);
    },
  });
}

export function useTelegramVerifyCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { phoneNumber: string; phoneCodeHash: string; code: string }) => {
      const payload = api.telegram.verifyCode.input.parse(params);
      const res = await fetch(api.telegram.verifyCode.path, {
        method: api.telegram.verifyCode.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "رمز غير صالح");
      return api.telegram.verifyCode.responses[200].parse(data);
    },
    onSuccess: (data) => {
      if (!data.needsPassword) {
        queryClient.invalidateQueries({ queryKey: [api.telegram.status.path] });
      }
    },
  });
}

export function useTelegramVerifyPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (password: string) => {
      const payload = api.telegram.verifyPassword.input.parse({ password });
      const res = await fetch(api.telegram.verifyPassword.path, {
        method: api.telegram.verifyPassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "كلمة مرور غير صالحة");
      return api.telegram.verifyPassword.responses[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.telegram.status.path] });
    },
  });
}

export function useTelegramSender() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: "start" | "stop") => {
      const payload = api.telegram.sender.input.parse({ action });
      const res = await fetch(api.telegram.sender.path, {
        method: api.telegram.sender.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "حدث خطأ أثناء تغيير حالة الإرسال");
      return api.telegram.sender.responses[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.telegram.status.path] });
    },
  });
}

export function useTelegramMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: "start" | "stop") => {
      const payload = api.telegram.monitor.input.parse({ action });
      const res = await fetch(api.telegram.monitor.path, {
        method: api.telegram.monitor.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "حدث خطأ أثناء تغيير حالة المراقبة");
      return api.telegram.monitor.responses[200].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.telegram.status.path] });
    },
  });
}
