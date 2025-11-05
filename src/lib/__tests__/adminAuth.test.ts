import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Clerk
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

describe("Admin Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isUserAdmin", () => {
    it("should return true for admin users", async () => {
      // Mock clerkClient to return admin user
      const mockClerkClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: { role: "admin" },
          }),
        },
      };

      const { clerkClient } = await import("@clerk/nextjs/server");
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      const { isUserAdmin } = await import("../adminServerAuth");
      const result = await isUserAdmin("test-user-id");

      expect(result).toBe(true);
      expect(mockClerkClient.users.getUser).toHaveBeenCalledWith(
        "test-user-id"
      );
    });

    it("should return false for non-admin users", async () => {
      // Mock clerkClient to return non-admin user
      const mockClerkClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: { role: "user" },
          }),
        },
      };

      const { clerkClient } = await import("@clerk/nextjs/server");
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      const { isUserAdmin } = await import("../adminServerAuth");
      const result = await isUserAdmin("test-user-id");

      expect(result).toBe(false);
    });

    it("should return false when user has no role metadata", async () => {
      // Mock clerkClient to return user without role
      const mockClerkClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: {},
          }),
        },
      };

      const { clerkClient } = await import("@clerk/nextjs/server");
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      const { isUserAdmin } = await import("../adminServerAuth");
      const result = await isUserAdmin("test-user-id");

      expect(result).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      // Mock clerkClient to throw error
      const mockClerkClient = {
        users: {
          getUser: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      const { clerkClient } = await import("@clerk/nextjs/server");
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      const { isUserAdmin } = await import("../adminServerAuth");
      const result = await isUserAdmin("test-user-id");

      expect(result).toBe(false);
    });
  });

  describe("getCurrentUserAdminStatus", () => {
    it("should return admin status for authenticated admin user", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");

      // Mock auth to return user ID
      vi.mocked(auth).mockResolvedValue({ userId: "test-user-id" } as any);

      // Mock clerkClient to return admin user
      const mockClerkClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: { role: "admin" },
          }),
        },
      };
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      const { getCurrentUserAdminStatus } = await import("../adminServerAuth");
      const result = await getCurrentUserAdminStatus();

      expect(result).toEqual({
        isAuthenticated: true,
        isAdmin: true,
        userId: "test-user-id",
      });
    });

    it("should return non-admin status for authenticated non-admin user", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");

      // Mock auth to return user ID
      vi.mocked(auth).mockResolvedValue({ userId: "test-user-id" } as any);

      // Mock clerkClient to return non-admin user
      const mockClerkClient = {
        users: {
          getUser: vi.fn().mockResolvedValue({
            publicMetadata: { role: "user" },
          }),
        },
      };
      vi.mocked(clerkClient).mockResolvedValue(mockClerkClient as any);

      const { getCurrentUserAdminStatus } = await import("../adminServerAuth");
      const result = await getCurrentUserAdminStatus();

      expect(result).toEqual({
        isAuthenticated: true,
        isAdmin: false,
        userId: "test-user-id",
      });
    });

    it("should return unauthenticated status when no user", async () => {
      const { auth } = await import("@clerk/nextjs/server");

      // Mock auth to return no user ID
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const { getCurrentUserAdminStatus } = await import("../adminServerAuth");
      const result = await getCurrentUserAdminStatus();

      expect(result).toEqual({
        isAuthenticated: false,
        isAdmin: false,
      });
    });
  });

  describe("checkAdminRole (client-side)", () => {
    it("should return true for admin role", async () => {
      const { checkAdminRole } = await import("../adminAuth");
      const result = checkAdminRole({ role: "admin" });
      expect(result).toBe(true);
    });

    it("should return false for non-admin role", async () => {
      const { checkAdminRole } = await import("../adminAuth");
      const result = checkAdminRole({ role: "user" });
      expect(result).toBe(false);
    });

    it("should return false for no role", async () => {
      const { checkAdminRole } = await import("../adminAuth");
      const result = checkAdminRole({});
      expect(result).toBe(false);
    });

    it("should return false for null metadata", async () => {
      const { checkAdminRole } = await import("../adminAuth");
      const result = checkAdminRole(null);
      expect(result).toBe(false);
    });

    it("should return false for undefined metadata", async () => {
      const { checkAdminRole } = await import("../adminAuth");
      const result = checkAdminRole(undefined);
      expect(result).toBe(false);
    });
  });
});
