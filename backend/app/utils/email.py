import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

MAIL_USER = os.getenv("MAIL_USER","")
MAIL_PASS = os.getenv("MAIL_PASS","")
MAIL_FROM = os.getenv("MAIL_FROM","Couco Aromas <noreply@coucoaromas.com>")
FRONTEND_URL = os.getenv("FRONTEND_URL","http://localhost:5173")

def send_email(to: str, subject: str, html: str):
    if not MAIL_USER or not MAIL_PASS:
        print(f"[EMAIL SIMULADO] Para: {to} | Asunto: {subject}")
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = MAIL_FROM
    msg["To"]      = to
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(MAIL_USER, MAIL_PASS)
            s.sendmail(MAIL_USER, to, msg.as_string())
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")

def email_bienvenida(to, nombre):
    send_email(to, "¡Bienvenido a Couco Aromas! 🌸", f"""
    <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:2rem;">
      <h2 style="color:#1a1714;">¡Hola, {nombre}!</h2>
      <p>Gracias por unirte a <strong>Couco Aromas</strong>. Estamos felices de tenerte.</p>
      <p>Explora nuestra colección de fragancias artesanales:</p>
      <a href="{FRONTEND_URL}" style="background:#b8845a;color:white;padding:.8rem 2rem;text-decoration:none;display:inline-block;margin-top:1rem;">
        Ver Tienda
      </a>
    </div>""")

def email_confirmacion_pedido(to, nombre, pedido_id, total, items):
    items_html = "".join(f"<tr><td>{i['nombre_producto']}</td><td>{i['cantidad']}</td><td>${i['precio']:.2f}</td></tr>" for i in items)
    send_email(to, f"Pedido #{pedido_id} confirmado ✅", f"""
    <div style="font-family:Georgia,serif;max-width:600px;margin:auto;padding:2rem;">
      <h2 style="color:#1a1714;">¡Pedido confirmado, {nombre}!</h2>
      <p>Tu pedido <strong>#{pedido_id}</strong> fue recibido y está siendo procesado.</p>
      <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;">
        <thead><tr style="background:#f5f0e8;"><th style="padding:.5rem;text-align:left;">Producto</th><th>Cant.</th><th>Precio</th></tr></thead>
        <tbody>{items_html}</tbody>
      </table>
      <p style="font-size:1.2rem;"><strong>Total: ${total:.2f}</strong></p>
      <a href="{FRONTEND_URL}/mis-pedidos" style="background:#1a1714;color:#f5f0e8;padding:.8rem 2rem;text-decoration:none;display:inline-block;margin-top:1rem;">
        Ver mis pedidos
      </a>
    </div>""")

def email_reset_password(to, nombre, token):
    link = f"{FRONTEND_URL}/reset-password?token={token}"
    send_email(to, "Restablecer contraseña — Couco Aromas", f"""
    <div style="font-family:Georgia,serif;max-width:500px;margin:auto;padding:2rem;">
      <h2 style="color:#1a1714;">Restablecer contraseña</h2>
      <p>Hola <strong>{nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
      <p>El enlace expira en <strong>1 hora</strong>.</p>
      <a href="{link}" style="background:#b8845a;color:white;padding:.8rem 2rem;text-decoration:none;display:inline-block;margin-top:1rem;">
        Restablecer Contraseña
      </a>
      <p style="color:#999;font-size:.8rem;margin-top:1.5rem;">Si no solicitaste esto, ignora este email.</p>
    </div>""")
