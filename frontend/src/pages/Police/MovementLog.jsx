import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTruck } from 'react-icons/fa'
import { evidenceLogAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'
import { useToast } from '../../hooks/useToast'

const MovementLog = () => {
  const { user } = useAuth()
  const { toasts, showToast, removeToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    evidence_id: '',
    source: '',
    destination: '',
    description: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await evidenceLogAPI.create({
        ...formData,
        log_type: 'movement'
      })
      showToast('Movement log recorded successfully and added to blockchain', 'success')
      
      // Reset form
      setFormData({
        evidence_id: '',
        source: '',
        destination: '',
        description: ''
      })
    } catch (error) {
      showToast(error.response?.data?.detail || 'Failed to create movement log', 'error')
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
      
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Evidence Movement Tracking</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movement Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-full">
              <FaTruck className="text-2xl text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Log Evidence Movement</h3>
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
                Source Location *
              </label>
              <input
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Evidence Room A, Crime Scene, Lab"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination Location *
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Forensic Lab, Court, Storage"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Movement Details *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                rows="5"
                placeholder="Reason for movement, transport method, condition upon transfer, etc."
                required
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Officer:</strong> {user?.full_name} (ID: {user?.id})
              </p>
              <p className="text-xs text-orange-700 mt-1">
                This movement will be recorded in the blockchain
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Recording Movement...' : 'Record Movement Log'}
            </motion.button>
          </form>
        </motion.div>

        {/* Instructions and Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
            <h3 className="text-lg font-bold text-orange-800 mb-4">Movement Log Guidelines</h3>
            <div className="space-y-3 text-sm text-orange-900">
              <div className="flex items-start space-x-2">
                <span className="font-bold text-orange-700">1.</span>
                <p>Verify the Evidence ID before creating a movement log</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-orange-700">2.</span>
                <p>Clearly specify the source and destination locations</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-orange-700">3.</span>
                <p>Document the reason for movement and transport conditions</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-orange-700">4.</span>
                <p>Record any changes in evidence condition or packaging</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-orange-700">5.</span>
                <p>Ensure the receiving party signs off on the transfer</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Common Movement Types</h3>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">Crime Scene → Evidence Room</p>
                <p className="text-gray-600">Initial collection and storage</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">Evidence Room → Forensic Lab</p>
                <p className="text-gray-600">For analysis and testing</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">Evidence Room → Court</p>
                <p className="text-gray-600">For presentation during trial</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">Court → Evidence Room</p>
                <p className="text-gray-600">Return after proceedings</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="font-semibold">Evidence Room → Long-term Storage</p>
                <p className="text-gray-600">After case closure</p>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-2">Chain of Custody Integrity</h3>
            <p className="text-sm text-blue-900">
              Every movement is permanently recorded in the blockchain with timestamp, 
              officer information, and location details. This ensures an unbreakable 
              chain of custody that can be verified at any time.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default MovementLog

