import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSignInAlt, FaSignOutAlt } from 'react-icons/fa'
import { evidenceLogAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'
import { useToast } from '../../hooks/useToast'

const EntryExitLog = () => {
  const { user } = useAuth()
  const { toasts, showToast, removeToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    evidence_id: '',
    log_type: 'entry',
    item_count: '',
    size: '',
    description: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await evidenceLogAPI.create(formData)
      showToast('Entry/Exit log recorded successfully and added to blockchain', 'success')
      
      // Reset form
      setFormData({
        evidence_id: '',
        log_type: 'entry',
        item_count: '',
        size: '',
        description: ''
      })
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create log', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
      
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Entry/Exit Log Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entry Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-100 rounded-full">
              <FaSignInAlt className="text-2xl text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Log Entry/Exit</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence ID *
              </label>
              <input
                type="text"
                name="evidence_id"
                value={formData.evidence_id}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., EV-2025-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Type *
              </label>
              <select
                name="log_type"
                value={formData.log_type}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="entry">Entry (Evidence In)</option>
                <option value="exit">Exit (Evidence Out)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Count *
              </label>
              <input
                type="number"
                name="item_count"
                value={formData.item_count}
                onChange={handleChange}
                className="input-field"
                placeholder="Number of items"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size/Dimensions
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., 10x10x5 cm or Small/Medium/Large"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description/Notes *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                rows="4"
                placeholder="Condition of evidence, handling notes, etc."
                required
              />
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Officer:</strong> {user?.full_name} (ID: {user?.id})
              </p>
              <p className="text-xs text-green-700 mt-1">
                This log will be recorded in the blockchain
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Recording Log...' : 'Record Entry/Exit Log'}
            </motion.button>
          </form>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-4">Instructions</h3>
            <div className="space-y-3 text-sm text-green-900">
              <div className="flex items-start space-x-2">
                <span className="font-bold text-green-700">1.</span>
                <p>Enter the exact Evidence ID of the item being logged</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-green-700">2.</span>
                <p>Select whether this is an Entry (receiving evidence) or Exit (releasing evidence)</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-green-700">3.</span>
                <p>Record the item count and physical dimensions if applicable</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-green-700">4.</span>
                <p>Add detailed notes about the condition and any observations</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-green-700">5.</span>
                <p>Submit to create an immutable blockchain record</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Log Types</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FaSignInAlt className="text-green-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-800">Entry</p>
                  <p className="text-sm text-gray-600">
                    Evidence is being received and stored in the evidence room
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FaSignOutAlt className="text-orange-600 mt-1" />
                <div>
                  <p className="font-semibold text-gray-800">Exit</p>
                  <p className="text-sm text-gray-600">
                    Evidence is being released from the evidence room (for court, analysis, etc.)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Chain of Custody</h3>
            <p className="text-sm text-blue-900">
              Every entry and exit creates a permanent record in the blockchain, 
              ensuring complete traceability and maintaining the integrity of the 
              chain of custody for all evidence items.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default EntryExitLog

