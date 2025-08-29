import os
import transformers
from transformers import pipeline

async def get_sentiment(text):
    #Set to avoid warning messages.
    transformers.logging.set_verbosity_error()
    sentiment_classifier = pipeline(task="sentiment-analysis",
                                    model="finiteautomata/bertweet-base-sentiment-analysis")

    cache_dir = os.path.expanduser('~') + "/.cache/huggingface/hub"

    return sentiment_classifier(text)


if __name__ == "__main__":
    print(get_sentiment(["This is a great course", "I learned a lot from this course."]))