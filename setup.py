"""
Web-based billing system
"""

from flask import Flask, redirect, url_for, request, render_template, session, jsonify
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from google.oauth2 import id_token, credentials
from google.auth.transport.requests import Request
from flask_sqlalchemy import SQLAlchemy
from decouple import config
from flask_cors import CORS
import requests

# Flask app configuration
app = Flask(__name__)
app.secret_key = config("SECRET_KEY", cast = str)
app.config['SQLALCHEMY_DATABASE_URI'] = config("DATABASE_URI", cast = str)
db = SQLAlchemy(app)
CORS(app, resources = "*")

# Oauth credentials
CLIENT_ID = config("CLIENT_ID", cast = str)
CLIENT_SECRET = config("CLIENT_SECRET", cast = str)
REDIRECT_URI = config("REDIRECT_URI", cast = str)

# Flask settings
FLASK_HOST = config("FLASK_HOST", cast = str)
FLASK_PORT = config("FLASK_PORT", cast = int)
FLASK_DEBUG = config("FLASK_DEBUG", cast = bool)

login_manager = LoginManager()
login_manager.init_app(app)

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(100), nullable=False)
    item = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text, nullable=True)

    def __repr__(self):
        return f"Item(user_id={self.user_id}, item={self.item}, price={self.price}, description={self.description})"

class User(UserMixin):
    pass

def exchange_code_for_token(code):
    token_endpoint = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    response = requests.post(token_endpoint, data=data)
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get("id_token")
        return access_token
    else:
        return None

@login_manager.user_loader
def load_user(user_id):
    user = User()
    user.id = user_id
    return user

@app.route('/')
def index():
    return redirect(url_for('google_login'))

@app.route('/google/login')
def google_login():
    return redirect(f"https://accounts.google.com/o/oauth2/v2/auth?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=email%20profile")

@app.route('/google/callback')
def google_callback():
    code = request.args.get('code')
    if code:
        token = exchange_code_for_token(code)
        if token:
            idinfo = id_token.verify_oauth2_token(token, Request(), CLIENT_ID)
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return "Invalid issuer.", 400
            user_id = idinfo['sub']
            user = User()
            user.id = user_id
            session['access_token'] = token
            login_user(user)
            return redirect(url_for('dashboard'))
        else:
            return "Failed to exchange code for token.", 400
    else:
        return "Authentication failed.", 400

@app.route('/dashboard')
@login_required
def dashboard():
    user_id = current_user.id
    items = Item.query.filter_by(user_id=user_id).all()
    item_list = [{'item_id': item.id, 'item': item.item, 'price': item.price, 'description': item.description} for item in items]
    return render_template('dashboard.html')

@app.route('/items', methods=['POST'])
@login_required
def add_item():
    user_id = current_user.id
    data = request.get_json()
    new_item = Item(user_id=user_id, item=data['item'], price=data['price'], description=data.get('description', ''))
    db.session.add(new_item)
    db.session.commit()
    return jsonify({'item_id': new_item.id})

@app.route('/items/<int:item_id>', methods=['PUT'])
@login_required
def edit_item(item_id):
    user_id = current_user.id
    item = Item.query.filter_by(id=item_id, user_id=user_id).first()
    if item:
        data = request.get_json()
        item.item = data['item']
        item.price = data['price']
        item.description = data.get('description', '')
        db.session.commit()
        return jsonify({'message': 'Item updated successfully'})
    else:
        return jsonify({'error': 'Item not found or unauthorized'}), 404

@app.route('/items/<int:item_id>', methods=['DELETE'])
@login_required
def delete_item(item_id):
    user_id = current_user.id
    item = Item.query.filter_by(id=item_id, user_id=user_id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item deleted successfully'})
    else:
        return jsonify({'error': 'Item not found or unauthorized'}), 404

@app.route('/items', methods=['GET'])
@login_required
def get_items():
    user_id = current_user.id
    items = Item.query.filter_by(user_id=user_id).all()
    item_list = [{'item_id': item.id, 'item': item.item, 'price': item.price, 'description': item.description} for item in items]
    return jsonify(item_list)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(
        host = FLASK_HOST,
        port = FLASK_PORT,
        debug = FLASK_DEBUG
    )
