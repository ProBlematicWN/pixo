from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime
import boto3
from botocore.client import Config
from dotenv import load_dotenv

# ======================
# init
# ======================
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

USERS_FILE = "users.json"
IMAGES_FILE = "images.json"
ALBUMS_FILE = "albums.json"

USER_PREFIX = "user/"
GUEST_FILE = "guest_uploads.json"

# ======================
# S3 (Yandex Object Storage)
# ======================
S3_ENDPOINT = "https://storage.yandexcloud.net"
S3_BUCKET = "pixo-images"

S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")

s3 = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    config=Config(signature_version="s3v4"),
)

# ======================
# upload limits
# ======================
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5MB
GUEST_PREFIX = "guest/"


# ======================
# utils
# ======================
def load_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


def load_guests():
    if not os.path.exists(GUEST_FILE):
        return {}
    with open(GUEST_FILE, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
        except json.JSONDecodeError:
            return {}


def save_guests(data: dict):
    with open(GUEST_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_or_create_guest_id():
    guest_id = request.cookies.get("guest_id")
    if not guest_id:
        guest_id = str(uuid.uuid4())
    return guest_id


def load_images():
    if not os.path.exists(IMAGES_FILE):
        return []
    with open(IMAGES_FILE, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []


def save_images(images):
    with open(IMAGES_FILE, "w", encoding="utf-8") as f:
        json.dump(images, f, ensure_ascii=False, indent=2)


def load_albums():
    if not os.path.exists(ALBUMS_FILE):
        return []
    with open(ALBUMS_FILE, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []


def save_albums(albums):
    with open(ALBUMS_FILE, "w", encoding="utf-8") as f:
        json.dump(albums, f, ensure_ascii=False, indent=2)


# ======================
# auth
# ======================
@app.route("/api/sign-up", methods=["POST"])
def sign_up():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email_or_password_missing"}), 400

    users = load_users()

    if any(u.get("email") == email for u in users):
        return jsonify({"error": "user_exists"}), 400

    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password": password, 
        "created_at": datetime.utcnow().isoformat()
    }

    users.append(user)
    save_users(users)

    return jsonify({
        "message": "registered",
        "user": {"id": user["id"], "email": user["email"]}
    }), 201


@app.route("/api/sign-in", methods=["POST"])
def sign_in():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email_or_password_missing"}), 400

    users = load_users()
    user = next((u for u in users if u.get("email") == email), None)

    if user is None:
        return jsonify({"error": "user_not_found"}), 400

    if user.get("password") != password:
        return jsonify({"error": "wrong_password"}), 400

    return jsonify({
        "message": "ok",
        "user": {"id": user["id"], "email": user["email"]}
    }), 200


# ======================
# system
# ======================
@app.route("/api/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})


# ======================
# guest upload
# ======================
@app.route("/api/upload-guest", methods=["POST"])
def upload_guest():
    guests = load_guests()
    guest_id = get_or_create_guest_id()

    if "file" not in request.files:
        return jsonify({"error": "no_file"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "empty_filename"}), 400

    title = request.form.get("title") or file.filename

    # только изображения
    if not (file.mimetype or "").startswith("image/"):
        return jsonify({"error": "only_images_allowed"}), 400

    # проверка размера (5MB)
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)

    if size > MAX_SIZE_BYTES:
        return jsonify({"error": "file_too_large"}), 400

    # если у гостя было предыдущее фото — удаляем из S3
    old_key = None
    if guest_id in guests and isinstance(guests[guest_id], dict):
        old_key = guests[guest_id].get("key")

    if old_key:
        try:
            s3.delete_object(Bucket=S3_BUCKET, Key=old_key)
        except Exception:
            pass

    ext = os.path.splitext(file.filename)[1].lower()
    key = f"{GUEST_PREFIX}{uuid.uuid4()}{ext}"

    s3.upload_fileobj(
        file,
        S3_BUCKET,
        key,
        ExtraArgs={"ContentType": file.mimetype}
    )

    guests[guest_id] = {
        "key": key,
        "title": title,
        "uploaded_at": datetime.utcnow().isoformat()
    }
    save_guests(guests)

    public_url = f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"

    resp = jsonify({
        "message": "uploaded",
        "guest_id": guest_id,
        "key": key,
        "url": public_url,
        "title": title
    })

    # cookie живёт сутки
    resp.set_cookie(
        "guest_id",
        guest_id,
        max_age=60 * 60 * 24,
        httponly=True,
        samesite="Lax"
    )

    return resp, 201


# ======================
# user upload
# ======================
@app.route("/api/upload-user", methods=["POST"])
def upload_user():
    user_id = request.form.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id_missing"}), 400

    if "file" not in request.files:
        return jsonify({"error": "no_file"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "empty_filename"}), 400

    if not (file.mimetype or "").startswith("image/"):
        return jsonify({"error": "only_images_allowed"}), 400

    # 5MB лимит
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_SIZE_BYTES:
        return jsonify({"error": "file_too_large"}), 400

    title = request.form.get("title") or file.filename

    ext = os.path.splitext(file.filename)[1].lower()
    image_id = str(uuid.uuid4())
    key = f"{USER_PREFIX}{user_id}/{image_id}{ext}"

    s3.upload_fileobj(
        file,
        S3_BUCKET,
        key,
        ExtraArgs={"ContentType": file.mimetype}
    )

    url = f"{S3_ENDPOINT}/{S3_BUCKET}/{key}"

    images = load_images()
    record = {
        "id": image_id,
        "user_id": user_id,
        "title": title,
        "album_id": None,  #для альбомов
        "key": key,
        "url": url,
        "created_at": datetime.utcnow().isoformat()
    }
    images.append(record)
    save_images(images)

    return jsonify({"message": "uploaded", "image": record}), 201


# ======================
# gallery / image
# ======================
@app.route("/api/gallery/<user_id>", methods=["GET"])
def gallery(user_id):
    images = load_images()
    user_images = [img for img in images if img.get("user_id") == user_id]
    user_images.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"images": user_images}), 200


@app.route("/api/image/<image_id>", methods=["GET"])
def get_image(image_id):
    images = load_images()
    img = next((x for x in images if x.get("id") == image_id), None)
    if not img:
        return jsonify({"error": "not_found"}), 404
    return jsonify({"image": img}), 200


# ======================
# albums
# ======================
@app.route("/api/albums", methods=["POST"])
def create_album():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    title = (data.get("title") or "").strip()

    if not user_id or not title:
        return jsonify({"error": "user_id_or_title_missing"}), 400

    albums = load_albums()
    album = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "created_at": datetime.utcnow().isoformat()
    }
    albums.append(album)
    save_albums(albums)

    return jsonify({"album": album}), 201


@app.route("/api/albums/<user_id>", methods=["GET"])
def list_albums(user_id):
    albums = load_albums()
    user_albums = [a for a in albums if a.get("user_id") == user_id]
    user_albums.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return jsonify({"albums": user_albums}), 200


#страница конкретного альбома (AlbumPage)
@app.route("/api/album/<album_id>", methods=["GET"])
def get_album(album_id):
    albums = load_albums()
    album = next((a for a in albums if a.get("id") == album_id), None)
    if not album:
        return jsonify({"error": "album_not_found"}), 404

    images = load_images()
    album_images = [img for img in images if img.get("album_id") == album_id]
    album_images.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return jsonify({"album": album, "images": album_images}), 200


@app.route("/api/image/<image_id>/set-album", methods=["POST"])
def set_image_album(image_id):
    data = request.get_json() or {}
    user_id = data.get("user_id")
    album_id = data.get("album_id")  # может быть "" / None

    if not user_id:
        return jsonify({"error": "user_id_missing"}), 400

    images = load_images()
    img = next((x for x in images if x.get("id") == image_id), None)
    if not img:
        return jsonify({"error": "not_found"}), 404

    # фото должно принадлежать пользователю
    if img.get("user_id") != user_id:
        return jsonify({"error": "forbidden"}), 403

    # если album_id указан — проверим альбом
    if album_id:
        albums = load_albums()
        alb = next((a for a in albums if a.get("id") == album_id), None)
        if not alb or alb.get("user_id") != user_id:
            return jsonify({"error": "album_not_found"}), 404
        img["album_id"] = album_id
    else:
        img["album_id"] = None

    save_images(images)
    return jsonify({"message": "ok", "image": img}), 200

# ======================
# profile / settings
# ======================

@app.route("/api/user/<user_id>", methods=["GET"])
def get_user(user_id):
    users = load_users()
    u = next((x for x in users if x.get("id") == user_id), None)
    if not u:
        return jsonify({"error": "user_not_found"}), 404

    return jsonify({
        "user": {
            "id": u.get("id"),
            "email": u.get("email"),
            "username": u.get("username", ""),
            "lang": u.get("lang", "ru"),
            "created_at": u.get("created_at")
        }
    }), 200


@app.route("/api/user/<user_id>/update", methods=["POST"])
def update_user(user_id):
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    username = (data.get("username") or "").strip()
    lang = (data.get("lang") or "ru").strip()

    users = load_users()
    u = next((x for x in users if x.get("id") == user_id), None)
    if not u:
        return jsonify({"error": "user_not_found"}), 404

    # если меняем email — проверим уникальность
    if email and email != u.get("email"):
        if any(x.get("email") == email for x in users):
            return jsonify({"error": "email_taken"}), 400
        u["email"] = email

    # остальные поля
    u["username"] = username
    u["lang"] = lang

    save_users(users)

    return jsonify({
        "message": "ok",
        "user": {
            "id": u.get("id"),
            "email": u.get("email"),
            "username": u.get("username", ""),
            "lang": u.get("lang", "ru")
        }
    }), 200


@app.route("/api/user/<user_id>/change-password", methods=["POST"])
def change_password(user_id):
    data = request.get_json() or {}
    old_password = data.get("old_password") or ""
    new_password = data.get("new_password") or ""

    if not old_password or not new_password:
        return jsonify({"error": "old_or_new_missing"}), 400

    users = load_users()
    u = next((x for x in users if x.get("id") == user_id), None)
    if not u:
        return jsonify({"error": "user_not_found"}), 404

    if u.get("password") != old_password:
        return jsonify({"error": "wrong_old_password"}), 400

    u["password"] = new_password
    save_users(users)

    return jsonify({"message": "ok"}), 200


# ======================
if __name__ == "__main__":
    app.run(port=5000, debug=True)
