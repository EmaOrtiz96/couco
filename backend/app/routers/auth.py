from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.database import get_connection
from app.auth import hash_password, verify_password, create_token, get_current_user, require_admin
from app.utils.email import email_bienvenida, email_reset_password
import httpx, os, secrets
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Auth"])
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID","")

class RegisterIn(BaseModel):
    nombre: str; email: str; password: str

class LoginIn(BaseModel):
    email: str; password: str

class GoogleIn(BaseModel):
    token: str

class ForgotIn(BaseModel):
    email: str

class ResetIn(BaseModel):
    token: str; password: str

class ChangePassIn(BaseModel):
    password_actual: str; password_nueva: str

def user_out(u):
    return {"id":u["id"],"nombre":u["nombre"],"email":u["email"],"avatar":u.get("avatar"),"rol":u["rol"]}

def token_response(u):
    return {"access_token": create_token({"sub":str(u["id"]),"rol":u["rol"]}), "token_type":"bearer","user":user_out(u)}

# ── REGISTRO ──────────────────────────────────────
@router.post("/register")
def register(d: RegisterIn):
    if len(d.password) < 6: raise HTTPException(400,"Contraseña mínimo 6 caracteres")
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT id FROM usuarios WHERE email=%s",(d.email,))
            if c.fetchone(): raise HTTPException(400,"Email ya registrado")
            c.execute("INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (%s,%s,%s,'cliente')",
                      (d.nombre,d.email,hash_password(d.password)))
            conn.commit()
            c.execute("SELECT * FROM usuarios WHERE id=%s",(c.lastrowid,))
            user = c.fetchone()
        email_bienvenida(d.email, d.nombre)
        return token_response(user)
    finally: conn.close()

# ── LOGIN ─────────────────────────────────────────
@router.post("/login")
def login(d: LoginIn):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM usuarios WHERE email=%s AND activo=1",(d.email,))
            user = c.fetchone()
        if not user or not user.get("password_hash"): raise HTTPException(401,"Email o contraseña incorrectos")
        if not verify_password(d.password, user["password_hash"]): raise HTTPException(401,"Email o contraseña incorrectos")
        return token_response(user)
    finally: conn.close()

# ── GOOGLE ────────────────────────────────────────
@router.post("/google")
async def google_login(d: GoogleIn):
    if not GOOGLE_CLIENT_ID: raise HTTPException(500,"Google OAuth no configurado")
    async with httpx.AsyncClient() as client:
        r = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={d.token}")
        info = r.json()
    if info.get("aud") != GOOGLE_CLIENT_ID: raise HTTPException(400,"Token inválido")
    google_id=info["sub"]; email=info["email"]; nombre=info.get("name",email); avatar=info.get("picture")
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM usuarios WHERE google_id=%s OR email=%s",(google_id,email))
            user = c.fetchone()
            if not user:
                c.execute("INSERT INTO usuarios (nombre,email,google_id,avatar,rol) VALUES (%s,%s,%s,%s,'cliente')",
                          (nombre,email,google_id,avatar))
                conn.commit()
                c.execute("SELECT * FROM usuarios WHERE id=%s",(c.lastrowid,))
                user = c.fetchone()
                email_bienvenida(email,nombre)
            else:
                c.execute("UPDATE usuarios SET google_id=%s,avatar=%s WHERE id=%s",(google_id,avatar,user["id"]))
                conn.commit()
                c.execute("SELECT * FROM usuarios WHERE id=%s",(user["id"],))
                user = c.fetchone()
        return token_response(user)
    finally: conn.close()

# ── OLVIDÉ CONTRASEÑA ─────────────────────────────
@router.post("/forgot-password")
def forgot_password(d: ForgotIn):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM usuarios WHERE email=%s AND activo=1",(d.email,))
            user = c.fetchone()
            if user:
                token = secrets.token_urlsafe(32)
                expiry = datetime.utcnow() + timedelta(hours=1)
                c.execute("UPDATE usuarios SET reset_token=%s,reset_expiry=%s WHERE id=%s",
                          (token,expiry,user["id"]))
                conn.commit()
                email_reset_password(d.email,user["nombre"],token)
        return {"success":True,"message":"Si el email existe, recibirás un enlace en minutos."}
    finally: conn.close()

# ── RESET CONTRASEÑA ──────────────────────────────
@router.post("/reset-password")
def reset_password(d: ResetIn):
    if len(d.password) < 6: raise HTTPException(400,"Contraseña mínimo 6 caracteres")
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT * FROM usuarios WHERE reset_token=%s",(d.token,))
            user = c.fetchone()
            if not user: raise HTTPException(400,"Token inválido o expirado")
            if user["reset_expiry"] < datetime.utcnow(): raise HTTPException(400,"Token expirado")
            c.execute("UPDATE usuarios SET password_hash=%s,reset_token=NULL,reset_expiry=NULL WHERE id=%s",
                      (hash_password(d.password),user["id"]))
            conn.commit()
        return {"success":True}
    finally: conn.close()

# ── PERFIL ────────────────────────────────────────
@router.get("/me")
def me(user=Depends(get_current_user)): return user_out(user)

@router.put("/cambiar-password")
def cambiar_pass(d: ChangePassIn, user=Depends(get_current_user)):
    if not user.get("password_hash"): raise HTTPException(400,"Cuenta Google no tiene contraseña")
    if not verify_password(d.password_actual,user["password_hash"]): raise HTTPException(400,"Contraseña actual incorrecta")
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("UPDATE usuarios SET password_hash=%s WHERE id=%s",(hash_password(d.password_nueva),user["id"]))
            conn.commit()
        return {"success":True}
    finally: conn.close()

# ── ADMIN: usuarios ───────────────────────────────
@router.get("/admin/usuarios")
def list_users(admin=Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as c:
            c.execute("SELECT id,nombre,email,avatar,rol,activo,created_at FROM usuarios ORDER BY created_at DESC")
            return c.fetchall()
    finally: conn.close()
