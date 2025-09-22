from gradio_client import Client

def get_sentiment(text):
    client = Client("im-tsr/sentiment-analysis")
    result = client.predict(
            text=text,
            api_name="/process_sentiment"
    )

    pos = result[0].split('>')[1].split('%')[0]
    neg = result[1].split('>')[1].split('%')[0]
    neu = result[2].split('>')[1].split('%')[0]

    sentiment_dict = {"POSITIVE": float(pos), "NEUTRAL": float(neg), "NEGATIVE": float(neu)}

    highest = max(sentiment_dict.items(), key=lambda x: x[1])

    return {'label': highest[0].upper(), 'score': highest[1]}


if __name__ == "__main__":

    sentences = ["I love programming!", "I hate bugs!", "This is okay."]
    for sentence in sentences:
        result = get_sentiment(sentence)
        print(f"Input: {sentence} => Sentiment: {result}")