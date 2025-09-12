from flask import Flask
from flask_cors import CORS
import logging

# Flask app instance
logging.basicConfig(level=logging.INFO)
app = Flask(__name__, static_folder='../static', template_folder='../templates')
CORS(app, resources={r"/api/*": {"origins": "*"}})


from server.routes import register_routes
register_routes(app)