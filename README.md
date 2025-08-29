# Personnel Empowerment

![Python](https://img.shields.io/badge/python-3.12-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.1.2-green.svg)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange.svg)
![License](https://img.shields.io/badge/license-Custom-blue.svg)

A comprehensive AI-powered employee engagement platform that leverages machine learning for sentiment analysis and automated survey question generation to help organizations better understand and improve their workplace culture.

## 🚀 Features

- **AI-Generated Survey Questions**: Automatically generate contextual employee engagement questions using Google's Gemini AI
- **Real-time Sentiment Analysis**: Analyze employee feedback using advanced NLP models (BertTweet)
- **Interactive Dashboard**: Web-based interface for survey management and analytics
- **MongoDB Integration**: Secure data storage and retrieval
- **Responsive Design**: Mobile-friendly frontend interface
- **Analytics Dashboard**: Comprehensive insights and visualizations

## 🔧 Technologies Used

### Backend
- **Python 3.12+**
- **Flask** - Web framework
- **TensorFlow/PyTorch** - Machine learning frameworks
- **Transformers** - Hugging Face transformers library
- **Google Gemini AI** - Question generation
- **MongoDB** - Database
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5/CSS3**
- **Vanilla JavaScript**
- **Responsive Design**

### AI/ML Models
- **finiteautomata/bertweet-base-sentiment-analysis** - Sentiment analysis
- **Google Gemini 2.0 Flash Lite** - Question generation

## ⚡ Quick Start

### Prerequisites

- Python 3.12+
- MongoDB instance
- Google AI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iam-tsr/personnel-empowerment.git
   cd personnel-empowerment
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   GENAI_API_KEY=your_google_ai_api_key
   MONGODB_URI=your_mongodb_connection_string
   ```

5. **Run the application**
   ```bash
   python main.py
   ```

6. **Access the application**
   - Survey Interface: `http://localhost:5000`
   - Analytics Dashboard: `http://localhost:5000/analytics`

## 📊 API Endpoints

### Survey Management
- `POST /api/save-survey` - Save survey responses with sentiment analysis
- `GET /api/generate-questions` - Generate AI-powered survey questions

### Analytics
- `GET /api/analytics` - Retrieve survey analytics and insights
- `GET /api/sentiment-trends` - Get sentiment analysis trends

## 🤖 AI Features

### Question Generation
The platform uses Google's Gemini AI to generate contextual employee engagement questions focusing on:
- Employee Engagement Surveys
- Manager/Team Lead Feedback
- Culture Assessment
- Goal Alignment

### Sentiment Analysis
Real-time sentiment analysis of employee responses using:
- **Model**: `finiteautomata/bertweet-base-sentiment-analysis`
- **Capabilities**: Positive, Negative, Neutral sentiment classification
- **Real-time Processing**: Immediate feedback on survey responses

## 📈 Usage Examples

### Generate Survey Questions
```python
from backend.services.qa_gen import generate

# Generate 3 engagement questions for your company
questions = generate()
```

### Analyze Sentiment
```python
from backend.services.sentiment_analysis import get_sentiment

# Analyze sentiment of feedback
result = get_sentiment("This is a great place to work!")
# Returns: [{'label': 'POSITIVE', 'score': 0.9998}]
```

## 🔒 Security & Privacy

- Secure API key management via environment variables
- CORS protection for cross-origin requests
- Data encryption in transit
- Privacy-compliant data handling

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under a Custom Non-Commercial License - see the [LICENSE](LICENSE) file for details.

**Note**: Commercial use is restricted. For commercial licensing inquiries, please contact the project maintainer.

## 🙏 Acknowledgments

- Google AI for Gemini API
- Hugging Face for transformer models
- MongoDB for database solutions
- Flask community for the excellent framework

---

**Built with ❤️ by TSR for better workplace engagement**