from gradio_client import Client

def get_sentiment(context):
    client = Client("im-tsr/sentiment-analysis")
    result = client.predict(
        text=context,
        api_name="/predict_sentiment"
    )

    # Convert string result to dictionary format
    return {'label': result}

if __name__ == "__main__":

    sentences = ["I love programming!", "I hate bugs!", "This is okay."]
    for sentence in sentences:
        result = get_sentiment(sentence)
        print(f"Input: {sentence} => Sentiment: {result}")