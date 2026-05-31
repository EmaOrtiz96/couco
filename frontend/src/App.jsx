import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, CartProvider } from './context'
import { RequireAdmin, RequireAuth } from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Checkout from './pages/Checkout'
import { Favoritos, MisPedidos } from './pages/Extra'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"          element={<><Navbar/><Home/></>}/>
            <Route path="/login"     element={<Login/>}/>
            <Route path="/checkout"  element={<Checkout/>}/>
            <Route path="/favoritos" element={<RequireAuth><Favoritos/></RequireAuth>}/>
            <Route path="/mis-pedidos" element={<RequireAuth><MisPedidos/></RequireAuth>}/>
            <Route path="/admin"     element={<RequireAdmin><Admin/></RequireAdmin>}/>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
