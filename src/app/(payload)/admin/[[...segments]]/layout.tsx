export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#fafafa',
      position: 'relative',
      zIndex: 1
    }}>
      {children}
    </div>
  )
} 