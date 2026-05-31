import { useState, useCallback, useEffect } from 'react'

export function useToast() {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const toast = useCallback((m) => { setMsg(m); setShow(true) }, [])
  useEffect(() => { if (show) { const t=setTimeout(()=>setShow(false),3000); return ()=>clearTimeout(t) } },[show])
  const ToastEl = () => <div className={`toast ${show?'show':''}`}>{msg}</div>
  return { toast, ToastEl }
}
