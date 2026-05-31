import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, useAuth } from '../context'
import { api } from '../api'
import s from './Checkout.module.css'

export default function Checkout() {
  const {cart, total, dispatch} = useCart()
  const {user} = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=datos, 2=pago
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pedidoData, setPedidoData] = useState(null)
  const [form, setForm] = useState({
    nombre_cliente: user?.nombre||'', email: user?.email||'',
    telefono:'', direccion:'', ciudad:'', provincia:'', codigo_postal:'', notas:''
  })

  const set = f => e => setForm(p=>({...p,[f]:e.target.value}))

  if (cart.length===0) return (
    <div className={s.empty}>
      <div style={{fontSize:'3rem'}}>🛒</div>
      <h2>Tu carrito está vacío</h2>
      <a href="/#productos" className="btn-primary" style={{marginTop:'1rem'}}>Ver Productos</a>
    </div>
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const pedido = {
        ...form,
        items: cart.map(i=>({producto_id:i.id,nombre_producto:i.nombre,cantidad:i.qty,precio:parseFloat(i.precio_oferta??i.precio)}))
      }
      const res = await api.createPedido(pedido)
      setPedidoData(res)
      setStep(2)
    } catch(err) { setError(err.message) }
    finally { setLoading(false) }
  }

  function goMercadoPago() {
    if (pedidoData?.sandbox_init_point) {
      dispatch({type:'CLEAR'})
      window.location.href = pedidoData.sandbox_init_point
    }
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <a href="/" className={s.backLink}>← Couco Aromas</a>
        <h1 className={s.title}>Finalizar Compra</h1>
        <div className={s.steps}>
          <span className={`${s.step} ${step>=1?s.stepActive:''}`}>1. Datos</span>
          <span className={s.stepLine}/>
          <span className={`${s.step} ${step>=2?s.stepActive:''}`}>2. Pago</span>
        </div>
      </div>

      <div className={s.layout}>
        {/* FORMULARIO */}
        {step===1 && (
          <form onSubmit={handleSubmit} className={s.formSide}>
            <h2 className={s.sectionTitle}>Datos de envío</h2>
            <div className={s.row}>
              <div className="form-group"><label>Nombre completo *</label><input required value={form.nombre_cliente} onChange={set('nombre_cliente')}/></div>
              <div className="form-group"><label>Email *</label><input type="email" required value={form.email} onChange={set('email')}/></div>
            </div>
            <div className={s.row}>
              <div className="form-group"><label>Teléfono</label><input value={form.telefono} onChange={set('telefono')}/></div>
              <div className="form-group"><label>Código Postal</label><input value={form.codigo_postal} onChange={set('codigo_postal')}/></div>
            </div>
            <div className="form-group"><label>Dirección *</label><input required value={form.direccion} onChange={set('direccion')} placeholder="Calle y número"/></div>
            <div className={s.row}>
              <div className="form-group"><label>Ciudad *</label><input required value={form.ciudad} onChange={set('ciudad')}/></div>
              <div className="form-group"><label>Provincia *</label><input required value={form.provincia} onChange={set('provincia')}/></div>
            </div>
            <div className="form-group"><label>Notas del pedido</label><textarea value={form.notas} onChange={set('notas')} placeholder="Instrucciones especiales..."/></div>
            {error && <div className="msg-error">{error}</div>}
            <button type="submit" className="btn-primary" style={{width:'100%'}} disabled={loading}>
              {loading ? 'Procesando...' : 'Continuar al Pago →'}
            </button>
          </form>
        )}

        {/* PAGO MERCADOPAGO */}
        {step===2 && pedidoData && (
          <div className={s.formSide}>
            <h2 className={s.sectionTitle}>Elige cómo pagar</h2>
            <div className={s.mpBox}>
              <div className={s.mpLogo}>💳</div>
              <h3 className={s.mpTitle}>Pagar con MercadoPago</h3>
              <p className={s.mpDesc}>Tarjeta de crédito/débito, transferencia, efectivo y más. Proceso 100% seguro.</p>
              <div className={s.mpMethods}>
                {['💳 Crédito/Débito','🏦 Transferencia','💵 Efectivo','📱 Cuenta MP'].map(m=><span key={m} className={s.mpMethod}>{m}</span>)}
              </div>
              <button className={s.mpBtn} onClick={goMercadoPago}>
                <span>Pagar ${total.toFixed(2)}</span>
                <span style={{fontSize:'.7rem',opacity:.8}}>Ir a MercadoPago →</span>
              </button>
              <p className={s.mpSafe}>🔒 Pago seguro · Tu información está protegida</p>
            </div>
            <div className={s.pedidoRef}>Pedido #{pedidoData.pedido_id} creado</div>
          </div>
        )}

        {/* RESUMEN */}
        <div className={s.summary}>
          <h2 className={s.sectionTitle}>Tu pedido</h2>
          {cart.map(item=>(
            <div key={item.id} className={s.sumItem}>
              <div className={s.sumImg}>{item.imagen?<img src={'/api'+item.imagen} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'✨'}</div>
              <div className={s.sumInfo}>
                <div className={s.sumName}>{item.nombre}</div>
                <div className={s.sumQty}>x{item.qty}</div>
              </div>
              <div className={s.sumPrice}>${((item.precio_oferta??item.precio)*item.qty).toFixed(2)}</div>
            </div>
          ))}
          <div className={s.sumDivider}/>
          <div className={s.sumRow}><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className={s.sumRow}><span>Envío</span><span style={{color:'var(--copper)'}}>A calcular</span></div>
          <div className={`${s.sumRow} ${s.sumTotal}`}><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  )
}
