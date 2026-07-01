import json
import random
import re
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)
USERS_FILE = DATA_DIR / "users.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"

DEFAULT_USERS = [
    {"id": 1, "name": "Admin User", "email": "admin@markus.com", "password": "admin123", "role": "admin", "verified": True, "verificationCode": None},
    {"id": 2, "name": "Mina", "email": "mina@example.com", "password": "pass123", "role": "user", "verified": True, "verificationCode": None},
]


def load_json(path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def save_json(path, value):
    path.write_text(json.dumps(value, indent=2), encoding="utf-8")


def ensure_storage():
    if not USERS_FILE.exists():
        save_json(USERS_FILE, DEFAULT_USERS)
    if not SESSIONS_FILE.exists():
        save_json(SESSIONS_FILE, {})


ensure_storage()


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw) if raw else {}

    def _get_session(self):
        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return None
        token = header.split(" ", 1)[1]
        sessions = load_json(SESSIONS_FILE, {})
        return sessions.get(token)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/admin/users":
            session = self._get_session()
            if not session or session.get("role") != "admin":
                self._send_json({"success": False, "message": "Admin access required."}, 403)
                return
            users = load_json(USERS_FILE, [])
            self._send_json({"success": True, "users": users})
            return

        self._serve_static(parsed.path)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/signup":
            data = self._read_json()
            name = (data.get("name") or "").strip()
            email = (data.get("email") or "").strip().lower()
            password = (data.get("password") or "").strip()
            if not name or not email or not password:
                self._send_json({"success": False, "message": "Please complete all fields."}, 400)
                return
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
                self._send_json({"success": False, "message": "Please use a valid email address."}, 400)
                return

            users = load_json(USERS_FILE, [])
            existing = next((u for u in users if u.get("email") == email), None)
            if existing and existing.get("verified"):
                self._send_json({"success": False, "message": "An account with that email already exists."}, 409)
                return
            if existing and not existing.get("verified"):
                code = f"{random.randint(100000, 999999)}"
                existing["verificationCode"] = code
                existing["name"] = name
                existing["password"] = password
                save_json(USERS_FILE, users)
                self._send_json({"success": True, "pendingVerification": True, "verificationCode": code, "message": "A verification code was generated for your email."})
                return

            code = f"{random.randint(100000, 999999)}"
            users.append({
                "id": max([u.get("id", 0) for u in users], default=0) + 1,
                "name": name,
                "email": email,
                "password": password,
                "role": "user",
                "verified": False,
                "verificationCode": code,
            })
            save_json(USERS_FILE, users)
            self._send_json({"success": True, "pendingVerification": True, "verificationCode": code, "message": "A verification code was generated for your email."})
            return

        if parsed.path == "/api/verify":
            data = self._read_json()
            email = (data.get("email") or "").strip().lower()
            code = (data.get("code") or "").strip()
            users = load_json(USERS_FILE, [])
            user = next((u for u in users if u.get("email") == email), None)
            if not user:
                self._send_json({"success": False, "message": "No pending account was found for that email."}, 404)
                return
            if user.get("verified"):
                self._send_json({"success": True, "message": "Your email is already verified."})
                return
            if str(user.get("verificationCode", "")) != str(code):
                self._send_json({"success": False, "message": "The verification code is incorrect."}, 401)
                return
            user["verified"] = True
            user["verificationCode"] = None
            save_json(USERS_FILE, users)
            self._send_json({"success": True, "message": "Your email is verified. You can log in now."})
            return

        if parsed.path == "/api/login":
            data = self._read_json()
            email = (data.get("email") or "").strip().lower()
            password = (data.get("password") or "").strip()
            users = load_json(USERS_FILE, [])
            user = next((u for u in users if u.get("email") == email and u.get("password") == password), None)
            if not user:
                self._send_json({"success": False, "message": "Invalid credentials."}, 401)
                return
            if not user.get("verified"):
                self._send_json({"success": False, "message": "Please verify your email before logging in."}, 403)
                return
            token = str(uuid.uuid4())
            sessions = load_json(SESSIONS_FILE, {})
            sessions[token] = {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}
            save_json(SESSIONS_FILE, sessions)
            self._send_json({"success": True, "token": token, "user": sessions[token]["user"]})
            return

        if parsed.path == "/api/admin/login":
            data = self._read_json()
            email = (data.get("email") or "").strip().lower()
            password = (data.get("password") or "").strip()
            users = load_json(USERS_FILE, [])
            user = next((u for u in users if u.get("email") == email and u.get("password") == password and u.get("role") == "admin"), None)
            if not user:
                self._send_json({"success": False, "message": "Admin credentials invalid."}, 401)
                return
            token = str(uuid.uuid4())
            sessions = load_json(SESSIONS_FILE, {})
            sessions[token] = {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}
            save_json(SESSIONS_FILE, sessions)
            self._send_json({"success": True, "token": token, "user": sessions[token]["user"]})
            return

        self._send_json({"success": False, "message": "Not found."}, 404)

    def _serve_static(self, path):
        if path in ("/", ""):
            path = "/index.html"
        if path.startswith("/api/"):
            self._send_json({"success": False, "message": "Not found."}, 404)
            return
        file_path = (ROOT / path.lstrip("/")).resolve()
        if not str(file_path).startswith(str(ROOT)):
            self._send_json({"success": False, "message": "Forbidden"}, 403)
            return
        if file_path.exists() and file_path.is_file():
            content = file_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", self._guess_type(file_path))
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            self._send_json({"success": False, "message": "Not found."}, 404)

    def _guess_type(self, path):
        if path.suffix.lower() in {".html", ".htm"}:
            return "text/html; charset=utf-8"
        if path.suffix.lower() in {".css"}:
            return "text/css; charset=utf-8"
        if path.suffix.lower() in {".js"}:
            return "application/javascript; charset=utf-8"
        if path.suffix.lower() in {".json"}:
            return "application/json; charset=utf-8"
        return "application/octet-stream"


if __name__ == "__main__":
    host = "0.0.0.0"
    port = 8000
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Server running at http://localhost:{port}")
    server.serve_forever()
