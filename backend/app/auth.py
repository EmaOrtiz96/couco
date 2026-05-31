import bcrypt, os
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_connection

SECRET_KEY = os.getenv("SECRET_KEY","couco-secret")
ALGORITHM  = "HS256"
EXP_HOURS  = 24 * 7
security   = HTTPBearer(auto_error=False)

def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt(12)).decode()
def verify_password(p, h):
    try: return bcrypt.checkpw(p.encode(), h.encode())
    except: return False

def create_token(data):
    pl = {**data, "exp": datetime.utcnow() + timedelta(hours=EXP_HOURS)}
    return jwt.encode(pl, SECRET_KEY, algorithm=ALGORITHM)

def _get_user_by_id(uid):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM usuarios WHERE id=%s AND activo=1",(uid,))
            return c.fetchone()
    finally: conn.close()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds: raise HTTPException(401,"No autenticado")
    try: payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError: raise HTTPException(401,"Token inválido o expirado")
    user = _get_user_by_id(payload.get("sub"))
    if not user: raise HTTPException(401,"Usuario no encontrado")
    return user

def get_current_user_optional(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds: return None
    try: return get_current_user(creds)
    except: return None

def require_admin(user=Depends(get_current_user)):
    if user["rol"] != "admin": raise HTTPException(403,"Se requieren permisos de administrador")
    return user
