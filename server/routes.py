from flask import jsonify, send_from_directory, request, render_template
from utils.qa_gen import generate
from utils.sentiment_analysis import get_sentiment
from database.db_utils import mongodb_manager
import os
import logging

logging.basicConfig(level=logging.INFO)

def register_routes(app):
    """Register all routes with the Flask app"""
    
    @app.route('/api/save-survey', methods=['POST'])
    def save_survey():
        try:
            survey_data = request.get_json()
            
            # Sentiment analysis on each response
            answers = []
            for response in survey_data.get('responses', []):
                answer = response.get('answer', '')
                if answer.strip():  # Only analyze non-empty answers
                    answers.append(answer)
            
            # Sentiment analysis for all answers at once
            sentiment_results = []
            if answers:
                try:
                    for answer in answers:
                        result = get_sentiment(answer)
                        sentiment_results.append(result)

                except Exception as e:
                    print(f'Error analyzing sentiment: {e}')
                    # Fallback to neutral sentiment if analysis fails
                    sentiment_results = [{'label': 'NEUTRAL'} for _ in answers]

            # Sentiment analysis for each response
            sentiment_index = 0
            for response in survey_data.get('responses', []):
                if response.get('answer', '').strip():  # Only for non-empty answers
                    if sentiment_index < len(sentiment_results):
                        sentiment_result = sentiment_results[sentiment_index]
                        response['SentiAnalysis'] = {
                            'label': sentiment_result.get('label', 'NEUTRAL')
                        }
                        sentiment_index += 1
                    else:
                        response['SentiAnalysis'] = {
                            'label': 'NEUTRAL'
                        }
                else:
                    # For empty answers
                    response['SentiAnalysis'] = {
                        'label': 'NEUTRAL'
                    }
            
            # Save to MongoDB
            mongodb_result = mongodb_manager.save_survey(survey_data)
            
            if mongodb_result["success"]:
                # Total surveys count from MongoDB
                total_surveys = mongodb_manager.get_surveys_count()
                
                print(f'Survey saved to MongoDB with sentiment analysis. Total surveys: {total_surveys}')
                return jsonify({
                    'success': True, 
                    'database': 'MongoDB', 
                    'totalSurveys': total_surveys,
                    'sentimentAnalyzed': True,
                    'surveyId': survey_data.get('surveyId', 'unknown')
                })
            else:
                # Return error if MongoDB save fails
                error_msg = f'Failed to save survey to MongoDB: {mongodb_result.get("error", "Unknown error")}'
                print(error_msg)
                return jsonify({
                    'success': False, 
                    'error': error_msg
                }), 500
            
        except Exception as error:
            print(f'Error saving survey: {error}')
            return jsonify({'success': False, 'error': str(error)}), 500

    # Serve static files
    @app.route('/')
    @app.route('/survey')
    def index():
        return render_template('index.html')

    @app.route('/analytics')
    def serve_analytics():
        return render_template('analytics.html')

    @app.route('/<path:filename>')
    def serve_static(filename):
        return send_from_directory('.', filename)

    # API endpoints
    @app.route('/api/questions')
    def get_questions():
        try:
            question_data = generate()
            return jsonify(question_data)
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/surveys')
    def check_surveys():
        return jsonify({'status': 'ok'})

    # MongoDB management endpoints
    @app.route('/api/mongodb/status')
    def mongodb_status():
        """Check MongoDB connection status"""
        try:
            is_connected = mongodb_manager.is_connected()
            surveys_count = mongodb_manager.get_surveys_count() if is_connected else 0
            
            return jsonify({
                'connected': is_connected,
                'surveys_count': surveys_count,
                'database': os.getenv('MONGODB_DATABASE')
            })
        except Exception as e:
            return jsonify({
                'connected': False,
                'error': str(e)
            }), 500

    @app.route('/api/surveys/<survey_id>')
    def get_survey_by_id(survey_id):
        """Get a specific survey by ID"""
        try:
            result = mongodb_manager.get_survey_by_id(survey_id)
            
            if result["success"] and result["survey"]:
                return jsonify(result["survey"])
            elif result["success"] and not result["survey"]:
                return jsonify({'error': 'Survey not found'}), 404
            else:
                return jsonify({'error': result.get("error", "Unknown error")}), 500
                
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/analytics/data')
    def get_analytics_data():
        try:
            # Load data from MongoDB
            mongodb_result = mongodb_manager.get_all_surveys()
            
            if not mongodb_result["success"]:
                error_msg = f'Failed to load surveys from MongoDB: {mongodb_result.get("error", "Unknown error")}'
                print(error_msg)
                return jsonify({
                    'surveys': [],
                    'stats': {
                        'totalResponses': 0,
                        'totalAnswers': 0,
                        'positiveSentiment': 0,
                        'completionRate': 0,
                        'sentimentBreakdown': {'positive': 0, 'negative': 0, 'neutral': 0},
                        'dataSource': 'MongoDB (error)'
                    },
                    'chartData': {
                        'sentimentData': {'positive': 0, 'negative': 0, 'neutral': 0},
                        'questionData': {'labels': [], 'values': []},
                        'questionSentimentData': {}
                    },
                    'error': error_msg
                }), 500
            
            all_surveys = mongodb_result["surveys"]
            print(f"Loaded {len(all_surveys)} surveys from MongoDB")
            
            # Collect sentiment data from pre-computed SentiAnalysis fields
            positive_count = 0
            negative_count = 0
            neutral_count = 0
            total_responses_with_sentiment = 0
            
            # Also collect data for question-wise analysis
            question_sentiment = {}
            question_counts = {}
            
            for survey in all_surveys:
                for response in survey.get('responses', []):
                    question = response.get('question', 'Unknown')
                    answer = response.get('answer', '')
                    
                    # Count questions
                    question_counts[question] = question_counts.get(question, 0) + 1
                    
                    # Initialize question sentiment tracking
                    if question not in question_sentiment:
                        question_sentiment[question] = {
                            'positive': 0,
                            'negative': 0,
                            'neutral': 0,
                            'total': 0
                        }
                    
                    # Get sentiment from pre-computed SentiAnalysis field
                    senti_analysis = response.get('SentiAnalysis', {})
                    sentiment_label = senti_analysis.get('label', 'NEUTRAL')
                    
                    if sentiment_label == 'POSITIVE':
                        positive_count += 1
                        question_sentiment[question]['positive'] += 1
                    elif sentiment_label == 'NEGATIVE':
                        negative_count += 1
                        question_sentiment[question]['negative'] += 1
                    else:  # NEUTRAL or any other value
                        neutral_count += 1
                        question_sentiment[question]['neutral'] += 1
                    
                    question_sentiment[question]['total'] += 1
                    total_responses_with_sentiment += 1
            
            # If no pre-computed sentiment analysis exists, fall back to real-time analysis
            if total_responses_with_sentiment == 0:
                print("No pre-computed sentiment found, performing real-time analysis...")
                all_answers = []
                for survey in all_surveys:
                    for response in survey.get('responses', []):
                        all_answers.append(response.get('answer', ''))
                
                if all_answers:
                    try:
                        sentiment_results = get_sentiment(all_answers)
                        for result in sentiment_results:
                            label = result.get('label', 'NEUTRAL')
                            if label == 'POSITIVE':
                                positive_count += 1
                            elif label == 'NEGATIVE':
                                negative_count += 1
                            else:
                                neutral_count += 1
                        total_responses_with_sentiment = len(sentiment_results)
                    except Exception as e:
                        print(f'Error analyzing sentiment: {e}')
                        neutral_count = len(all_answers)
                        total_responses_with_sentiment = len(all_answers)
            
            # Calculate statistics
            total_surveys = len(all_surveys)
            positive_percentage = round((positive_count / total_responses_with_sentiment * 100) if total_responses_with_sentiment > 0 else 0)
            completion_rate = 100  # Assuming all loaded surveys are complete
            
            # Prepare chart data
            chart_data = {
                'sentimentData': {
                    'positive': positive_count,
                    'negative': negative_count,
                    'neutral': neutral_count
                },
                'questionData': {
                    'labels': list(question_counts.keys())[:10],  # Limit to top 10 questions
                    'values': list(question_counts.values())[:10]
                },
                'questionSentimentData': question_sentiment  # Question-wise sentiment breakdown
            }
            
            stats = {
                'totalResponses': total_surveys,
                'totalAnswers': total_responses_with_sentiment,
                'positiveSentiment': positive_percentage,
                'completionRate': completion_rate,
                'sentimentBreakdown': {
                    'positive': positive_count,
                    'negative': negative_count,
                    'neutral': neutral_count
                },
                'dataSource': 'MongoDB'
            }
            
            return jsonify({
                'surveys': all_surveys,
                'stats': stats,
                'chartData': chart_data
            })
            
        except Exception as e:
            print(f'Error generating analytics data: {e}')
            return jsonify({
                'surveys': [],
                'stats': {
                    'totalResponses': 0,
                    'totalAnswers': 0,
                    'positiveSentiment': 0,
                    'completionRate': 0,
                    'sentimentBreakdown': {'positive': 0, 'negative': 0, 'neutral': 0},
                    'dataSource': 'error'
                },
                'chartData': {
                    'sentimentData': {'positive': 0, 'negative': 0, 'neutral': 0},
                    'questionData': {'labels': [], 'values': []},
                    'questionSentimentData': {}
                }
            }), 500