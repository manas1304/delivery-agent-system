const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  login: async (credentials: any) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error("Login failed. Check your credentials.");
    return res.json();
  },
  
  getAgents: async (page = 1, limit = 10, search = "", status = "") => {
    const res = await fetch(
      `${BASE_URL}/agents?page=${page}&limit=${limit}&search=${search}&status=${status}`, 
      { headers: getHeaders() }
    );
    if (!res.ok) throw new Error("Failed to fetch agents.");
    return res.json();
  },

  createAgent: async (data: any) => {
    const res = await fetch(`${BASE_URL}/agents`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to create agent.");
    return result;
  },

  updateAgent: async (id: string, data: any) => {
    const res = await fetch(`${BASE_URL}/agents/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update agent.");
    return res.json();
  },

  deleteAgent: async (id: string) => {
    const res = await fetch(`${BASE_URL}/agents/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete agent.");
    return res.json();
  },
};