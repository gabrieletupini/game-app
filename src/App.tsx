import { useEffect, useState } from 'react'
import { useGameStore } from './store/useGameStore'
import type { Lead } from './types'
import Header, { type Tab } from './components/Header'
import StatsBar from './components/StatsBar'
import KanbanBoard from './components/KanbanBoard'
import AddLeadModal from './components/AddLeadModal'
import BulkUploadModal from './components/BulkUploadModal'
import LeadDetailModal from './components/LeadDetailModal'
import LoversTable from './components/LoversTable'
import DeadLeadsTable from './components/DeadLeadsTable'
import AnalyticsView from './components/AnalyticsView'
import PriorityTable from './components/PriorityTable'
import ToastContainer from './components/Toast'
import { exportLeadsToExcel } from './services/excelService'

function App() {
    const loadData = useGameStore(state => state.loadData)
    const loading = useGameStore(state => state.loading)

    const [activeTab, setActiveTab] = useState<Tab>('funnel')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showBulkUpload, setShowBulkUpload] = useState(false)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

    useEffect(() => {
        loadData()
    }, [loadData])

    // When store updates the lead, refresh the selected lead if it's open
    const leads = useGameStore(state => state.leads)
    useEffect(() => {
        if (selectedLead) {
            const updated = leads.find(l => l.id === selectedLead.id)
            if (!updated) {
                setSelectedLead(null)
            }
        }
    }, [leads, selectedLead])

    if (loading.isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-slate-500 mt-3">{loading.message || 'Loading...'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Header
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddLead={() => setShowAddModal(true)}
                onBulkUpload={() => setShowBulkUpload(true)}
                onExport={() => exportLeadsToExcel(leads)}
            />

            <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
                {activeTab === 'funnel' && (
                    <div className="animate-fade-in">
                        <StatsBar />
                        <KanbanBoard onSelectLead={setSelectedLead} />
                        <PriorityTable onSelectLead={setSelectedLead} />
                    </div>
                )}

                {activeTab === 'lovers' && (
                    <div className="animate-fade-in">
                        <LoversTable onSelectLead={setSelectedLead} />
                    </div>
                )}

                {activeTab === 'dead' && (
                    <div className="animate-fade-in">
                        <DeadLeadsTable onSelectLead={setSelectedLead} />
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="animate-fade-in">
                        <AnalyticsView />
                    </div>
                )}
            </main>

            {/* Modals */}
            <AddLeadModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
            />

            <BulkUploadModal
                isOpen={showBulkUpload}
                onClose={() => setShowBulkUpload(false)}
            />

            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                />
            )}

            {/* Toasts */}
            <ToastContainer />
        </div>
    )
}

export default App