from flask import Flask
from flask_cors import CORS
import logging

# Create Flask app instance
logging.basicConfig(level=logging.INFO)
app = Flask(__name__, static_folder='../static', template_folder='../templates')
CORS(app, resources={r"/api/*": {"origins": "http://127.0.0.1:5000"}})

# Import routes after creating app to avoid circular imports
from server.routes import register_routes
register_routes(app)