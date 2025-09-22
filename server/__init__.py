from flask import Flask
from flask_cors import CORS
import logging
from server.routes import register_routes

logging.basicConfig(level=logging.INFO)
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

register_routes(app)