#Entry point if backend is run independently

from qa_gen import generate
from sentiment_analysis import get_sentiment

# feedback_questions = generate()

feedback_questions = {'questions': ['How satisfied are you with the feedback you receive from your manager/team lead at TSR Corporation?', 'Does your manager/team lead at TSR Corporation provide you with clear expectations regarding your role and responsibilities?', "How well do you believe TSR Corporation's culture supports employee collaboration and teamwork?", 'Do you feel that your individual goals are aligned with the overall goals of TSR Corporation?', "How clearly are TSR Corporation's values communicated and demonstrated by leadership?"]}

def num_analytic(transformer_output):

    record = []

    for i in range(len(transformer_output)):
        label = transformer_output[i]['label']
        if label == 'NEGATIVE':
            record.append(0)
        elif label == 'POSITIVE':
            record.append(1)
        else:
            record.append(2)

    return record

def main():

    input_data = {'answers': []}

    for i in range(len(feedback_questions['questions'])):
        print(feedback_questions['questions'][i])
        user_input = input("Answer: ")
        input_data['answers'].append(user_input)

    analysis = get_sentiment(input_data['answers'])
    print(num_analytic(analysis))


if __name__ == "__main__":
    main()
