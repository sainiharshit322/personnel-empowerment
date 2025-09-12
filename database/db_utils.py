import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging
from dotenv import load_dotenv
from database.config import Config

# Load environment variables
load_dotenv()

class MongoDBManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.surveys_collection = None
        self._connect()
    
    def _connect(self):
        """Establish connection to MongoDB"""
        try:
            
            mongo_uri = Config.mongo_uri
            db_name = Config.db_name
            
            # Create MongoDB client
            self.client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=10000,  # 10 second connection timeout
                socketTimeoutMS=20000,  # 20 second socket timeout
                tlsAllowInvalidCertificates=True,
                retryWrites=True,
                w='majority'
            )
            
            # Test the connection
            self.client.admin.command('ping')
            
            # Get database and collection
            self.db = self.client[db_name]
            self.surveys_collection = self.db.surveys
            
            # Create indexes for better performance
            self.surveys_collection.create_index("surveyId", unique=True)
            self.surveys_collection.create_index("completedAt")
            
            logging.info(f"Successfully connected to MongoDB database: {db_name}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logging.error(f"Failed to connect to MongoDB: {e}")
            self.client = None
            self.db = None
            self.surveys_collection = None
    
    def is_connected(self):
        """Check if MongoDB connection is active"""
        try:
            if self.client:
                self.client.admin.command('ping')
                return True
        except Exception:
            pass
        return False
    
    def save_survey(self, survey_data):
        """Save survey data to MongoDB"""
        try:
            if not self.is_connected():
                self._connect()
            
            if self.surveys_collection is None:
                raise Exception("MongoDB connection not available")
            
            # Use upsert to avoid duplicate entries
            result = self.surveys_collection.replace_one(
                {"surveyId": survey_data["surveyId"]},
                survey_data,
                upsert=True
            )
            
            return {
                "success": True,
                "surveyId": survey_data["surveyId"],
                "upserted": result.upserted_id is not None,
                "modified": result.modified_count > 0
            }
            
        except Exception as e:
            logging.error(f"Error saving survey to MongoDB: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_all_surveys(self):
        """Retrieve all surveys from MongoDB"""
        try:
            if not self.is_connected():
                self._connect()
            
            if self.surveys_collection is None:
                raise Exception("MongoDB connection not available")
            
            # Get all surveys, sorted by completion date (newest first)
            surveys = list(self.surveys_collection.find(
                {},
                {"_id": 0}  # Exclude MongoDB's _id field
            ).sort("completedAt", -1))
            
            return {
                "success": True,
                "surveys": surveys,
                "count": len(surveys)
            }
            
        except Exception as e:
            logging.error(f"Error retrieving surveys from MongoDB: {e}")
            return {
                "success": False,
                "surveys": [],
                "error": str(e)
            }
    
    def get_survey_by_id(self, survey_id):
        """Retrieve a specific survey by ID"""
        try:
            if not self.is_connected():
                self._connect()
            
            if self.surveys_collection is None:
                raise Exception("MongoDB connection not available")
            
            survey = self.surveys_collection.find_one(
                {"surveyId": survey_id},
                {"_id": 0}
            )
            
            return {
                "success": True,
                "survey": survey
            }
            
        except Exception as e:
            logging.error(f"Error retrieving survey {survey_id} from MongoDB: {e}")
            return {
                "success": False,
                "survey": None,
                "error": str(e)
            }
    
    def get_surveys_count(self):
        """Get total count of surveys"""
        try:
            if not self.is_connected():
                self._connect()
            
            if self.surveys_collection is None:
                return 0
            
            return self.surveys_collection.count_documents({})
            
        except Exception as e:
            logging.error(f"Error getting surveys count from MongoDB: {e}")
            return 0
    
    def delete_survey(self, survey_id):
        """Delete a survey by ID"""
        try:
            if not self.is_connected():
                self._connect()
            
            if self.surveys_collection is None:
                raise Exception("MongoDB connection not available")
            
            result = self.surveys_collection.delete_one({"surveyId": survey_id})
            
            return {
                "success": True,
                "deleted": result.deleted_count > 0
            }
            
        except Exception as e:
            logging.error(f"Error deleting survey {survey_id} from MongoDB: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def close_connection(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            self.surveys_collection = None

# Global MongoDB manager instance
mongodb_manager = MongoDBManager()
