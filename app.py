import os
import secrets
import sqlite3
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import Flask, jsonify, render_template, request, send_file, session

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "smart-farming-local-demo-key")
DATABASE = os.path.join(os.path.dirname(__file__), "krushiraj.sqlite3")

CROPS = [
    {
        "name": "Wheat",
        "season": "Rabi",
        "soil": "Well-drained loamy soil",
        "duration": "Approx. 110–140 days",
        "guidance": "Check local agricultural guidance for variety selection, irrigation, and fertilizer needs."
    },
    {
        "name": "Rice",
        "season": "Kharif",
        "soil": "Clayey or loamy soil with suitable water availability",
        "duration": "Varies by variety",
        "guidance": "Choose varieties suitable for your region and follow local water-management advice."
    },
    {
        "name": "Tomato",
        "season": "Depends on region and variety",
        "soil": "Well-drained fertile soil",
        "duration": "Varies by variety",
        "guidance": "Monitor plants for pests and disease and consult local agricultural experts when needed."
    },
]

# Demo prices only. Replace with verified local market data before real-world use.
MARKET_PRICES = [
    {"crop": "Wheat", "market": "Pune Local Market", "price": "₹2,400 / quintal"},
    {"crop": "Rice", "market": "Pune Local Market", "price": "₹3,100 / quintal"},
    {"crop": "Tomato", "market": "Pune Local Market", "price": "₹1,800 / quintal"},
]


def get_db():
    database = sqlite3.connect(DATABASE)
    database.row_factory = sqlite3.Row
    return database


def initialize_database():
    database = get_db()
    database.execute("""CREATE TABLE IF NOT EXISTS crop_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        crop TEXT NOT NULL,
        area REAL NOT NULL,
        unit TEXT NOT NULL,
        region TEXT NOT NULL,
        planting_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )""")
    database.execute("""CREATE TABLE IF NOT EXISTS users (
        phone TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )""")
    database.commit()
    database.close()


initialize_database()

@app.route("/")
def home():
    return render_template("index.html", crops=CROPS, prices=MARKET_PRICES)


@app.get("/image.png")
def hero_image():
    return send_file("templates/image.png", mimetype="image/png")


@app.get("/logo.png")
def logo_image():
    return send_file("templates/Farmer Plowing at Sunrise.png", mimetype="image/png")


@app.get("/weather-logo.avif")
def weather_logo():
    return send_file("templates/weather-app-icon-with-sunny-rainy-cloud-vector-50334006.avif", mimetype="image/avif")


@app.get("/crop-logo.png")
def crop_logo():
    return send_file("templates/360_F_107445710_dXV8BQNOVDFHndZapai0ILx3JwfdkJ4E.jpg", mimetype="image/jpeg")


@app.get("/market-logo.png")
def market_logo():
    return send_file("templates/images.png", mimetype="image/png")


@app.post("/api/login")
def login():
    details = request.json or {}
    phone = details.get("phone", "").strip()
    password = details.get("password", "")
    registered_phone = os.environ.get("KRUSHIRAJ_PHONE", "9876543210")
    registered_password = os.environ.get("KRUSHIRAJ_PASSWORD", "farmer123")
    database = get_db()
    user = database.execute("SELECT password FROM users WHERE phone = ?", (phone,)).fetchone()
    database.close()
    valid_login = (user and secrets.compare_digest(password, user["password"])) or (phone == registered_phone and secrets.compare_digest(password, registered_password))
    if not valid_login:
        return jsonify(error="The phone number or password is incorrect."), 401
    session["authenticated"] = True
    session["phone"] = phone
    return jsonify(message="Login successful.")


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify(message="Logged out successfully.")


@app.post("/api/register")
def register():
    details = request.json or {}
    phone = details.get("phone", "").strip()
    password = details.get("password", "")
    if not phone.isdigit() or len(phone) != 10 or len(password) < 6:
        return jsonify(error="Use a valid 10-digit phone number and a password of at least 6 characters."), 400
    database = get_db()
    try:
        database.execute("INSERT INTO users (phone, password) VALUES (?, ?)", (phone, password))
        database.commit()
    except sqlite3.IntegrityError:
        database.close()
        return jsonify(error="An account with this phone number already exists."), 409
    database.close()
    return jsonify(message="Account created. You can now login.")


@app.post("/api/send-otp")
def send_otp():
    phone = request.json.get("phone", "").strip()
    if not phone.isdigit() or len(phone) != 10:
        return jsonify(error="Enter a valid 10-digit phone number."), 400

    code = f"{secrets.randbelow(1_000_000):06d}"
    session["otp"] = code
    session["otp_phone"] = phone
    session["otp_expires"] = time.time() + 300

    if not all(os.environ.get(key) for key in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER")):
        session.pop("otp", None)
        session.pop("otp_phone", None)
        session.pop("otp_expires", None)
        return jsonify(error="SMS login is not configured. Add the Twilio settings before requesting an OTP."), 503

    destination = os.environ.get("OTP_COUNTRY_CODE", "+91") + phone
    payload = urlencode({
        "To": destination,
        "From": os.environ["TWILIO_FROM_NUMBER"],
        "Body": f"Your KrushiRaj login OTP is {code}. It expires in 5 minutes.",
    }).encode()
    url = f"https://api.twilio.com/2010-04-01/Accounts/{os.environ['TWILIO_ACCOUNT_SID']}/Messages.json"
    auth = (f"{os.environ['TWILIO_ACCOUNT_SID']}:{os.environ['TWILIO_AUTH_TOKEN']}").encode()
    import base64
    sms_request = Request(url, data=payload, headers={"Authorization": f"Basic {base64.b64encode(auth).decode()}"})
    try:
        with urlopen(sms_request, timeout=10):
            pass
    except Exception:
        session.clear()
        return jsonify(error="The SMS provider could not send the OTP. Check your Twilio settings."), 502
    return jsonify(mode="sms", message="OTP sent by SMS.")


@app.post("/api/verify-otp")
def verify_otp():
    submitted = request.json.get("otp", "").strip()
    if time.time() > session.get("otp_expires", 0):
        return jsonify(error="This OTP has expired. Request a new one."), 400
    if not secrets.compare_digest(submitted, session.get("otp", "")):
        return jsonify(error="That OTP is incorrect."), 400
    session["authenticated"] = True
    session["phone"] = session.get("otp_phone")
    session.pop("otp", None)
    session.pop("otp_expires", None)
    return jsonify(message="Login successful.")


@app.post("/api/plans")
def create_plan():
    if not session.get("authenticated"):
        return jsonify(error="Please login before saving a crop plan."), 401
    details = request.json or {}
    try:
        area = float(details.get("area", 0))
    except (TypeError, ValueError):
        area = 0
    if not details.get("crop") or area <= 0 or not details.get("region") or not details.get("planting_date"):
        return jsonify(error="Complete the crop, area, region, and planting date fields."), 400
    database = get_db()
    database.execute("INSERT INTO crop_plans (phone, crop, area, unit, region, planting_date) VALUES (?, ?, ?, ?, ?, ?)", (
        session["phone"], details["crop"], area, details.get("unit", "acre"), details["region"], details["planting_date"]
    ))
    database.commit()
    database.close()
    return jsonify(message="Crop plan saved.")


@app.get("/api/plans")
def list_plans():
    if not session.get("authenticated"):
        return jsonify(plans=[])
    database = get_db()
    plans = [dict(plan) for plan in database.execute("SELECT crop, area, unit, region, planting_date FROM crop_plans WHERE phone = ? ORDER BY id DESC", (session["phone"],)).fetchall()]
    database.close()
    return jsonify(plans=plans)

if __name__ == "__main__":
    app.run(debug=True)
