import torch
from transformers import AutoTokenizer
from transformers import AutoModelForSequenceClassification


tokenizer = AutoTokenizer.from_pretrained("distilbert/distilbert-base-uncased")

my_model = AutoModelForSequenceClassification.from_pretrained("im-tsr/distilbert-finetuned-youtube_sentiment_analysis")

def get_sentiment(text):

    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)

        with torch.no_grad():
            outputs = my_model(**inputs)

        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)

        predicted_class_id = logits.argmax().item()
        confidence_score = probabilities[0][predicted_class_id].item()

        sentiment_label = my_model.config.id2label[predicted_class_id]

        return {
            "label": sentiment_label,
            "score": confidence_score
        }

    except Exception as e:
        print(f"Error analyzing sentiment: {e}")


if __name__ == "__main__":

    sentences = ["I love programming!", "I hate bugs!", "This is okay."]
    for sentence in sentences:
        result = get_sentiment(sentence)
        print(f"Input: {sentence} => Sentiment: {result}")