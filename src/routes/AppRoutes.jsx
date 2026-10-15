/**
 * AppRoutes Component
 * Responsibility: Client-side routing configuration defining application paths
 * and mapping them to their corresponding page views.
 */
import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard.jsx'
import SearchLab from '../pages/SearchLab.jsx'
import FetchLab from '../pages/FetchLab.jsx'
import AgentLab from '../pages/AgentLab.jsx'
import RunHistory from '../pages/RunHistory.jsx'
import Settings from '../pages/Settings.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/search" element={<SearchLab />} />
      <Route path="/fetch" element={<FetchLab />} />
      <Route path="/agent" element={<AgentLab />} />
      <Route path="/history" element={<RunHistory />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}
