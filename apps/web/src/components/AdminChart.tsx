'use client'

import { useState, useEffect } from 'react'

interface ChartData {
  label: string
  value: number
  color: string
}

interface AdminChartProps {
  title: string
  data: ChartData[]
  type: 'bar' | 'pie' | 'line'
  height?: number
}

export default function AdminChart({ title, data, type, height = 300 }: AdminChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const renderBarChart = () => (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="w-20 text-sm text-slate-600 truncate">{item.label}</div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-6 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                style={{
                  backgroundColor: item.color,
                  width: `${(item.value / maxValue) * 100}%`
                }}
              >
                <span className="text-white text-xs font-medium">
                  {item.value}
                </span>
              </div>
            </div>
            <div className="w-12 text-sm text-slate-600 text-right">
              {((item.value / total) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderPieChart = () => {
    let cumulativePercentage = 0
    
    return (
      <div className="flex items-center justify-center gap-8">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="20"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${(percentage / 100) * 502.4} 502.4`
              const strokeDashoffset = -((cumulativePercentage / 100) * 502.4)
              cumulativePercentage += percentage

              return (
                <circle
                  key={index}
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{total}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{item.label}</div>
                <div className="text-xs text-slate-600">
                  {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 300
      const y = 200 - ((item.value / maxValue) * 160)
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="space-y-4">
        <svg width="100%" height="200" viewBox="0 0 300 200" className="border border-slate-200 rounded-lg bg-slate-50">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={40 + i * 40}
              x2="300"
              y2={40 + i * 40}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke={data[0]?.color || '#3b82f6'}
            strokeWidth="3"
            points={points}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 300
            const y = 200 - ((item.value / maxValue) * 160)
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={item.color}
                className="transition-all duration-1000 ease-out"
              />
            )
          })}
        </svg>
        
        <div className="flex justify-between text-xs text-slate-600 px-2">
          {data.map((item, index) => (
            <div key={index} className="text-center">
              <div className="font-medium">{item.value}</div>
              <div className="truncate w-16">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">{title}</h3>
      <div style={{ height: `${height}px` }}>
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderPieChart()}
        {type === 'line' && renderLineChart()}
      </div>
    </div>
  )
}