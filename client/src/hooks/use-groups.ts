import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type Group = z.infer<typeof api.groups.list.responses[200]>[0];

export function useGroups() {
  return useQuery({
    queryKey: [api.groups.list.path],
    queryFn: async () => {
      const res = await fetch(api.groups.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch groups");
      return api.groups.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const payload = api.groups.create.input.parse({ url });
      const res = await fetch(api.groups.create.path, {
        method: api.groups.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "حدث خطأ أثناء إضافة الرابط");
      }
      return api.groups.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.groups.delete.path, { id });
      const res = await fetch(url, {
        method: api.groups.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("حدث خطأ أثناء حذف الرابط");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
    },
  });
}
