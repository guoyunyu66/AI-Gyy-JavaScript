'use client'

import React from 'react'
import { DashboardLayout as DashboardLayoutComponent } from '@/module/dashboard/dashboard-layout' // Renamed import

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // This layout now simply wraps the children with the main dashboard layout component
  return (
    <DashboardLayoutComponent>
      {children}
    </DashboardLayoutComponent>
  )
} 