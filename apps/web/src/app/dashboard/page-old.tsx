'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Navigation from '@/components/Navigation'
import EscrowCard from '@/components/EscrowCard'
import Link from 'next/link'

interface Property {
  id: string
  address: string
  propertyType: string
  size: number
  monthlyRent: number
  depositAmount: number
  prepaidRent: number
  currency: string
  moveInDate?: string
  status: string
  createdAt: string
  escrows: Array<{
    id: string
    status: string
    buyer: {
      firstName: string
      lastName: string
      email: string
    }
  }>
  invitations: Array<{
    id: string
    status: string
    type: string
    createdAt: string
  }>
}

interface DraftContract {
  id: string
  title: string
  data: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Escrow {
  id: string
  amount: string
  currency: string
  status: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED'
  property?: {
    title: string
    address: string
    moveInDate?: string
  }
  propertyTitle?: string
  propertyAddress?: string
  buyer: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  seller: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  payproffHostedUrl?: string
  createdAt: string
  fundedAt?: string
  releasedAt?: string
  plannedReleaseDate?: string
}

interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  property: {
    id: string
    address: string
    moveInDate?: string
  }
  status: 'INVITED' | 'ACCEPTED' | 'ACTIVE' | 'MOVED_OUT'
  invitationDate?: string
  moveInDate?: string
  moveOutDate?: string
  leaseEndDate?: string
  nestStatus?: 'CREATED' | 'FUNDED' | 'RELEASED'
  nestAmount?: number
  currency?: string
  source: 'INVITATION' | 'NEST' | 'CONTRACT'
  // Rental details
  monthlyRent?: number
  depositAmount?: number
  prepaidRentAmount?: number
  totalRentPaid?: number
  daysLived?: number
  contractStartDate?: string
  contractEndDate?: string
}

// Function to aggregate tenant data from multiple sources
const aggregateTenantsData = (properties: Property[], escrows: Escrow[], contracts: DraftContract[]): Tenant[] => {
  const tenantMap = new Map<string, Tenant>()

  // Add tenants from property invitations
  properties.forEach(property => {
    property.invitations?.forEach(invitation => {
      if (invitation.status === 'ACCEPTED' && invitation.type === 'TENANT') {
        const tenantKey = `${invitation.id}-invitation`
        if (!tenantMap.has(tenantKey)) {
          tenantMap.set(tenantKey, {
            id: invitation.id,
            firstName: 'Lejer', // This would come from invitation data if available
            lastName: '',
            email: '', // This would come from invitation data if available
            property: {
              id: property.id,
              address: property.address,
              moveInDate: property.moveInDate
            },
            status: 'ACCEPTED',
            invitationDate: invitation.createdAt,
            source: 'INVITATION'
          })
        }
      }
    })
  })

  // Add tenants from active nests (escrows)
  escrows.forEach(escrow => {
    const tenantKey = `${escrow.buyer.id}-nest`
    const existingTenant = Array.from(tenantMap.values()).find(t => t.email === escrow.buyer.email)
    
    if (existingTenant) {
      // Update existing tenant with nest info
      existingTenant.nestStatus = escrow.status
      existingTenant.nestAmount = parseFloat(escrow.amount)
      existingTenant.currency = escrow.currency
      existingTenant.firstName = escrow.buyer.firstName
      existingTenant.lastName = escrow.buyer.lastName
      existingTenant.email = escrow.buyer.email
      if (escrow.status === 'FUNDED' || escrow.status === 'RELEASED') {
        existingTenant.status = 'ACTIVE'
      }
    } else {
      // Create new tenant from nest data
      tenantMap.set(tenantKey, {
        id: escrow.buyer.id,
        firstName: escrow.buyer.firstName,
        lastName: escrow.buyer.lastName,
        email: escrow.buyer.email,
        property: {
          id: '',
          address: escrow.propertyAddress || escrow.property?.address || 'Ukendt adresse',
          moveInDate: escrow.property?.moveInDate
        },
        status: escrow.status === 'FUNDED' ? 'ACTIVE' : 'ACCEPTED',
        nestStatus: escrow.status,
        nestAmount: parseFloat(escrow.amount),
        currency: escrow.currency,
        source: 'NEST'
      })
    }
  })

  return Array.from(tenantMap.values())
}

// Lejer Card Component
interface LejerCardProps {
  tenant: Tenant
  onContact?: (tenant: Tenant) => void
}

const LejerCard: React.FC<LejerCardProps> = ({ tenant, onContact }) => {
  const getStatusBadge = (status: string) => {
    const statusStyles = {
      INVITED: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      ACCEPTED: 'bg-blue-100 text-blue-800 border border-blue-200',
      ACTIVE: 'bg-green-100 text-green-800 border border-green-200',
      MOVED_OUT: 'bg-gray-100 text-gray-800 border border-gray-200'
    }
    
    const statusLabels = {
      INVITED: 'Inviteret',
      ACCEPTED: 'Accepteret',
      ACTIVE: 'Aktiv',
      MOVED_OUT: 'Fraflyttet'
    }
    
    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.INVITED
    const label = statusLabels[status as keyof typeof statusLabels] || status
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
        {label}
      </span>
    )
  }

  const getNestStatusBadge = (status?: string) => {
    if (!status) return null
    
    const statusStyles = {
      CREATED: 'bg-blue-100 text-blue-800',
      FUNDED: 'bg-green-100 text-green-800',
      RELEASED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    
    const statusLabels = {
      CREATED: 'Oprettet',
      FUNDED: 'Finansieret',
      RELEASED: 'Frigivet',
      CANCELLED: 'Annulleret'
    }
    
    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.CREATED
    const label = statusLabels[status as keyof typeof statusLabels] || status
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
        🪺 {label}
      </span>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white via-white to-slate-50/30 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Tenant Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {tenant.firstName} {tenant.lastName}
          </h3>
          <div className="space-y-1">
            <p className="text-slate-600 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {tenant.email}
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {tenant.property.address}
            </p>
          </div>
        </div>
        <div className="text-right space-y-2">
          {getStatusBadge(tenant.status)}
          {tenant.nestStatus && getNestStatusBadge(tenant.nestStatus)}
        </div>
      </div>

      {/* Tenant Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {tenant.property.moveInDate && (
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-slate-600 text-xs mb-1">Indflytning</p>
            <p className="font-semibold text-slate-800 text-sm">
              {new Date(tenant.property.moveInDate).toLocaleDateString('da-DK')}
            </p>
          </div>
        )}
        {tenant.nestAmount && (
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-green-600 text-xs mb-1">Nest Beløb</p>
            <p className="font-semibold text-green-800">
              {tenant.nestAmount.toLocaleString()} {tenant.currency}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        {tenant.email && (
          <a
            href={`mailto:${tenant.email}`}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-center text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Kontakt
          </a>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            
            // Create modal using DOM API
            const modal = document.createElement('div')
            modal.style.position = 'fixed'
            modal.style.top = '0'
            modal.style.left = '0'
            modal.style.width = '100%'
            modal.style.height = '100%'
            modal.style.backgroundColor = 'rgba(0,0,0,0.8)'
            modal.style.display = 'flex'
            modal.style.alignItems = 'center'
            modal.style.justifyContent = 'center'
            modal.style.zIndex = '9999'
            
            // Calculate dates and durations
            const moveInDate = tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString('da-DK') : 'Ikke angivet'
            const contractEndDate = tenant.contractEndDate ? new Date(tenant.contractEndDate).toLocaleDateString('da-DK') : 'Ikke angivet'
            const daysLived = tenant.daysLived || 0
            const monthsLived = Math.floor(daysLived / 30.44)
            
            // Create HTML content using string concatenation to avoid template literal issues
            let htmlContent = '<div style="background: white; border-radius: 20px; max-width: 800px; width: 95%; max-height: 90vh; overflow-y: auto;">'
            htmlContent += '<div style="padding: 24px; border-bottom: 1px solid #e2e8f0; background: linear-gradient(to right, #f8fafc, #f1f5f9); border-radius: 20px 20px 0 0;">'
            htmlContent += '<div style="display: flex; justify-content: space-between; align-items: center;">'
            htmlContent += '<div><h2 style="font-size: 24px; font-weight: bold; margin: 0 0 8px 0; color: #1e293b;">' + tenant.firstName + ' ' + tenant.lastName + '</h2>'
            htmlContent += '<p style="color: #64748b; margin: 0;">' + tenant.property.address + '</p></div>'
            htmlContent += '<button onclick="this.closest(\'div[style*=\\\"position: fixed\\\"]\').remove()" style="padding: 8px; background: none; border: none; border-radius: 50%; cursor: pointer; font-size: 24px;">✕</button>'
            htmlContent += '</div></div>'
            
            // Content section
            htmlContent += '<div style="padding: 24px;">'
            htmlContent += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">'
            
            // Contact info section
            htmlContent += '<div style="background: #dbeafe; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px;">'
            htmlContent += '<h3 style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">👤 Kontakt Information</h3>'
            htmlContent += '<div><div style="margin-bottom: 12px;"><span style="color: #2563eb; font-size: 14px; font-weight: 500;">Navn:</span>'
            htmlContent += '<p style="color: #1e293b; margin: 4px 0 0 0;">' + tenant.firstName + ' ' + tenant.lastName + '</p></div>'
            htmlContent += '<div style="margin-bottom: 12px;"><span style="color: #2563eb; font-size: 14px; font-weight: 500;">Email:</span>'
            htmlContent += '<p style="color: #1e293b; margin: 4px 0 0 0;">' + tenant.email + '</p></div>'
            
            // Phone section if exists
            if (tenant.phone) {
              htmlContent += '<div style="margin-bottom: 12px;"><span style="color: #2563eb; font-size: 14px; font-weight: 500;">Telefon:</span>'
              htmlContent += '<p style="color: #1e293b; margin: 4px 0 0 0;">' + tenant.phone + '</p></div>'
            }
            
            htmlContent += '<div><span style="color: #2563eb; font-size: 14px; font-weight: 500;">Status:</span>'
            htmlContent += '<div style="margin-top: 4px;"><span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; background: #dcfce7; color: #166534;">'
            const statusText = tenant.status === 'ACTIVE' ? 'Aktiv' : tenant.status === 'ACCEPTED' ? 'Accepteret' : tenant.status === 'MOVED_OUT' ? 'Fraflyttet' : 'Inviteret'
            htmlContent += statusText + '</span></div></div></div></div>'
            
            // Lease period section
            htmlContent += '<div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px;">'
            htmlContent += '<h3 style="color: #166534; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">📅 Lejeperiode</h3>'
            htmlContent += '<div><div style="margin-bottom: 12px;"><span style="color: #16a34a; font-size: 14px; font-weight: 500;">Indflytningsdato:</span>'
            htmlContent += '<p style="color: #1e293b; margin: 4px 0 0 0;">' + moveInDate + '</p></div>'
            htmlContent += '<div style="margin-bottom: 12px;"><span style="color: #16a34a; font-size: 14px; font-weight: 500;">Kontraktudløb:</span>'
            htmlContent += '<p style="color: #1e293b; margin: 4px 0 0 0;">' + contractEndDate + '</p></div>'
            htmlContent += '<div style="margin-bottom: 12px;"><span style="color: #16a34a; font-size: 14px; font-weight: 500;">Opholdstid:</span>'
            htmlContent += '<p style="color: #1e293b; margin: 4px 0 0 0;">' + monthsLived + ' måneder (' + daysLived + ' dage)</p></div></div></div></div>'
            
            // Economy section
            const monthlyRent = tenant.monthlyRent ? tenant.monthlyRent.toLocaleString() : '15.000'
            const nestAmount = tenant.nestAmount ? tenant.nestAmount.toLocaleString() : '45.000'
            const totalRent = tenant.totalRentPaid ? tenant.totalRentPaid.toLocaleString() : (monthsLived * 15000).toLocaleString()
            
            htmlContent += '<div style="margin-bottom: 32px;"><h3 style="color: #7c3aed; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">💰 Økonomi</h3>'
            htmlContent += '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;">'
            htmlContent += '<div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 24px;">'
            htmlContent += '<h4 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">💸 Månedlig Husleje</h4>'
            htmlContent += '<div style="font-size: 28px; font-weight: bold; color: #78350f; margin-bottom: 8px;">' + monthlyRent + ' DKK</div>'
            htmlContent += '<p style="color: #a16207; font-size: 14px; margin: 0;">Per måned</p></div>'
            htmlContent += '<div style="background: #fae8ff; border: 1px solid #e879f9; border-radius: 12px; padding: 24px;">'
            htmlContent += '<h4 style="color: #a21caf; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">🏦 Depositum</h4>'
            htmlContent += '<div style="margin-bottom: 8px;"><span style="font-size: 20px; font-weight: bold; color: #86198f;">' + nestAmount + ' DKK</span></div></div>'
            htmlContent += '<div style="background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 12px; padding: 24px;">'
            htmlContent += '<h4 style="color: #065f46; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">📊 Total Husleje Betalt</h4>'
            htmlContent += '<div style="font-size: 28px; font-weight: bold; color: #065f46; margin-bottom: 8px;">' + totalRent + ' DKK</div>'
            htmlContent += '<p style="color: #047857; font-size: 14px; margin: 0;">I ' + monthsLived + ' måneder</p></div></div></div>'
            
            // Nest status section
            const nestStatusText = tenant.nestStatus === 'FUNDED' ? 'sikret i fælles Nest og klar til frigivelse' : 
                                   tenant.nestStatus === 'RELEASED' ? 'blevet frigivet fra Nest' : 'under behandling'
            const nestStatusLabel = tenant.nestStatus === 'FUNDED' ? '✅ Aktiv Nest' : 
                                   tenant.nestStatus === 'RELEASED' ? '🔓 Nest Frigivet' : '⏳ Afventer Indbetaling'
            
            htmlContent += '<div style="background: linear-gradient(to right, #f8fafc, #dbeafe); border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 32px;">'
            htmlContent += '<h3 style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">🪺 Nest Status</h3>'
            htmlContent += '<div><p style="color: #475569; margin: 0 0 8px 0;">Depositum på ' + nestAmount + ' DKK er ' + nestStatusText + '</p>'
            htmlContent += '<div style="padding: 12px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">'
            htmlContent += '<span style="font-weight: 600; color: #1e293b;">Status: </span>'
            htmlContent += '<span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #166534;">' + nestStatusLabel + '</span>'
            htmlContent += '</div></div></div>'
            
            // Action buttons
            htmlContent += '<div style="display: flex; gap: 16px; padding-top: 16px; border-top: 1px solid #cbd5e1;">'
            htmlContent += '<a href="mailto:' + tenant.email + '" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 8px;">📧 Send Email</a>'
            
            if (tenant.phone) {
              htmlContent += '<a href="tel:' + tenant.phone + '" style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 12px; font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 8px;">📞 Ring Op</a>'
            }
            
            htmlContent += '<button onclick="this.closest(\'div[style*=\\\"position: fixed\\\"]\').remove()" style="background: #e2e8f0; color: #475569; padding: 12px 24px; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">Luk</button>'
            htmlContent += '</div></div></div>'
            
            modal.innerHTML = htmlContent
            
            document.body.appendChild(modal)
          }}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm cursor-pointer"
          type="button"
        >
          Detaljer
        </button>
      </div>

      {/* Source indicator */}
      <div className="mt-3 pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Kilde: {tenant.source === 'INVITATION' ? 'Invitation' : tenant.source === 'NEST' ? 'Nest' : 'Kontrakt'}
        </p>
      </div>
    </div>
  )
}

// Detailed Tenant Modal Component
interface TenantModalProps {
  tenant: Tenant
  isOpen: boolean
  onClose: () => void
}

const TenantModal: React.FC<TenantModalProps> = ({ tenant, isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {tenant.firstName} {tenant.lastName}
          </h2>
          <p className="text-lg mb-6">{tenant.property.address}</p>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Luk
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper functions moved outside component
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Ikke angivet'
  return new Date(dateString).toLocaleDateString('da-DK')
}

const formatCurrency = (amount: number) => {
  return (amount / 100).toLocaleString('da-DK')
}

const getEscrowStatusBadge = (status: string) => {
  const statusStyles = {
    CREATED: 'bg-blue-100 text-blue-800 border border-blue-200',
    FUNDED: 'bg-green-100 text-green-800 border border-green-200',
    RELEASED: 'bg-purple-100 text-purple-800 border border-purple-200',
    CANCELLED: 'bg-red-100 text-red-800 border border-red-200'
  }
  
  const statusLabels = {
    CREATED: 'Oprettet',
    FUNDED: 'Finansieret', 
    RELEASED: 'Frigivet',
    CANCELLED: 'Annulleret'
  }
  
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.CREATED
  const label = statusLabels[status as keyof typeof statusLabels] || status
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [draftContracts, setDraftContracts] = useState<DraftContract[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'LANDLORD') {
        const [propertiesResponse, nestEscrowsResponse, contractsResponse] = await Promise.all([
          api.get('/properties'),
          api.get('/nest/escrows'),
          api.get('/draft-contracts')
        ])

        const properties = propertiesResponse.data.properties || []
        const nestEscrows = nestEscrowsResponse.data.escrows || []
        const contracts = contractsResponse.data.contracts || []

        const aggregatedTenants = aggregateTenantsData(properties, nestEscrows, contracts)

        // Add dummy tenants for testing
        const dummyTenants: Tenant[] = [
          {
            id: 'dummy-1',
            firstName: 'Lars',
            lastName: 'Nielsen',
            email: 'lars.nielsen@email.dk',
            phone: '+45 20 30 40 50',
            property: {
              id: 'prop-1',
              address: 'Nørrebrogade 123, 2200 København N',
              moveInDate: '2023-03-01'
            },
            status: 'ACTIVE',
            invitationDate: '2023-02-15',
            moveInDate: '2023-03-01',
            nestStatus: 'FUNDED',
            nestAmount: 45000,
            currency: 'DKK',
            monthlyRent: 15000,
            source: 'NEST',
            totalRentPaid: 240000,
            contractEndDate: '2024-03-01',
            daysLived: 365
          },
          {
            id: 'dummy-2', 
            firstName: 'Maria',
            lastName: 'Petersen',
            email: 'maria.petersen@email.dk',
            phone: '+45 30 40 50 60',
            property: {
              id: 'prop-2',
              address: 'Vesterbrogade 456, 1620 København V',
              moveInDate: '2023-06-15'
            },
            status: 'ACTIVE',
            invitationDate: '2023-06-01',
            moveInDate: '2023-06-15',
            nestStatus: 'RELEASED',
            nestAmount: 36000,
            currency: 'DKK',
            monthlyRent: 12000,
            source: 'INVITATION',
            totalRentPaid: 144000,
            contractEndDate: '2024-06-15',
            daysLived: 245
          },
          {
            id: 'dummy-3',
            firstName: 'Thomas',
            lastName: 'Andersen', 
            email: 'thomas.andersen@email.dk',
            phone: null,
            property: {
              id: 'prop-3',
              address: 'Østerbrogade 789, 2100 København Ø',
              moveInDate: '2023-09-01'
            },
            status: 'ACCEPTED',
            invitationDate: '2023-08-15',
            moveInDate: '2023-09-01',
            nestStatus: 'FUNDED',
            nestAmount: 42000,
            currency: 'DKK',
            monthlyRent: 14000,
            source: 'NEST',
            totalRentPaid: 126000,
            contractEndDate: '2024-09-01',
            daysLived: 137
          }
        ]
        
        const allTenants = [...aggregatedTenants, ...dummyTenants]
        setTenants(allTenants)
        setProperties(properties)
        setEscrows(escrows)
        setDraftContracts(contracts)

        // Don't auto-redirect - let users see the dashboard even if empty
      } else {
        // Fetch only escrows for tenants
        const response = await api.get('/escrow')
        setEscrows(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }


  const handleReleaseEscrow = async (escrowId: string) => {
    try {
      await api.patch(`/escrow/${escrowId}/release`)
    } catch (error) {
      console.error('Failed to release escrow:', error)
    }
  }

  const handleDeleteContract = async (contractId: string, contractTitle: string) => {
    if (confirm(`Er du sikker på at du vil slette kontrakten "${contractTitle}"?`)) {
      try {
        await api.delete(`/draft-contracts/${contractId}`)
        // Refresh data after deletion
        fetchDashboardData()
      } catch (error) {
        console.error('Failed to delete contract:', error)
        alert('Fejl ved sletning af kontrakt. Prøv igen.')
      }
    }
  }

  const handleGeneratePDF = async (contractData: any) => {
    try {
      const response = await api.post('/lease-contract/generate-pdf', contractData, {
        responseType: 'blob'
      })
      
      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const address = contractData?.property?.address || contractData?.ejendom?.adresse || 'kontrakt'
      a.download = `lejekontrakt-${address.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Fejl ved generering af PDF. Kontroller at alle obligatoriske felter er udfyldt.')
    }
  }

  const handleSendEmail = async (contractData: any) => {
    const email = prompt('Indtast email adresse:')
    if (!email) return

    try {
      await api.post('/lease-contract/send-email', {
        ...contractData,
        recipientEmail: email
      })
      alert('Email sendt!')
    } catch (error) {
      console.error('Email sending error:', error)
      alert('Fejl ved afsendelse af email.')
    }
  }

  const handleTenantDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTenant(null)
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      ACCEPTED: 'bg-green-100 text-green-800 border border-green-200', 
      DECLINED: 'bg-red-100 text-red-800 border border-red-200',
      EXPIRED: 'bg-gray-100 text-gray-800 border border-gray-200'
    }
    
    const statusLabels = {
      PENDING: 'Afventer',
      ACCEPTED: 'Accepteret',
      DECLINED: 'Afvist',
      EXPIRED: 'Udløbet'
    }
    
    const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.PENDING
    const label = statusLabels[status as keyof typeof statusLabels] || status
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
        {label}
      </span>
    )
  }


  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (user?.role === 'LANDLORD') {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-slate-800">Dashboard</h1>
                  <p className="text-slate-600 mt-2">Velkommen tilbage, {user.firstName}! 👋</p>
                </div>
                {(user.role === 'LANDLORD' || user.role === 'ADMIN') && (
                  <div className="flex flex-col gap-3">
                    {/* Primary Actions */}
                    <div className="flex flex-wrap gap-3">
                      <Link 
                        href="/nest/create-simple"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        🪺 Opret Nest
                      </Link>
                      <Link 
                        href="/lease-contract/create"
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        📋 Opret Lejekontrakt
                      </Link>
                    </div>
                    
                    {/* Secondary Action */}
                    <div className="flex items-center gap-3">
                      <Link 
                        href="/properties/create"
                        className="text-sm text-slate-600 hover:text-slate-800 underline decoration-dotted transition-colors"
                      >
                        Opret bolig uden Nest
                      </Link>
                    </div>
                  </div>
                )}
                
                {(user.role === 'TENANT' || user.role === 'USER') && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3">
                      <Link 
                        href="/tenant/nest"
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        📧 Inviter Udlejer
                      </Link>
                      <Link 
                        href="/tenant/nest/proposals"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        📧 Mine Invitationer
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H19a2 2 0 012 2v0a2 2 0 01-2 2h-5M9 7h6m-6 4h6m-7 4h7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Boliger</p>
                        <p className="text-2xl font-bold text-blue-800">{properties.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Lejere</p>
                        <p className="text-2xl font-bold text-green-800">{tenants.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Aktive Nests</p>
                        <p className="text-2xl font-bold text-yellow-800">
                          {escrows.filter(escrow => escrow.status === 'FUNDED').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Kontrakter</p>
                        <p className="text-2xl font-bold text-purple-800">{(draftContracts || []).length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 14l-2-2m0 0l-2-2m2 2l-2 2m2-2l-2-2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Invitationer</p>
                        <p className="text-2xl font-bold text-orange-800">
                          {properties.reduce((total, property) => total + property.invitations.length, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-indigo-600 font-medium">Total Værdi</p>
                        <p className="text-2xl font-bold text-indigo-800">
                          {(escrows.reduce((sum, escrow) => sum + parseInt(escrow.amount), 0) / 1000).toFixed(0)}k
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Properties Section - Only show for landlords */}
                {(user.role === 'LANDLORD' || user.role === 'ADMIN') && (
                  <div id="properties-section">
                    {properties.length === 0 ? (
                      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-slate-800 mb-4">Ingen boliger endnu</h3>
                        <p className="text-slate-600 mb-6">Start med at oprette din første Nest deponering for sikker udlejning.</p>
                        <Link 
                          href="/nest/create-simple"
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          🪺 Opret Din Første Nest
                        </Link>
                      </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {properties.map((property) => (
                        <div key={property.id} className="bg-gradient-to-br from-white via-white to-blue-50/30 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                          {/* Property Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-slate-800 mb-2">{property.address}</h3>
                              <div className="space-y-1">
                                <p className="text-slate-600 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {property.propertyType} • {property.size} m²
                                </p>
                                <p className="text-slate-600 flex items-center gap-2">
                                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 9l-4 4m0 0v-3a2 2 0 00-2-2H7a2 2 0 00-2 2v3m0 0h3m5-4v4l4-4m0 0h-3a2 2 0 00-2-2v-2a2 2 0 012-2h3m0 0v3" />
                                  </svg>
                                  {formatDate(property.moveInDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(property.status)}
                            </div>
                          </div>

                          {/* Property Details */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-blue-50 rounded-lg p-3">
                              <p className="text-sm text-blue-600 font-medium">Månedlig husleje</p>
                              <p className="text-lg font-bold text-blue-800">{property.monthlyRent?.toLocaleString()} {property.currency}</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-sm text-green-600 font-medium">Depositum</p>
                              <p className="text-lg font-bold text-green-800">{property.depositAmount?.toLocaleString()} {property.currency}</p>
                            </div>
                          </div>

                          {/* Escrows for this property */}
                          <div className="bg-slate-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-2xl font-bold text-slate-800">{property.escrows?.length || 0}</p>
                                <p className="text-xs text-slate-600">Nests</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-green-600">{property.escrows?.filter(e => e.status === 'FUNDED').length || 0}</p>
                                <p className="text-xs text-slate-600">Aktive</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-purple-600">{property.escrows?.filter(e => e.status === 'RELEASED').length || 0}</p>
                                <p className="text-xs text-slate-600">Frigivet</p>
                              </div>
                            </div>

                            {/* Invitations */}
                            <div className="mb-4">
                              <h4 className="font-medium text-slate-700 mb-2">Invitationer ({property.invitations.length})</h4>
                              <div className="space-y-2">
                                {property.invitations.slice(0, 3).map((invitation) => (
                                  <div key={invitation.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-slate-100">
                                    <div>
                                      <p className="text-sm font-medium text-slate-800">{invitation.type}</p>
                                      <p className="text-xs text-slate-500">{formatDate(invitation.createdAt)}</p>
                                    </div>
                                    <div>
                                      {getStatusBadge(invitation.status)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Property Actions */}
                          <div className="flex gap-2 pt-4 border-t border-slate-200">
                            <Link
                              href={`/properties/${property.id}/invite`}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl font-medium text-center transition-all duration-300 text-sm"
                            >
                              Inviter Lejer
                            </Link>
                            <Link
                              href={`/properties/${property.id}`}
                              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-xl font-medium text-center transition-all duration-300 text-sm"
                            >
                              Detaljer
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tenants Section */}
                <div>
                  {tenants.length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-800 mb-4">Ingen lejere endnu</h3>
                      <p className="text-slate-600 mb-6">Dine lejere vil vises her når de accepterer invitationer eller opretter Nests.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {tenants.map((tenant, index) => (
                        <LejerCard
                          key={`${tenant.id}-${tenant.source}-${index}`}
                          tenant={tenant}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Lease Contracts Section - Only show for landlords */}
                {(user.role === 'LANDLORD' || user.role === 'ADMIN') && (
                  <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">📋 Lejekontrakter</h2>
                      <p className="text-slate-600 mt-1">Administrer og download dine lejekontrakter</p>
                    </div>
                    <Link 
                      href="/lease-contract/create"
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      + Ny Kontrakt
                    </Link>
                  </div>

                  {(draftContracts || []).length === 0 ? (
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-800 mb-4">Ingen kontrakter endnu</h3>
                      <p className="text-slate-600 mb-6">Start med at oprette din første lejekontrakt.</p>
                      <Link 
                        href="/lease-contract/create"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        📋 Opret Lejekontrakt
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Show all contracts (duplicates should be prevented at API level) */}
                      {(draftContracts || [])
                        .map((contract) => {
                        let contractData: any = {}
                        try {
                          contractData = JSON.parse(contract.data)
                        } catch (e) {
                          console.error('Failed to parse contract data:', e)
                        }
                        
                        return (
                          <div key={contract.id} className="bg-gradient-to-br from-white via-white to-orange-50/30 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                            {/* Contract Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">{contract.title}</h3>
                                <div className="space-y-1">
                                  <p className="text-slate-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 9l-4 4m0 0v-3a2 2 0 00-2-2H7a2 2 0 00-2 2v3m0 0h3m5-4v4l4-4m0 0h-3a2 2 0 00-2-2v-2a2 2 0 012-2h3m0 0v3" />
                                    </svg>
                                    Oprettet {formatDate(contract.createdAt)}
                                  </p>
                                  <p className="text-slate-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 9l-4 4m0 0v-3a2 2 0 00-2-2H7a2 2 0 00-2 2v3m0 0h3m5-4v4l4-4m0 0h-3a2 2 0 00-2-2v-2a2 2 0 012-2h3m0 0v3" />
                                    </svg>
                                    Opdateret {formatDate(contract.updatedAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                  {contract.status}
                                </span>
                              </div>
                            </div>

                              {/* Contract Details */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                {contractData?.economy?.monthlyRent && (
                                  <div className="bg-blue-50 rounded-lg p-3">
                                    <p className="text-sm text-blue-600 font-medium">Månedlig husleje</p>
                                    <p className="text-lg font-bold text-blue-800">{contractData.economy.monthlyRent?.toLocaleString()} DKK</p>
                                  </div>
                                )}
                                {contractData?.economy?.deposit && (
                                  <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-sm text-green-600 font-medium">Depositum</p>
                                    <p className="text-lg font-bold text-green-800">{contractData.economy.deposit?.toLocaleString()} DKK</p>
                                  </div>
                                )}
                              </div>

                            {/* Contract Actions */}
                            <div className="space-y-2 pt-4 border-t border-slate-200">
                              {/* Main Actions */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleGeneratePDF(contractData)}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-xl font-medium text-center transition-all duration-300 text-sm flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  PDF
                                </button>
                                <button
                                  onClick={() => handleSendEmail(contractData)}
                                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl font-medium text-center transition-all duration-300 text-sm flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26c.3.16.65.16.95 0L20 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Email
                                </button>
                              </div>
                              {/* Secondary Actions */}
                              <div className="flex gap-2">
                                <Link
                                  href={`/lease-contract/edit/${contract.id}`}
                                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-2 rounded-lg font-medium text-center transition-all duration-300 text-xs"
                                >
                                  Rediger
                                </Link>
                                <button
                                  onClick={() => handleDeleteContract(contract.id, contract.title)}
                                  className="flex-1 bg-red-200 hover:bg-red-300 text-red-700 px-3 py-2 rounded-lg font-medium text-center transition-all duration-300 text-xs"
                                >
                                  Slet
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <p className="text-xs text-slate-500">
                                {contractData?.property?.address || contractData?.ejendom?.adresse || 'Ingen adresse angivet'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  </div>
                )}
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tenant Modal */}
        {selectedTenant && (
          <TenantModal 
            tenant={selectedTenant}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Tenant Dashboard (simplified version)  
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-800">Mine Nests</h1>
                <p className="text-slate-600 mt-2">Velkommen tilbage, {user.firstName}! 👋</p>
              </div>
            </div>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
          ) : escrows.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 shadow-xl text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">Ingen Nests endnu</h3>
              <p className="text-slate-600 mb-6">
                Du har ikke nogen aktive Nest-indskud endnu. 
                Når du accepterer en invitation fra en udlejer, vil den vises her.
              </p>
              <p className="text-sm text-slate-500">
                Du vil modtage en email når du bliver inviteret til at oprette en Nest.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {escrows.map((escrow) => (
                <div key={escrow.id} className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">{escrow.propertyAddress}</h3>
                      <p className="text-slate-600">{formatDate(escrow.createdAt)}</p>
                    </div>
                    {getEscrowStatusBadge(escrow.status)}
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {escrow.amount.toLocaleString()} DKK
                  </p>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  )
}
