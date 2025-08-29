// Enhanced version with server-side saving capability
// Survey questions

// const questions = [
//     "How satisfied are you with your current work-life balance?",
//     "How would you rate the communication from your immediate supervisor?",
//     "Do you feel your workload is manageable and reasonable?"
// ];

let questions = [];

// Survey state
let currentQuestion = 0;
let responses = [];
let useServerSaving = false;

// Check if server is available
async function checkServerAvailability() {
    try {
        const response = await fetch('/api/surveys');
        useServerSaving = response.ok;
        if (useServerSaving) {
            console.log('Server detected - using server-side saving');
        } else {
            console.log('Server not available - using client-side saving');
        }
    } catch (error) {
        useServerSaving = false;
        console.log('Server not available - using client-side saving');
    }
}

// Fetch questions from Python API
async function loadQuestions() {
    try {
        const response = await fetch('/api/questions');
        if (!response.ok) {
            throw new Error('Failed to fetch questions');
        }
        const data = await response.json();
        questions = data.questions;
        console.log(`Loaded ${questions.length} questions from Python API`);
    } catch (error) {
        console.error('Failed to load questions:', error);
        // Fallback questions
        // questions = [
        //     "How satisfied are you with your current work-life balance?",
        //     "How would you rate the communication from your immediate supervisor?",
        //     "Do you feel your workload is manageable and reasonable?"
        // ];
    }
}

// DOM elements
const questionNumber = document.getElementById('question-number');
const questionText = document.getElementById('question-text');
const userInput = document.getElementById('user-input');
const nextBtn = document.getElementById('next-btn');
const finishBtn = document.getElementById('finish-btn');
const progress = document.getElementById('progress');
const surveyBox = document.querySelector('.survey-box');
const thankYou = document.getElementById('thank-you');

// Initialize the survey
async function initializeSurvey() {
    await loadQuestions();
    await checkServerAvailability();
    updateQuestion();
}

// Question display
function updateQuestion() {
    questionNumber.textContent = `Question ${currentQuestion + 1} of ${questions.length}`;
    questionText.textContent = questions[currentQuestion];
    
    // Progress bar
    const progressPercent = ((currentQuestion + 1) / questions.length) * 100;
    progress.style.width = `${progressPercent}%`;
    
    // Load saved response if it exists
    if (responses[currentQuestion]) {
        userInput.value = responses[currentQuestion].answer;
    } else {
        userInput.value = '';
    }
    
    // Show finish button on last question
    if (currentQuestion === questions.length - 1) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        finishBtn.style.display = 'none';
    }
    
    // Focus on textarea
    userInput.focus();
}

// Save current response
function saveCurrentResponse() {
    const answer = userInput.value.trim();
    
    responses[currentQuestion] = {
        questionNumber: currentQuestion + 1,
        question: questions[currentQuestion],
        answer: answer,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage as backup
    localStorage.setItem('surveyResponses', JSON.stringify(responses));
}

// Save responses to server or download as file
// async function saveToJsonFile() {
//     const surveyData = {
//         surveyId: generateSurveyId(),
//         completedAt: new Date().toISOString(),
//         totalQuestions: questions.length,
//         responses: responses.filter(response => response !== undefined)
//     };
    
//     if (useServerSaving) {
//         try {
//             const response = await fetch('/api/save-survey', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(surveyData)
//             });
            
//             const result = await response.json();
//             if (result.success) {
//                 console.log('Survey saved to server:', result.filename);
//             } else {
//                 throw new Error(result.error);
//             }
//         } catch (error) {
//             console.error('Failed to save to server, falling back to download:', error);
//             downloadSurveyData(surveyData);
//         }
//     } else {
//         downloadSurveyData(surveyData);
//     }
// }

// Download survey data as JSON file
// function downloadSurveyData(surveyData) {
//     const dataStr = JSON.stringify(surveyData, null, 2);
//     const dataBlob = new Blob([dataStr], {type: 'application/json'});
//     const url = URL.createObjectURL(dataBlob);
    
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `tsr_survey_${surveyData.surveyId}.json`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     URL.revokeObjectURL(url);
// }

// Generate unique survey ID
function generateSurveyId() {
    return 'survey_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

// Navigate to next question
function nextQuestion() {
    // Save current response
    saveCurrentResponse();
    
    // Add fade out animation
    const questionContainer = document.querySelector('.question-container');
    questionContainer.classList.add('question-fade-out');
    
    setTimeout(() => {
        currentQuestion++;
        updateQuestion();
        
        // Add fade in animation
        questionContainer.classList.remove('question-fade-out');
        questionContainer.classList.add('question-fade-in');
        
        setTimeout(() => {
            questionContainer.classList.remove('question-fade-in');
        }, 300);
    }, 150);
}

// Finish survey
async function finishSurvey() {
    // Save final response
    saveCurrentResponse();
    
    // Hide survey box and show thank you message
    surveyBox.style.display = 'none';
    thankYou.style.display = 'block';
    
    // Save survey data
    await saveToJsonFile();
    
    // Clear localStorage
    localStorage.removeItem('surveyResponses');
    
    console.log('Survey completed! Total responses:', responses.length);
}

// Event listeners
nextBtn.addEventListener('click', () => {
    if (currentQuestion < questions.length - 1) {
        nextQuestion();
    }
});

finishBtn.addEventListener('click', finishSurvey);

// Allow Enter key to go to next question (Shift+Enter for new line)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (currentQuestion < questions.length - 1) {
            nextQuestion();
        } else {
            finishSurvey();
        }
    }
});

// Auto-save responses as user types
userInput.addEventListener('input', () => {
    // Debounce auto-save
    clearTimeout(userInput.autoSaveTimeout);
    userInput.autoSaveTimeout = setTimeout(() => {
        saveCurrentResponse();
    }, 1000);
});

// Initialize survey when page loads
document.addEventListener('DOMContentLoaded', initializeSurvey);

// Prevent page refresh from losing data
window.addEventListener('beforeunload', (e) => {
    saveCurrentResponse();
});