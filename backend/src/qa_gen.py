import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()


def generate():
    client = genai.Client(
        api_key=os.getenv("GENAI_API_KEY")
    )

    model = "gemini-2.0-flash-lite"
    num = 3 #Number of questions to generate
    company_name = "TSR Corporation"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=f"""
                Generate {num} employee engagement question. The question should focus on employee Engagement Surveys, Manager/Team lead Feedback, Culture Assessment, Goal Alignment for the company named {company_name}.

                Examples of Questions:

                How likely is it that you would recommend {company_name} as a place to work?
                My direct manager/supervisor/leader cares about my opinions.
                I am inspired by the purpose and mission of our organization.
                The overall business goals and strategies set by {company_name} are taking us in the right direction.
                The demands of my workload are manageable.
                I understand how my work supports the goals and objectives of my team.
                People from all backgrounds are treated fairly at {company_name}.
                A diverse workforce is a clear priority at {company_name} (for example, in terms of gender, ethnicity, disability).
                Team member health and wellbeing is a priority at {company_name}.
                I understand how {company_name} sustainability efforts contribute to positive outcomes for the environment, our communities, and stakeholders.
                {company_name} provides AI-upskilling to enhance my productivity
                I am satisfied with the steps {company_name} is taking to reduce its environmental impact"""),
            ],
        ),
    ]

    generate_content_config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type = genai.types.Type.OBJECT,
            properties = {
                "questions": genai.types.Schema(
                    type = genai.types.Type.ARRAY,
                    items = genai.types.Schema(
                        type = genai.types.Type.STRING,
                    ),
                ),
            },
        ),
    )

    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        response_text += chunk.text
    return eval(response_text)


if __name__ == "__main__":
    print(generate())