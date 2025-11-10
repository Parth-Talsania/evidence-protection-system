import React from 'react'
import { motion } from 'framer-motion'

const StatCard = ({ title, value, icon: Icon, color = 'primary', trend }) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="card"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-4 rounded-full ${colorClasses[color]}`}>
            <Icon className="text-3xl" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default StatCard

