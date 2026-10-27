import { api } from "../api/client";
export async function login(usr: string, pwd: string) {
  console.log("=== LOGIN: Starting login ===", { usr });
  const params = new URLSearchParams();

  params.append("usr", usr);
  params.append("pwd", pwd);

  try {
    const { data } = await api.post(
      "/method/login",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("=== LOGIN: Success ===", { data });

    return data;
  } catch (error: any) {
    console.error("=== LOGIN: Error ===", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
}

export async function logout() {
  console.log("=== LOGOUT: Starting logout ===");
  const { data } = await api.post("/method/logout");
  console.log("=== LOGOUT: Success ===", { data });
  return data;
}

export async function getCurrentUser() {
  const loggedUserRes = await api.get("/method/frappe.auth.get_logged_user");
  const userId = loggedUserRes.data?.message;

  if (!userId || userId === "Guest") {
    throw new Error("No authenticated Frappe user found.");
  }

  const userRes = await api.get(`/resource/User/${encodeURIComponent(userId)}`, {
    params: {
      fields: JSON.stringify([
        "name",
        "email",
        "full_name",
        "user_image",
        "user_type",
        "enabled",
        "roles",
      ]),
    },
  });

  const userData = userRes.data?.data ?? {};
  const rawRoles = Array.isArray(userData.roles) ? userData.roles : [];
  const roles = rawRoles
    .map((role: unknown) => {
      if (typeof role === "string") return role;
      if (role && typeof role === "object") {
        const maybeRole = (role as Record<string, unknown>).role ?? (role as Record<string, unknown>).name ?? (role as Record<string, unknown>).Role;
        return typeof maybeRole === "string" ? maybeRole : "";
      }
      return "";
    })
    .filter((role): role is string => Boolean(role));

  const isAdmin =
    roles.some((role: string) => ["Administrator", "System Manager"].includes(role)) ||
    userData.user_type === "System User" ||
    userData.name === "Administrator";

  return {
    id: userData.name || userId,
    email: userData.email || userId,
    name: userData.full_name || userData.name || userId,
    avatarUrl: userData.user_image,
    createdAt: Date.now(),
    roles,
    isAdmin,
  };
}
export async function register(
  full_name: string,
  email: string,
  password: string
) {
  const { data } = await api.post(
    "/method/frappe.core.doctype.user.user.sign_up",
    {
      email,
      full_name,
      password,
      redirect_to: "/", // Required in Frappe v16
    }
  );

  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post(
    "/method/frappe.core.doctype.user.user.reset_password",
    { user: email }
  );

  return data;
}