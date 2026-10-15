/**
 * Header Component
 * Responsibility: Application top-bar presenting active page title, environment status,
 * and quick actions.
 */
import React from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Terminal, ChevronRight } from 'lucide-react'

const routeTitles = {
  '/': { title: 'Dashboard', category: 'Overview' },
  '/search': { title: 'Search Lab', category: 'Intelligence' },
  '/fetch': { title: 'Fetch Lab', category: 'Extraction' },
  '/agent': { title: 'Agent Lab', category: 'Automation' },
  '/history': { title: 'Run History', category: 'Logs' },
  '/settings': { title: 'Settings', category: 'Configuration' },
}

export default function Header({ onToggleMobileMenu }) {
  const location = useLocation()
  const activeRoute = routeTitles[location.pathname] || { title: 'Studio', category: 'Workspace' }

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button type="button" onClick={onToggleMobileMenu} aria-label="Open navigation menu" className="mobile-menu"><Menu size={17} /></button>
        <span>{activeRoute.category}</span><ChevronRight size={13} /><strong>{activeRoute.title}</strong>
      </div>
      <div className="topbar-right">
        <button className="command" type="button"><span>Quick command</span><kbd>⌘ K</kbd></button>
        <span className="top-divider" />
        <span className="version-tag"><Terminal size={11} /> v0.1.0</span>
        <button className="avatar" type="button" aria-label="Operator profile">TB</button>
      </div>
    </header>
  )
}
