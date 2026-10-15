/**
 * FeatureCard Component
 * Responsibility: Reusable card component highlighting a Studio feature or lab
 * with navigation links and status descriptions.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function FeatureCard({ title, description, icon: Icon, to, badge }) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between p-6 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-orange-500/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 shadow-sm hover:shadow-lg hover:shadow-orange-500/5"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-12 w-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-neutral-950 transition-colors">
            {Icon && <Icon className="h-6 w-6" />}
          </div>
          {badge && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-neutral-100 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center text-xs font-medium text-orange-400 group-hover:text-orange-300 gap-1.5 transition-colors">
        <span>Open Lab</span>
        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}
