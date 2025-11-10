import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaBoxOpen, FaCloudUploadAlt, FaFile, FaTimes } from 'react-icons/fa'
import { evidenceAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

const AddEvidence = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    evidence_id: '',
    description: '',
    type: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    investigating_officer_id: '',
    forensic_officer_id: user?.id || ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key])
      })
      
      // Append file if selected
      if (selectedFile) {
        formDataToSend.append('file', selectedFile)
      }
      
      await evidenceAPI.create(formDataToSend)
      alert('Evidence added successfully and recorded in blockchain')
      navigate('/forensic')
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add evidence')
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file) => {
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert('Invalid file type. Allowed: Images (JPG, PNG, GIF), PDF, DOC, DOCX, TXT')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Maximum size is 10MB')
      return
    }
    
    setSelectedFile(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = () => {
    if (!selectedFile) return <FaFile />
    
    const fileType = selectedFile.type
    if (fileType.startsWith('image/')) {
      return '🖼️'
    } else if (fileType === 'application/pdf') {
      return '📄'
    } else if (fileType.includes('word')) {
      return '📝'
    } else {
      return '📎'
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaBoxOpen className="mr-3 text-blue-600" />
        Add New Evidence
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
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
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for this evidence item
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                rows="4"
                placeholder="Detailed description of the evidence..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select Type</option>
                <option value="Physical">Physical Evidence</option>
                <option value="Digital">Digital Evidence</option>
                <option value="Biological">Biological Evidence</option>
                <option value="Documentary">Documentary Evidence</option>
                <option value="Trace">Trace Evidence</option>
                <option value="Impression">Impression Evidence</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forensic Officer ID *
              </label>
              <input
                type="number"
                name="forensic_officer_id"
                value={formData.forensic_officer_id}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Collected *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Collected *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Investigating Officer ID *
              </label>
              <input
                type="number"
                name="investigating_officer_id"
                value={formData.investigating_officer_id}
                onChange={handleChange}
                className="input-field"
                placeholder="Officer ID handling the investigation"
                required
              />
            </div>

            {/* File Upload Section */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document/Image (Optional)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getFileIcon()}</span>
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <FaCloudUploadAlt className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-600 mb-2">
                      Drag and drop your file here, or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, GIF, PDF, DOC, DOCX, TXT (Max 10MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This action will create a new block in the blockchain. 
              All evidence additions are immutable and permanently recorded.
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Evidence...' : 'Add Evidence'}
            </motion.button>
            <button
              type="button"
              onClick={() => navigate('/forensic')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default AddEvidence

