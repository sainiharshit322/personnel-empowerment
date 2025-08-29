import os
from google import genai

def Client():
    client = genai.Client(
        api_key=os.getenv("GENAI_API_KEY"),
    )

    return client