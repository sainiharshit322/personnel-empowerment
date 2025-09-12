import os
from google import genai

class Config:

    model = genai.Client(
        api_key=os.getenv("GENAI_API_KEY"),
    )

    mongo_uri = os.getenv('MONGODB_URI')
    
    db_name = os.getenv('MONGODB_DATABASE', 'personnel_empowerment')