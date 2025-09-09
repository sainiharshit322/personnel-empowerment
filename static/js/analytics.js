// Analytics Dashboard JavaScript
let allResponses = [];
let sentimentChart = null;
let responseChart = null;

// Dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadAnalyticsData();
});

// All survey data
async function loadAnalyticsData() {
    try {
        const response = await fetch('/api/analytics/data');
        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        allResponses = data.surveys || [];
        
        updateSummaryStats(data.stats);
        createCharts(data.chartData);
        displayUserResponses(allResponses);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        document.getElementById('responses-container').innerHTML = 
            '<div class="error">Failed to load analytics data. Please try again later.</div>';
    }
}

// Summary statistics
function updateSummaryStats(stats) {
    document.getElementById('total-responses').textContent = stats.totalResponses || 0;
    document.getElementById('avg-sentiment').textContent = `${stats.positiveSentiment || 0}%`;
    document.getElementById('completion-rate').textContent = `${stats.completionRate || 0}%`;
    
    // Additional sentiment breakdown info if available
    if (stats.sentimentBreakdown) {
        const breakdown = stats.sentimentBreakdown;
        const totalAnswers = breakdown.positive + breakdown.negative + breakdown.neutral;
    }
}

// Charts
function createCharts(chartData) {
    createSentimentPieChart(chartData.sentimentData);
    createResponseBarChart(chartData.sentimentData);
}

// Sentiment pie chart
function createSentimentPieChart(sentimentData) {
    const ctx = document.getElementById('sentimentPieChart').getContext('2d');
    
    if (sentimentChart) {
        sentimentChart.destroy();
    }
    
    sentimentChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                data: [
                    sentimentData.positive || 0,
                    sentimentData.negative || 0,
                    sentimentData.neutral || 0
                ],
                backgroundColor: [
                    '#4CAF50',
                    '#f44336',
                    '#FF9800'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#E0E0E0',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Employee happiness index trend line chart
function createResponseBarChart(sentimentData) {
    const ctx = document.getElementById('responseBarChart').getContext('2d');
    
    if (responseChart) {
        responseChart.destroy();
    }
    
    // Mock trend data - this will be replaced with real trend data from backend
    const trendLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'];
    const trendData = [20, 25, 30, 35, sentimentData.positive || 0];
    
    responseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [
                {
                    // label: 'Positive',
                    data: trendData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointRadius: 3
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time Period',
                        color: '#E0E0E0',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#E0E0E0'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Responses',
                        color: '#E0E0E0',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        color: '#E0E0E0'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value} responses`;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Individual user responses display
function displayUserResponses(responses) {
    const container = document.getElementById('responses-container');
    
    if (!responses || responses.length === 0) {
        container.innerHTML = '<div class="no-data">No survey responses found.</div>';
        return;
    }
    
    let html = '';
    
    responses.forEach((survey, index) => {
        const completedDate = new Date(survey.completedAt).toLocaleDateString();
        const completedTime = new Date(survey.completedAt).toLocaleTimeString();
        
        html += `
            <div class="response-card">
                <div class="response-header">
                    <h4>Survey Response ${index + 1}</h4>
                    <div class="response-meta">
                        <span class="survey-id">ID: ${survey.surveyId}</span>
                        <span class="completion-date">${completedDate} at ${completedTime}</span>
                    </div>
                </div>
                <div class="response-content">
        `;
        
        survey.responses.forEach((response, qIndex) => {
            const sentiAnalysis = response.SentiAnalysis || {};
            const sentimentLabel = sentiAnalysis.label || 'NEUTRAL';
            const sentimentScore = sentiAnalysis.confidence || 50;
            
            // Sentiment color and icon
            let sentimentClass = 'sentiment-neutral';
            let sentimentIcon = '😐';
            let displayLabel = 'NEUTRAL';
            
            if (sentimentLabel === 'POSITIVE') {
                sentimentClass = 'sentiment-positive';
                sentimentIcon = '😊';
                displayLabel = 'POSITIVE';
            } else if (sentimentLabel === 'NEGATIVE') {
                sentimentClass = 'sentiment-negative';
                sentimentIcon = '😞';
                displayLabel = 'NEGATIVE';
            }
            
            html += `
                <div class="question-response">
                    <div class="question-text">
                        <strong>Q${response.questionNumber}:</strong> ${response.question}
                    </div>
                    <div class="answer-text">
                        ${response.answer}
                    </div>
                    <div class="sentiment-analysis ${sentimentClass}">
                        <span class="sentiment-icon">${sentimentIcon}</span>
                        <span class="sentiment-label">${displayLabel}</span>
                        <span class="sentiment-score">${sentimentScore}%</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}