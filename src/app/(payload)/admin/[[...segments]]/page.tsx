'use client'

import { useState, useEffect } from 'react'

interface NavigationLink {
  id: string
  label: string
  url: string
  openInNewTab: boolean
  order: number
}

interface NavigationData {
  id: string
  title: string
  area: string
  links: NavigationLink[]
  isActive: boolean
}

export default function AdminPage() {
  const [navigationData, setNavigationData] = useState<NavigationData[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState<NavigationLink | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLink, setEditingLink] = useState<NavigationLink | null>(null)
  const [newLink, setNewLink] = useState({
    label: '',
    url: '',
    openInNewTab: false
  })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetchNavigation()
  }, [])

  const fetchNavigation = async () => {
    try {
      const response = await fetch('/api/navigation')
      const result = await response.json()
      setNavigationData(result.data || [])
    } catch (error) {
      console.error('Error fetching navigation:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateNavigation = async (action: string, data: any) => {
    setSaveStatus('saving')
    try {
      const response = await fetch('/api/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      })
      const result = await response.json()
      if (result.success) {
        setNavigationData(result.data)
        setSaveStatus('saved')
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Error updating navigation:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDragStart = (e: React.DragEvent, link: NavigationLink) => {
    setDraggedItem(link)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const targetId = e.currentTarget.getAttribute('data-link-id')
    if (targetId) {
      setDragOverItem(targetId)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the container, not moving between children
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOverItem(null)
    
    const targetId = e.currentTarget.getAttribute('data-link-id')
    if (!draggedItem || !targetId || draggedItem.id === targetId) {
      setDraggedItem(null)
      return
    }

    const nav = navigationData.find(n => n.area === 'footer')
    if (!nav) return

    const newLinks = [...nav.links]
    const draggedIndex = newLinks.findIndex(link => link.id === draggedItem.id)
    const targetIndex = newLinks.findIndex(link => link.id === targetId)

    // Remove dragged item and insert at new position
    newLinks.splice(draggedIndex, 1)
    newLinks.splice(targetIndex, 0, draggedItem)

    // Update order numbers
    const reorderedLinks = newLinks.map((link, index) => ({
      ...link,
      order: index + 1
    }))

    updateNavigation('updateOrder', { navId: nav.id, links: reorderedLinks })
    setDraggedItem(null)
  }

  const handleAddLink = async () => {
    if (!newLink.label || !newLink.url) return

    await updateNavigation('addLink', {
      navId: '1',
      label: newLink.label,
      url: newLink.url,
      openInNewTab: newLink.openInNewTab
    })

    setNewLink({ label: '', url: '', openInNewTab: false })
    setShowAddForm(false)
  }

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      await updateNavigation('deleteLink', { navId: '1', linkId })
    }
  }

  const handleEditLink = async (link: NavigationLink) => {
    setEditingLink(link)
  }

  const handleSaveEdit = async () => {
    if (!editingLink) return

    await updateNavigation('updateLink', {
      navId: '1',
      linkId: editingLink.id,
      updates: {
        label: editingLink.label,
        url: editingLink.url,
        openInNewTab: editingLink.openInNewTab
      }
    })

    setEditingLink(null)
  }

  const styles = {
    container: { 
      padding: '2rem', 
      paddingTop: '3rem',
      fontFamily: 'system-ui', 
      maxWidth: '1200px', 
      margin: '0 auto',
      position: 'relative' as const,
      zIndex: 1
    },
    header: { 
      fontSize: '2rem', 
      fontWeight: 'bold', 
      marginBottom: '1rem' 
    },
    card: { 
      backgroundColor: '#fff', 
      border: '1px solid #e5e7eb', 
      borderRadius: '8px', 
      padding: '1.5rem', 
      marginBottom: '1rem' 
    },
    linkItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      marginBottom: '0.5rem',
      cursor: 'move',
      border: '2px solid transparent',
      transition: 'all 0.2s ease'
    },
    linkItemDragging: {
      opacity: 0.5,
      transform: 'scale(1.02)',
      borderColor: '#3b82f6'
    },
    linkItemDragOver: {
      borderTop: '3px solid #3b82f6',
      marginTop: '3px',
      transform: 'translateY(3px)',
      transition: 'all 0.2s ease'
    },
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      margin: '0.25rem'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    input: {
      padding: '0.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      width: '100%',
      marginBottom: '0.5rem'
    },
    checkbox: {
      marginRight: '0.5rem'
    },
    saveIndicator: {
      position: 'fixed' as const,
      top: '1rem',
      right: '1rem',
      padding: '0.75rem 1rem',
      borderRadius: '6px',
      fontSize: '0.875rem',
      fontWeight: '500',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease'
    },
    saveIndicatorSaving: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      border: '1px solid #f59e0b'
    },
    saveIndicatorSaved: {
      backgroundColor: '#d1fae5',
      color: '#065f46',
      border: '1px solid #10b981'
    },
    saveIndicatorError: {
      backgroundColor: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #ef4444'
    }
  }

  if (loading) {
    return <div style={styles.container}>Loading...</div>
  }

  const footerNav = navigationData.find(nav => nav.area === 'footer')

  return (
    <div style={styles.container}>
      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div style={{
          ...styles.saveIndicator,
          ...(saveStatus === 'saving' ? styles.saveIndicatorSaving : 
              saveStatus === 'saved' ? styles.saveIndicatorSaved : 
              styles.saveIndicatorError)
        }}>
          {saveStatus === 'saving' && (
            <>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid #f59e0b', 
                borderTop: '2px solid transparent', 
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Saving...
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <span style={{ fontSize: '16px' }}>✓</span>
              Saved!
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <span style={{ fontSize: '16px' }}>✗</span>
              Error saving
            </>
          )}
        </div>
      )}

      {/* Add CSS animation for spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={styles.header}>Footer Navigation Manager</h1>
        <p style={{ color: '#6b7280' }}>Drag and drop to reorder • Click to edit • Add or remove links</p>
      </div>

      {footerNav && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{footerNav.title}</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{...styles.button, ...styles.primaryButton}}
            >
              {showAddForm ? 'Cancel' : '+ Add New Link'}
            </button>
          </div>

          {/* Add Link Form */}
          {showAddForm && (
            <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '6px', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>Add New Link</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <input
                  style={styles.input}
                  placeholder="Label (e.g., Proyectos)"
                  value={newLink.label}
                  onChange={(e) => setNewLink({...newLink, label: e.target.value})}
                />
                <input
                  style={styles.input}
                  placeholder="URL (e.g., /proyectos)"
                  value={newLink.url}
                  onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={newLink.openInNewTab}
                    onChange={(e) => setNewLink({...newLink, openInNewTab: e.target.checked})}
                  />
                  Open in new tab
                </label>
              </div>
              <button
                onClick={handleAddLink}
                style={{...styles.button, ...styles.primaryButton}}
                disabled={!newLink.label || !newLink.url}
              >
                Add Link
              </button>
            </div>
          )}

          {/* Links List */}
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '600' }}>
              Links ({footerNav.links.length})
            </h3>
            
            {footerNav.links
              .sort((a, b) => a.order - b.order)
              .map((link) => (
                <div
                  key={link.id}
                  draggable
                  data-link-id={link.id}
                  onDragStart={(e) => handleDragStart(e, link)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    ...styles.linkItem,
                    ...(draggedItem?.id === link.id ? styles.linkItemDragging : {}),
                    ...(dragOverItem === link.id && draggedItem?.id !== link.id ? styles.linkItemDragOver : {})
                  }}
                >
                  {editingLink?.id === link.id ? (
                    // Edit Mode
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                      <input
                        style={styles.input}
                        value={editingLink.label}
                        onChange={(e) => setEditingLink({...editingLink, label: e.target.value})}
                      />
                      <input
                        style={styles.input}
                        value={editingLink.url}
                        onChange={(e) => setEditingLink({...editingLink, url: e.target.value})}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                        <input
                          type="checkbox"
                          style={styles.checkbox}
                          checked={editingLink.openInNewTab}
                          onChange={(e) => setEditingLink({...editingLink, openInNewTab: e.target.checked})}
                        />
                        New tab
                      </label>
                    </div>
                  ) : (
                    // View Mode
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.5rem', cursor: 'grab' }}>⋮⋮</span>
                        <div>
                          <strong>{link.label}</strong>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {link.url} {link.openInNewTab && '(new tab)'}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' }}>
                          Order: {link.order}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {editingLink?.id === link.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          style={{...styles.button, ...styles.primaryButton}}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingLink(null)}
                          style={{...styles.button, ...styles.secondaryButton}}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditLink(link)}
                          style={{...styles.button, ...styles.secondaryButton}}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          style={{...styles.button, ...styles.dangerButton}}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Live Preview */}
      <div style={styles.card}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
          Live Preview (Footer Links)
        </h3>
        <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {footerNav?.links
              .sort((a, b) => a.order - b.order)
              .map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target={link.openInNewTab ? '_blank' : undefined}
                  style={{ 
                    textDecoration: 'underline', 
                    color: '#3b82f6',
                    fontSize: '0.875rem'
                  }}
                >
                  {link.label}
                </a>
              ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '0.875rem' }}>
        <strong>💡 How to use:</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>Drag the ⋮⋮ handle to reorder links</li>
          <li>Click "Edit" to modify link text and URLs</li>
          <li>Click "Delete" to remove links</li>
          <li>Click "+ Add New Link" to create new menu items</li>
          <li>Changes are saved automatically and appear on your website immediately</li>
        </ul>
      </div>
    </div>
  )
} 