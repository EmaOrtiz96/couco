import { Navigate } from 'react-router-dom'
import { useAuth } from '../context'

const Loader = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'var(--font-d)',fontSize:'1.5rem',color:'var(--muted)'}}>
    Cargando...
  </div>
)

export function RequireAdmin({children}) {
  const {user,loading,isAdmin} = useAuth()
  if (loading) return <Loader/>
  if (!user) return <Navigate to="/login" replace/>
  if (!isAdmin) return <Navigate to="/" replace/>
  return children
}

export function RequireAuth({children}) {
  const {user,loading} = useAuth()
  if (loading) return <Loader/>
  if (!user) return <Navigate to="/login" replace/>
  return children
}
