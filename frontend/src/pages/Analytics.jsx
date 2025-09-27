import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { 
  ChartBarIcon, 
  FaceSmileIcon, 
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Analytics = () => {
  const [allResponses, setAllResponses] = useState([]);
  const [stats, setStats] = useState({
    totalResponses: 0,
    positiveSentiment: 0,
    completionRate: 0
  });
  const [chartData, setChartData] = useState({
    sentimentData: { positive: 0, negative: 0, neutral: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://127.0.0.1:5000/api/analytics/data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAllResponses(data.surveys || []);
      setStats(data.stats || {});
      setChartData(data.chartData || { sentimentData: { positive: 0, negative: 0, neutral: 0 } });
      
      setError(null);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError(error.message);
      
      const mockData = {
        surveys: [
          {
            surveyId: "1692789456123",
            completedAt: new Date().toISOString(),
            responses: [
              {
                questionNumber: 1,
                question: "What motivated you to apply for this position?",
                answer: "I'm passionate about AI and machine learning technologies.",
                SentiAnalysis: { label: "POSITIVE", confidence: 85 }
              },
              {
                questionNumber: 2,
                question: "Describe your experience with full-stack development.",
                answer: "I have 2 years of experience working with React, Node.js, and Python.",
                SentiAnalysis: { label: "NEUTRAL", confidence: 65 }
              }
            ]
          }
        ],
        stats: {
          totalResponses: 25,
          positiveSentiment: 68,
          completionRate: 87
        },
        chartData: {
          sentimentData: { positive: 17, negative: 3, neutral: 5 }
        }
      };
      
      setAllResponses(mockData.surveys);
      setStats(mockData.stats);
      setChartData(mockData.chartData);
    } finally {
      setIsLoading(false);
    }
  };

  const sentimentPieData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [
        chartData.sentimentData.positive,
        chartData.sentimentData.negative,
        chartData.sentimentData.neutral
      ],
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
      borderColor: '#374151',
      borderWidth: 2,
      hoverOffset: 4
    }]
  };

  const sentimentPieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { weight: 'bold' },
          color: '#E5E7EB'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#F9FAFB',
        bodyColor: '#E5E7EB',
        borderColor: '#6366F1',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const trendLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'];
  const trendData = [15, 20, 25, 22, chartData.sentimentData.positive];

  const happinessTrendData = {
    labels: trendLabels,
    datasets: [{
      label: 'Positive Responses',
      data: trendData,
      borderColor: '#6366F1',
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366F1',
      pointBorderColor: '#1F2937',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  const happinessTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time Period',
          font: { weight: 'bold' },
          color: '#E5E7EB'
        },
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Responses',
          font: { weight: 'bold' },
          color: '#E5E7EB'
        },
        ticks: {
          stepSize: 5,
          color: '#9CA3AF'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#F9FAFB',
        bodyColor: '#E5E7EB',
        borderColor: '#6366F1',
        borderWidth: 1
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getSentimentStyling = (sentimentLabel) => {
    const label = sentimentLabel || 'NEUTRAL';
    switch (label) {
      case 'POSITIVE':
        return {
          class: 'bg-green-900 text-green-300 border border-green-700',
          icon: '😊',
          display: 'POSITIVE'
        };
      case 'NEGATIVE':
        return {
          class: 'bg-red-900 text-red-300 border border-red-700',
          icon: '😞',
          display: 'NEGATIVE'
        };
      default:
        return {
          class: 'bg-gray-700 text-gray-300 border border-gray-600',
          icon: '😐',
          display: 'NEUTRAL'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-indigo-500 mx-auto mb-4"></div>
            <div
              className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-500 animate-spin mx-auto"
              style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
            ></div>
          </div>
          <p className="text-gray-200 text-lg font-medium">Loading analytics data...</p>
          <p className="text-gray-400 text-sm mt-2">Processing survey responses and sentiment analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Employee Feedback Analytics Dashboard
          </h2>
          <p className="text-gray-300 text-lg">
            Comprehensive insights from survey responses and sentiment analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-900 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Responses</p>
                <p className="text-3xl font-bold text-white">{stats.totalResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-900 rounded-lg">
                <FaceSmileIcon className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Positive Sentiment</p>
                <p className="text-3xl font-bold text-white">{stats.positiveSentiment}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-900 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Completion Rate</p>
                <p className="text-3xl font-bold text-white">{stats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Sentiment Distribution
            </h3>
            <div className="h-80">
              <Pie data={sentimentPieData} options={sentimentPieOptions} />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Employee Happiness Index Trend
            </h3>
            <div className="h-80">
              <Line data={happinessTrendData} options={happinessTrendOptions} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">
              Recent User Responses
            </h3>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="text-center py-8">
                <div className="text-red-400 mb-2">⚠️ Error loading data</div>
                <p className="text-gray-400">Showing demo data instead</p>
              </div>
            )}
            
            {allResponses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No survey responses found.
              </div>
            ) : (
              <div className="space-y-6">
                {allResponses.slice(0, 5).map((survey, surveyIndex) => {
                  const { date, time } = formatDateTime(survey.completedAt);
                  
                  return (
                    <div key={survey.surveyId} className="border border-gray-600 rounded-lg p-6 bg-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-gray-600">
                        <h4 className="text-lg font-semibold text-white">
                          Survey Response {surveyIndex + 1}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2 sm:mt-0">
                          <div className="flex items-center">
                            <span className="font-medium">ID:</span>
                            <span className="ml-1">{survey.surveyId}</span>
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span>{time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {survey.responses.map((response, responseIndex) => {
                          const sentiment = getSentimentStyling(response.SentiAnalysis?.label);
                          
                          return (
                            <div key={responseIndex} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                              <div className="mb-3">
                                <p className="font-medium text-white">
                                  <span className="text-indigo-400">Q{response.questionNumber}:</span>{' '}
                                  {response.question}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <p className="text-gray-300 leading-relaxed">
                                  {response.answer}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${sentiment.class}`}>
                                  <span className="mr-1">{sentiment.icon}</span>
                                  <span>{sentiment.display}</span>
                                  <span className="ml-2 font-semibold">
                                    {response.SentiAnalysis?.confidence || 50}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;