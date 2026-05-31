import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context'
import { api } from '../api'
import s from './Login.module.css'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({nombre:'',email:'',password:''})
  const [forgot, setForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const {saveSession, user} = useAuth()
  const navigate = useNavigate()

  useEffect(()=>{ if(user) navigate('/') },[user])

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = mode==='login' ? await api.login({email:form.email,password:form.password}) : await api.register(form)
      saveSession(data); navigate(data.user.rol==='admin'?'/admin':'/')
    } catch(err) { setError(err.message) } finally { setLoading(false) }
  }

  async function handleForgot(e) {
    e.preventDefault(); setLoading(true)
    try { await api.forgot(forgotEmail); setForgotMsg({ok:true,text:'¡Revisa tu email! Te enviamos el enlace.'}) }
    catch(err) { setForgotMsg({ok:false,text:err.message}) } finally { setLoading(false) }
  }

  const set = f => e => setForm(p=>({...p,[f]:e.target.value}))

  return (
    <div className={s.page}>
      <div className={s.deco}>
        <div className={s.decoInner}>
          <div className={s.decoCircle}>
            <img src="/logo.png" alt="" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex'}}/>
            <div className={s.decoFb} style={{display:'none'}}><span>C</span></div>
          </div>
          <h2 className={s.decoTitle}>Bienvenido a<br/><em>Couco Aromas</em></h2>
          <p className={s.decoDesc}>Fragancias artesanales que despiertan los sentidos</p>
          <div className={s.decoTags}>{['🌸 Perfumes','🧼 Jabones','🕯️ Velas','💨 Difusores'].map(t=><span key={t} className={s.decoTag}>{t}</span>)}</div>
        </div>
      </div>

      <div className={s.formSide}>
        <div className={s.formBox}>
          <a href="/" className={s.back}>← Volver a la tienda</a>

          {!forgot ? (
            <>
              <div className={s.tabs}>
                <button className={`${s.tab} ${mode==='login'?s.active:''}`} onClick={()=>{setMode('login');setError('')}}>Iniciar Sesión</button>
                <button className={`${s.tab} ${mode==='register'?s.active:''}`} onClick={()=>{setMode('register');setError('')}}>Crear Cuenta</button>
              </div>
              <h1 className={s.title}>{mode==='login'?'Bienvenido de vuelta':'Crea tu cuenta'}</h1>
              <p className={s.sub}>{mode==='login'?'Ingresa tus datos para continuar':'Únete a la comunidad Couco Aromas'}</p>
              <form onSubmit={handleSubmit} className={s.form}>
                {mode==='register'&&<div className="form-group"><label>Nombre completo</label><input required value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre"/></div>}
                <div className="form-group"><label>Email</label><input type="email" required value={form.email} onChange={set('email')} placeholder="tu@email.com"/></div>
                <div className="form-group"><label>Contraseña</label><input type="password" required value={form.password} onChange={set('password')} placeholder={mode==='register'?'Mínimo 6 caracteres':'••••••••'}/></div>
                {error&&<div className="msg-error">{error}</div>}
                <button type="submit" className={s.submitBtn} disabled={loading}>{loading?'Cargando...':mode==='login'?'Iniciar Sesión':'Crear Cuenta'}</button>
              </form>
              {mode==='login'&&<button className={s.forgotLink} onClick={()=>setForgot(true)}>¿Olvidaste tu contraseña?</button>}
              <p className={s.switchTxt}>{mode==='login'?'¿No tienes cuenta? ':'¿Ya tienes cuenta? '}<button className={s.switchBtn} onClick={()=>{setMode(mode==='login'?'register':'login');setError('')}}>{mode==='login'?'Regístrate gratis':'Inicia sesión'}</button></p>
            </>
          ) : (
            <>
              <h1 className={s.title}>Recuperar contraseña</h1>
              <p className={s.sub}>Te enviaremos un enlace a tu email</p>
              <form onSubmit={handleForgot}>
                <div className="form-group"><label>Email</label><input type="email" required value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="tu@email.com"/></div>
                {forgotMsg&&<div className={forgotMsg.ok?'msg-success':'msg-error'}>{forgotMsg.text}</div>}
                <button type="submit" className={s.submitBtn} disabled={loading}>{loading?'Enviando...':'Enviar enlace'}</button>
              </form>
              <button className={s.forgotLink} onClick={()=>setForgot(false)}>← Volver al login</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
