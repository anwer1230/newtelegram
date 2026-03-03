import { z } from "zod";
import { insertGroupSchema, groups } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  groups: {
    list: {
      method: "GET" as const,
      path: "/api/groups" as const,
      responses: {
        200: z.array(z.custom<typeof groups.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/groups" as const,
      input: insertGroupSchema,
      responses: {
        201: z.custom<typeof groups.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/groups/:id" as const,
      responses: {
        204: z.void(),
      },
    },
  },
  telegram: {
    login: {
      method: "POST" as const,
      path: "/api/telegram/login" as const,
      input: z.object({
        phoneNumber: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string(), phoneCodeHash: z.string() }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    verifyCode: {
      method: "POST" as const,
      path: "/api/telegram/verify-code" as const,
      input: z.object({
        phoneNumber: z.string(),
        phoneCodeHash: z.string(),
        code: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string(), needsPassword: z.boolean().optional() }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    verifyPassword: {
      method: "POST" as const,
      path: "/api/telegram/verify-password" as const,
      input: z.object({
        password: z.string(),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    status: {
      method: "GET" as const,
      path: "/api/telegram/status" as const,
      responses: {
        200: z.object({ 
          isLoggedIn: z.boolean(),
          isSenderRunning: z.boolean(),
          isMonitorRunning: z.boolean(),
        }),
      },
    },
    sender: {
      method: "POST" as const,
      path: "/api/telegram/sender" as const,
      input: z.object({ action: z.enum(["start", "stop"]) }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    monitor: {
      method: "POST" as const,
      path: "/api/telegram/monitor" as const,
      input: z.object({ action: z.enum(["start", "stop"]) }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
