import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaEdit, FaTrash, FaTimes, FaHistory, FaFile, FaDownload, FaImage } from 'react-icons/fa'
import { evidenceAPI, blockchainAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'
import { useToast } from '../../hooks/useToast'

const EvidenceList = () => {
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingEvidence, setEditingEvidence] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingEvidenceId, setDeletingEvidenceId] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [blockchainHistory, setBlockchainHistory] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()
  const { toasts, showToast, removeToast } = useToast()

  const [formData, setFormData] = useState({
    description: '',
    type: '',
    date: '',
    time: '',
    investigating_officer_id: '',
    forensic_officer_id: user?.id || ''
  })

  useEffect(() => {
    loadEvidence()
  }, [])

  const loadEvidence = async () => {
    try {
      const response = await evidenceAPI.getAll()
      // Filter out deleted evidence
      const activeEvidence = response.data.filter(item => item.status !== 'deleted')
      setEvidence(activeEvidence)
    } catch (error) {
      console.error('Failed to load evidence:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item) => {
    setEditingEvidence(item)
    setFormData({
      description: item.description,
      type: item.type,
      date: item.date,
      time: item.time,
      investigating_officer_id: item.investigating_officer_id,
      forensic_officer_id: item.forensic_officer_id
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await evidenceAPI.update(editingEvidence.evidence_id, formData)
      loadEvidence()
      setShowEditModal(false)
      showToast('Evidence updated successfully', 'success')
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to update evidence', 'error')
    }
  }

  const handleDelete = (evidenceId) => {
    setDeletingEvidenceId(evidenceId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      await evidenceAPI.delete(deletingEvidenceId)
      loadEvidence()
      setShowDeleteConfirm(false)
      setDeletingEvidenceId(null)
      showToast('Evidence deleted successfully', 'success')
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to delete evidence', 'error')
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeletingEvidenceId(null)
  }

  const handleViewHistory = async (evidenceId) => {
    try {
      const response = await blockchainAPI.getEvidenceHistory(evidenceId)
      setBlockchainHistory(response.data)
      setShowHistoryModal(true)
    } catch (error) {
      console.error('Failed to load blockchain history:', error)
    }
  }

  const filteredEvidence = evidence.filter(item =>
    item.evidence_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Toast Notifications */}
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Evidence Management</h2>

      {/* Search */}
      <div className="card mb-6">
        <input
          type="text"
          placeholder="Search by Evidence ID, Description, or Type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvidence.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{item.evidence_id}</h3>
                <p className="text-sm text-gray-600">{item.type}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                item.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {item.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Description:</strong> {item.description}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Date:</strong> {item.date} at {item.time}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Investigating Officer ID:</strong> {item.investigating_officer_id}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Forensic Officer ID:</strong> {item.forensic_officer_id}
              </p>
              {item.file_name && (
                <div className="flex items-center space-x-2 pt-2">
                  <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg flex-1">
                    {item.file_type?.startsWith('image/') ? (
                      <FaImage className="text-blue-600" />
                    ) : (
                      <FaFile className="text-blue-600" />
                    )}
                    <span className="text-sm text-blue-800 truncate">{item.file_name}</span>
                  </div>
                  <a
                    href={`http://localhost:8000/${item.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-lg transition-colors"
                    title="Download/View file"
                  >
                    <FaDownload />
                  </a>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-colors"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleViewHistory(item.evidence_id)}
                className="flex-1 flex items-center justify-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 py-2 rounded-lg transition-colors"
              >
                <FaHistory />
                <span>History</span>
              </button>
              <button
                onClick={() => handleDelete(item.evidence_id)}
                className="flex-1 flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-colors"
                data-testid={`delete-evidence-${item.evidence_id}`}
                data-action="delete"
              >
                <FaTrash />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredEvidence.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No evidence found
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            data-testid="delete-confirm-modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this evidence? This action cannot be undone and will be recorded on the blockchain.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  data-testid="confirm-delete-button"
                >
                  Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  data-testid="cancel-delete-button"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Edit Evidence</h3>
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="close-edit-modal"
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Update Evidence
                  </button>
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blockchain History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Blockchain History</h3>
                <button 
                  onClick={() => setShowHistoryModal(false)} 
                  className="text-gray-500 hover:text-gray-700"
                  data-testid="close-history-modal"
                  aria-label="Close modal"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                {blockchainHistory.map((block) => (
                  <div key={block.index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">Block #{block.index}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(block.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">
                      <strong>Action:</strong> {block.data.action}
                    </p>
                    <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(block.data.details, null, 2)}
                    </pre>
                  </div>
                ))}

                {blockchainHistory.length === 0 && (
                  <p className="text-center text-gray-500">No blockchain history found</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EvidenceList

