/**
 * Sidebar Component
 * Responsibility: Persistent navigation sidebar displaying links to Dashboard,
 * Search Lab, Fetch Lab, Agent Lab, Run History, and Settings.
 */
import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Search, Globe, Bot, History, Settings as SettingsIcon, X, ChevronLeft, Server } from 'lucide-react'
import { Mascot } from 'page-mascot'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/search', label: 'Search Lab', icon: Search },
  { path: '/fetch', label: 'Fetch Lab', icon: Globe },
  { path: '/agent', label: 'Agent Lab', icon: Bot },
  { path: '/history', label: 'Run History', icon: History },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar({ onCloseMobile, mobileOpen = false }) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-top">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="brand"
        >
          <div className="brand-mascot-container">
            <Mascot
              directions="/mascots/bunny-directions.webp"
              reactions="/mascots/bunny-reactions.webp"
              size={40}
              label="TinyBunny mascot"
              className="bunny-mascot-actor"
            />
          </div>
          <div className="brand-copy"><strong>TinyBunny</strong><span>WEB INTELLIGENCE STUDIO</span></div>
        </NavLink>
        {onCloseMobile && (
          <button type="button" onClick={onCloseMobile} aria-label="Close navigation sidebar" className="mobile-close"><X size={17} /></button>
        )}
        <button type="button" className="sidebar-collapse" aria-label="Collapse navigation"><ChevronLeft size={15} /></button>
      </div>

      <nav aria-label="Main Navigation">
        <div className="nav-label">CORE WORKSPACES</div>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {({ isActive }) => (
                <>
                  {isActive && <i />}
                  <Icon size={17} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-status">
        <span className="status-orb" />
        <div><strong>TinyBunny Studio</strong><span>Local developer environment</span></div>
        <Server size={15} />
      </div>
    </aside>
  )
}
