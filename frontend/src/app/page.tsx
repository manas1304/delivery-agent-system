"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", phoneNumber: "", serviceArea: "", status: "active" });

  const fetchAgents = useCallback(async () => {
    try {
      const data = await api.getAgents(page, 10, search, status);
      setAgents(data.agents);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (error) {
      router.push("/login"); // Redirect if token is missing/expired
    }
  }, [page, search, status, router]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      await api.deleteAgent(id);
      fetchAgents();
    }
  };

  const openModal = (agent: any = null) => {
    if (agent) {
      setEditingId(agent.id);
      setFormData({ fullName: agent.fullName, email: agent.email, phoneNumber: agent.phoneNumber, serviceArea: agent.serviceArea, status: agent.status });
    } else {
      setEditingId(null);
      setFormData({ fullName: "", email: "", phoneNumber: "", serviceArea: "", status: "active" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateAgent(editingId, formData);
      } else {
        await api.createAgent(formData);
      }
      setIsModalOpen(false);
      fetchAgents();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Delivery Agents Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700">Logout</button>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <div className="flex gap-2 w-full md:w-2/3">
            <input 
              type="text" 
              placeholder="Search by name or area..." 
              className="border p-2 rounded w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select 
              className="border p-2 rounded"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
            + Add Agent
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Area</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-gray-500">No agents found.</td></tr>
              ) : (
                agents.map((agent: any) => (
                  <tr key={agent.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{agent.fullName}</td>
                    <td className="p-4">{agent.email}</td>
                    <td className="p-4">{agent.phoneNumber}</td>
                    <td className="p-4">{agent.serviceArea}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs text-white ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => openModal(agent)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(agent.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex gap-4 items-center mt-6">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 border rounded bg-white disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button 
            disabled={page >= totalPages} 
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border rounded bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Agent" : "Add New Agent"}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input required type="text" placeholder="Full Name" className="w-full border p-2 rounded"
                  value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                <input required type="email" placeholder="Email Address" className="w-full border p-2 rounded"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input required type="text" placeholder="Phone Number" className="w-full border p-2 rounded"
                  value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                <input required type="text" placeholder="Service Area" className="w-full border p-2 rounded"
                  value={formData.serviceArea} onChange={e => setFormData({...formData, serviceArea: e.target.value})} />
                <select className="w-full border p-2 rounded" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="flex justify-end gap-2 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}