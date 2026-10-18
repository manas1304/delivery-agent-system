"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function Dashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    serviceArea: "",
    status: "active",
  });
  const [formError, setFormError] = useState("");

  // Delete Modal States
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [viewAgent, setViewAgent] = useState<any>(null);

  const handleView = async (id: string) => {
    try {
      const data = await api.getAgent(id);
      setViewAgent(data.agent);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Login Check
  useEffect(() => {
    if (!localStorage.getItem("token")) router.replace("/login");
  }, [router]);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await api.getAgents(page, 5, search, status);
      setAgents(data.agents);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (error: any) {
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [page, search, status, router]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  // Triggered when delete button in table is clicked
  const confirmDeleteAction = (id: string) => {
    setDeleteError("");
    setDeleteId(id);
  };

  // Executes the actual deletion
  const executeDelete = async () => {
    try {
      if (!deleteId) return;
      await api.deleteAgent(deleteId);
      setDeleteId(null);
      fetchAgents();
    } catch (error: any) {
      if (error.message.includes("Invalid or expired token")) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      setDeleteError(error.message || "Failed to delete agent.");
    }
  };

  const openModal = (agent: any = null) => {
    setFormError("");
    if (agent) {
      setEditingId(agent.id);
      setFormData({
        fullName: agent.fullName,
        email: agent.email,
        phoneNumber: agent.phoneNumber,
        serviceArea: agent.serviceArea,
        status: agent.status,
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: "",
        email: "",
        phoneNumber: "",
        serviceArea: "",
        status: "active",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Basic frontend phone validation (digits and length)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setFormError("Please enter a valid phone number (10-15 digits).");
      return;
    }

    try {
      if (editingId) {
        await api.updateAgent(editingId, formData);
      } else {
        await api.createAgent(formData);
      }
      setIsModalOpen(false);
      fetchAgents();
    } catch (error: any) {
      if (error.message.includes("Invalid or expired token")) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
      setFormError(error.message || "An error occurred while saving.");
    }
  };

  return (
    <div
      className={`min-h-screen bg-gray-50 text-black p-8 ${montserrat.className}`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Delivery Agents Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-md shadow hover:bg-red-700 transition-colors font-medium"
          >
            Logout
          </button>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <div className="flex gap-3 w-full md:w-2/3">
            <input
              type="text"
              placeholder="Search by name or area..."
              className="border border-gray-300 p-2.5 rounded-md w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border border-gray-300 p-2.5 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-md shadow hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Agent
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Phone</th>
                <th className="p-4 font-semibold">Area</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No agents found.
                  </td>
                </tr>
              ) : (
                agents.map((agent: any) => (
                  <tr
                    key={agent.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-gray-900">
                      {agent.fullName}
                    </td>
                    <td className="p-4 text-gray-600">{agent.email}</td>
                    <td className="p-4 text-gray-600">{agent.phoneNumber}</td>
                    <td className="p-4 text-gray-600">{agent.serviceArea}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${agent.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {agent.status.charAt(0).toUpperCase() +
                          agent.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 flex gap-3">
                      <button
                        onClick={() => openModal(agent)}
                        className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDeleteAction(agent.id)}
                        className="text-red-600 font-medium hover:text-red-800 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleView(agent.id)}
                        className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex gap-4 items-center mt-6 justify-center">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            Next
          </button>
        </div>

        {/* Create / Edit Modal with Backdrop Blur */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                {editingId ? "Edit Agent" : "Add New Agent"}
              </h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="John Doe"
                    className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="1234567890"
                    className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Area
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Downtown"
                    className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.serviceArea}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceArea: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Save Agent
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm transform transition-all text-center">
              <h2 className="text-xl font-bold mb-2 text-gray-800">
                Confirm Deletion
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to delete this agent? This action cannot
                be undone.
              </p>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded text-left">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="px-5 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors w-full"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors shadow-sm w-full"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Read-Only View Modal */}
      {viewAgent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Agent Details
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">ID:</span>{" "}
                {viewAgent.id}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Name:</span>{" "}
                {viewAgent.fullName}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Email:</span>{" "}
                {viewAgent.email}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Phone:</span>{" "}
                {viewAgent.phoneNumber}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Area:</span>{" "}
                {viewAgent.serviceArea}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Status:</span>{" "}
                {viewAgent.status}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Joined:</span>{" "}
                {new Date(viewAgent.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setViewAgent(null)}
                className="px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
