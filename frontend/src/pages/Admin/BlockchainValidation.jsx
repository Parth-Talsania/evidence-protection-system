import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaTimesCircle, FaSync, FaCube } from 'react-icons/fa'
import { blockchainAPI } from '../../utils/api'

const BlockchainValidation = () => {
  const [blockchain, setBlockchain] = useState([])
  const [validation, setValidation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    loadBlockchain()
  }, [])

  const loadBlockchain = async () => {
    try {
      const response = await blockchainAPI.getChain()
      setBlockchain(response.data)
    } catch (error) {
      console.error('Failed to load blockchain:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    setValidating(true)
    try {
      const response = await blockchainAPI.validate()
      setValidation(response.data)
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Blockchain Validation</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleValidate}
          disabled={validating}
          className="btn-primary flex items-center space-x-2"
        >
          <FaSync className={validating ? 'animate-spin' : ''} />
          <span>{validating ? 'Validating...' : 'Validate Blockchain'}</span>
        </motion.button>
      </div>

      {/* Validation Result */}
      {validation && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`card mb-6 border-l-4 ${
            validation.valid ? 'border-green-500' : 'border-red-500'
          }`}
        >
          <div className="flex items-start space-x-4">
            {validation.valid ? (
              <FaCheckCircle className="text-4xl text-green-500 flex-shrink-0" />
            ) : (
              <FaTimesCircle className="text-4xl text-red-500 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${
                validation.valid ? 'text-green-700' : 'text-red-700'
              }`}>
                {validation.valid ? 'Blockchain is Valid' : 'Blockchain Integrity Compromised'}
              </h3>
              
              {/* Chain Validation */}
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-700">Chain Integrity:</p>
                <p className={`text-sm ${validation.chain_valid ? 'text-green-600' : 'text-red-600'}`}>
                  {validation.chain_valid ? '✓' : '✗'} {validation.chain_message}
                </p>
                {validation.broken_at && (
                  <p className="text-sm text-gray-600 mt-1">
                    Issue detected at block #{validation.broken_at}
                  </p>
                )}
              </div>

              {/* Data Validation */}
              <div className="mb-2">
                <p className="text-sm font-semibold text-gray-700">Data Integrity:</p>
                <p className={`text-sm ${validation.data_valid ? 'text-green-600' : 'text-red-600'}`}>
                  {validation.data_valid ? '✓' : '✗'} {validation.data_message}
                </p>
              </div>

              {/* Tampered Evidence Details */}
              {validation.tampered_evidence && validation.tampered_evidence.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-bold text-red-800 mb-3">⚠️ Tampered Evidence Detected:</h4>
                  <div className="space-y-3">
                    {validation.tampered_evidence.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-red-300">
                        <p className="font-semibold text-gray-800 mb-1">
                          Evidence ID: <span className="text-red-600">{item.evidence_id}</span>
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          Modified Fields: <span className="font-medium text-red-600">{item.tampered_fields.join(', ')}</span>
                        </p>
                        
                        {/* Hash Comparison */}
                        {item.original_hash && item.current_hash && (
                          <div className="bg-gray-50 p-2 rounded mb-2 text-xs">
                            <p className="font-semibold text-gray-700 mb-1">🔐 Hash Mismatch:</p>
                            <p className="text-green-600 font-mono break-all mb-1">
                              <span className="font-semibold">Original:</span> {item.original_hash}
                            </p>
                            <p className="text-red-600 font-mono break-all">
                              <span className="font-semibold">Current:</span> {item.current_hash}
                            </p>
                          </div>
                        )}
                        
                        {/* Data Comparison */}
                        <div className="text-xs space-y-1">
                          <p className="text-gray-600">
                            <span className="font-semibold">Original Description (Blockchain):</span> {item.original_description}
                          </p>
                          <p className="text-red-600">
                            <span className="font-semibold">Current Description (Database):</span> {item.current_description}
                          </p>
                          
                          {/* File Path if tampered */}
                          {item.tampered_fields.includes('file_path') && item.details && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="font-semibold text-yellow-800">File Path Changed:</p>
                              <p className="text-gray-600">Original: {item.details.original_file_path || 'None'}</p>
                              <p className="text-red-600">Current: {item.details.current_file_path || 'None'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tampered Users Details */}
              {validation.tampered_users && validation.tampered_users.length > 0 && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-bold text-orange-800 mb-3">⚠️ Tampered User Data Detected:</h4>
                  <div className="space-y-3">
                    {validation.tampered_users.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-orange-300">
                        <p className="font-semibold text-gray-800 mb-1">
                          User ID: <span className="text-orange-600">{item.user_id}</span>
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          Modified Fields: <span className="font-medium text-orange-600">{item.tampered_fields.join(', ')}</span>
                        </p>
                        
                        {/* Data Comparison */}
                        <div className="text-xs space-y-1">
                          {item.tampered_fields.includes('username') && (
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">
                                <span className="font-semibold">Expected Username (Blockchain):</span> {item.expected_username}
                              </p>
                              <p className="text-red-600">
                                <span className="font-semibold">Current Username (Database):</span> {item.current_username}
                              </p>
                            </div>
                          )}
                          
                          {item.tampered_fields.includes('role') && (
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">
                                <span className="font-semibold">Expected Role (Blockchain):</span> {item.expected_role}
                              </p>
                              <p className="text-red-600">
                                <span className="font-semibold">Current Role (Database):</span> {item.current_role}
                              </p>
                            </div>
                          )}
                          
                          {item.tampered_fields.includes('full_name') && (
                            <div className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-600">
                                <span className="font-semibold">Expected Name (Blockchain):</span> {item.expected_full_name}
                              </p>
                              <p className="text-red-600">
                                <span className="font-semibold">Current Name (Database):</span> {item.current_full_name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Blockchain Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Blocks</p>
              <p className="text-3xl font-bold text-gray-800">{blockchain.length}</p>
            </div>
            <FaCube className="text-4xl text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div>
            <p className="text-sm text-gray-600 mb-1">Latest Block</p>
            <p className="text-3xl font-bold text-gray-800">#{blockchain.length - 1}</p>
          </div>
        </div>
        
        <div className="card">
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <p className={`text-lg font-bold ${
              validation?.valid ? 'text-green-600' : validation?.valid === false ? 'text-red-600' : 'text-gray-600'
            }`}>
              {validation ? (validation.valid ? 'Valid' : 'Invalid') : 'Not Validated'}
            </p>
          </div>
        </div>
      </div>

      {/* Blockchain Blocks */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Blockchain Blocks</h3>
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {blockchain.map((block, index) => (
            <motion.div
              key={block.index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-lg p-4 ${
                validation?.broken_at === block.index
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">
                    {block.index}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Block #{block.index}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(block.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                  {block.data.action}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">User Role:</span>
                    <span className="ml-2 font-medium">{block.data.user_role}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">User ID:</span>
                    <span className="ml-2 font-medium">{block.data.user_id}</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 mb-1">Details:</p>
                  <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
                    {JSON.stringify(block.data.details, null, 2)}
                  </pre>
                </div>

                <div>
                  <p className="text-gray-600">Hash:</p>
                  <p className="font-mono text-xs text-gray-800 break-all">{block.hash}</p>
                </div>

                <div>
                  <p className="text-gray-600">Previous Hash:</p>
                  <p className="font-mono text-xs text-gray-800 break-all">{block.prev_hash}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BlockchainValidation

