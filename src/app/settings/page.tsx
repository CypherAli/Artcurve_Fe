import type { Metadata } from 'next'
import { Header }       from '@/components/layout/Header'
import { SettingsPage } from '@/components/settings/SettingsPage'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Account settings, security, and preferences.',
}

export default function Settings() {
  return (
    <div style={{ background: 'var(--ac-paper, #070707)', minHeight: '100vh' }}>
      <Header />
      <SettingsPage />
    </div>
  )
}
