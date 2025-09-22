import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronRightIcon, CheckIcon, ChevronLeftIcon, BookmarkIcon, ClockIcon } from "@heroicons/react/24/outline"

const Survey = () => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState([])
  const [useServerSaving, setUseServerSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [fadeClass, setFadeClass] = useState("")
  const [startTime, setStartTime] = useState(null)
  const [timeSpent, setTimeSpent] = useState(0)
  const [wordCount, setWordCount] = useState(0)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState(new Set())
  const [surveyStats, setSurveyStats] = useState({
    totalWords: 0,
    averageWordsPerQuestion: 0,
    timePerQuestion: [],
  })

  const textareaRef = useRef(null)
  const autoSaveTimeoutRef = useRef(null)
  const questionStartTimeRef = useRef(null)

  const checkServerAvailability = useCallback(async () => {
    let retries = 3
    while (retries > 0) {
      try {
        const response = await fetch("/api/surveys", { timeout: 5000 })
        const isAvailable = response.ok
        setUseServerSaving(isAvailable)
        console.log(
          isAvailable
            ? "Server detected - using server-side saving"
            : "Server not available - using client-side saving",
        )
        return
      } catch (error) {
        retries--
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }
    setUseServerSaving(false)
    console.log("Server not available after retries - using client-side saving")
  }, [])

  const loadQuestions = useCallback(async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/questions")
      if (!response.ok) throw new Error("Failed to fetch questions")

      const data = await response.json()
      setQuestions(data.questions)
      console.log(`Loaded ${data.questions.length} questions from Python API`)
    } catch (error) {
      console.error("Failed to load questions:", error)
      setQuestions([
        "What motivated you to apply for this position?",
        "Describe your experience with full-stack development and your preferred technologies.",
        "How do you approach problem-solving when faced with a challenging technical issue?",
        "Tell us about a project you're particularly proud of and what made it successful.",
        "How do you stay updated with new technologies and industry trends?",
        "Describe your experience working in a team environment and your collaboration style.",
        "What are your career goals for the next 5 years and how does this role fit into them?",
        "How do you handle feedback and criticism in a professional setting?",
      ])
    }
  }, [])

  useEffect(() => {
    const initializeSurvey = async () => {
      setIsLoading(true)
      setStartTime(Date.now())
      await Promise.all([loadQuestions(), checkServerAvailability()])

      const savedResponses = localStorage.getItem("surveyResponses")
      const savedBookmarks = localStorage.getItem("surveyBookmarks")
      const savedStats = localStorage.getItem("surveyStats")

      if (savedResponses) {
        setResponses(JSON.parse(savedResponses))
      }
      if (savedBookmarks) {
        setBookmarkedQuestions(new Set(JSON.parse(savedBookmarks)))
      }
      if (savedStats) {
        setSurveyStats(JSON.parse(savedStats))
      }

      setIsLoading(false)
      questionStartTimeRef.current = Date.now()
    }

    initializeSurvey()
  }, [loadQuestions, checkServerAvailability])

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
      }, 300)
    }
  }, [currentQuestion, isLoading])

  useEffect(() => {
    const timer = setInterval(() => {
      if (startTime && !showThankYou) {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime, showThankYou])

  const saveCurrentResponse = useCallback(() => {
    const answer = textareaRef.current?.value.trim() || ""
    const words = answer.split(/\s+/).filter((word) => word.length > 0).length

    const newResponses = [...responses]
    const questionTime = questionStartTimeRef.current ? Date.now() - questionStartTimeRef.current : 0

    newResponses[currentQuestion] = {
      questionNumber: currentQuestion + 1,
      question: questions[currentQuestion],
      answer: answer,
      wordCount: words,
      timeSpent: questionTime,
      timestamp: new Date().toISOString(),
    }

    setResponses(newResponses)
    localStorage.setItem("surveyResponses", JSON.stringify(newResponses))

    // Update statistics
    const newStats = { ...surveyStats }
    newStats.timePerQuestion[currentQuestion] = questionTime
    setSurveyStats(newStats)
    localStorage.setItem("surveyStats", JSON.stringify(newStats))
  }, [currentQuestion, questions, responses, surveyStats])

  const handleInputChange = useCallback(() => {
    const text = textareaRef.current?.value || ""
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
    setWordCount(text.trim() === "" ? 0 : words)

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveCurrentResponse()
    }, 1000)
  }, [saveCurrentResponse])

  const toggleBookmark = useCallback(() => {
    const newBookmarks = new Set(bookmarkedQuestions)
    if (newBookmarks.has(currentQuestion)) {
      newBookmarks.delete(currentQuestion)
    } else {
      newBookmarks.add(currentQuestion)
    }
    setBookmarkedQuestions(newBookmarks)
    localStorage.setItem("surveyBookmarks", JSON.stringify([...newBookmarks]))
  }, [bookmarkedQuestions, currentQuestion])

  const navigateToQuestion = useCallback(
    (questionIndex) => {
      if (questionIndex === currentQuestion) return

      saveCurrentResponse()
      setFadeClass("opacity-0 transform scale-95")

      setTimeout(() => {
        setCurrentQuestion(questionIndex)
        questionStartTimeRef.current = Date.now()
        setFadeClass("opacity-100 transform scale-100")

        setTimeout(() => {
          setFadeClass("")
        }, 300)
      }, 150)
    },
    [currentQuestion, saveCurrentResponse],
  )

  const generateSurveyId = () => Date.now().toString()

  const saveToDatabase = async () => {
    const completedResponses = responses.filter((response) => response !== undefined)
    const totalWords = completedResponses.reduce((sum, response) => sum + (response.wordCount || 0), 0)

    const surveyData = {
      surveyId: generateSurveyId(),
      completedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      totalTimeSpent: timeSpent,
      totalWords: totalWords,
      averageWordsPerQuestion: Math.round(totalWords / completedResponses.length) || 0,
      bookmarkedQuestions: [...bookmarkedQuestions],
      responses: completedResponses,
      statistics: surveyStats,
    }

    if (useServerSaving) {
      try {
        const response = await fetch("/api/save-survey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(surveyData),
        })

        const result = await response.json()
        if (result.success) {
          console.log("Survey saved to server:", result.filename)
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        console.error("Failed to save to server:", error)
        // Fallback to local storage
        localStorage.setItem("completedSurvey", JSON.stringify(surveyData))
      }
    } else {
      localStorage.setItem("completedSurvey", JSON.stringify(surveyData))
      console.log("Survey data saved locally:", surveyData)
    }
  }

  // Navigate to next question with animation
  const nextQuestion = () => {
    saveCurrentResponse()

    setFadeClass("opacity-0 transform translate-x-4")

    setTimeout(() => {
      setCurrentQuestion((prev) => prev + 1)
      questionStartTimeRef.current = Date.now()
      setFadeClass("opacity-100 transform translate-x-0")

      setTimeout(() => {
        setFadeClass("")
      }, 300)
    }, 150)
  }

  const previousQuestion = () => {
    if (currentQuestion === 0) return

    saveCurrentResponse()
    setFadeClass("opacity-0 transform -translate-x-4")

    setTimeout(() => {
      setCurrentQuestion((prev) => prev - 1)
      questionStartTimeRef.current = Date.now()
      setFadeClass("opacity-100 transform translate-x-0")

      setTimeout(() => {
        setFadeClass("")
      }, 300)
    }, 150)
  }

  const finishSurvey = async () => {
    setIsSubmitting(true)
    saveCurrentResponse()

    await saveToDatabase()
    localStorage.removeItem("surveyResponses")
    localStorage.removeItem("surveyBookmarks")

    setIsSubmitting(false)
    setShowThankYou(true)

    console.log("Survey completed! Total responses:", responses.length)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (currentQuestion < questions.length - 1) {
        nextQuestion()
      } else {
        finishSurvey()
      }
    } else if (e.key === "ArrowLeft" && e.ctrlKey && currentQuestion > 0) {
      e.preventDefault()
      previousQuestion()
    } else if (e.key === "ArrowRight" && e.ctrlKey && currentQuestion < questions.length - 1) {
      e.preventDefault()
      nextQuestion()
    } else if (e.key === "b" && e.ctrlKey) {
      e.preventDefault()
      toggleBookmark()
    }
  }

  // Prevent data loss on page refresh
  useEffect(() => {
    const handleBeforeUnload = () => saveCurrentResponse()
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [saveCurrentResponse])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Loading state
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
          <p className="text-gray-200 text-lg font-medium">Loading your personalized survey...</p>
          <p className="text-gray-400 text-sm mt-2">Preparing questions and checking connectivity</p>
        </div>
      </div>
    )
  }

  if (showThankYou) {
    const completedResponses = responses.filter((r) => r !== undefined)
    const totalWords = completedResponses.reduce((sum, response) => sum + (response.wordCount || 0), 0)

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Thank You!</h2>
          <p className="text-xl text-gray-300 mb-8">
            Your responses have been submitted successfully. We appreciate your time and thoughtful feedback.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-indigo-400">{completedResponses.length}</div>
              <div className="text-sm text-gray-400">Questions Answered</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-400">{totalWords}</div>
              <div className="text-sm text-gray-400">Total Words</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-400">{formatTime(timeSpent)}</div>
              <div className="text-sm text-gray-400">Time Spent</div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-orange-400">{bookmarkedQuestions.size}</div>
              <div className="text-sm text-gray-400">Bookmarked</div>
            </div>
          </div>

          <div className="text-sm text-gray-400 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
            <p className="font-medium mb-2 text-white">Survey Completion Summary</p>
            <p>Average words per question: {Math.round(totalWords / completedResponses.length) || 0}</p>
            <p>Completion rate: {Math.round((completedResponses.length / questions.length) * 100)}%</p>
          </div>
        </div>
      </div>
    )
  }

  const progressPercent = ((currentQuestion + 1) / questions.length) * 100
  const currentResponse = responses[currentQuestion]?.answer || ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Interactive Survey
            </h1>
            <p className="text-gray-300 text-lg">Share your thoughts and experiences with us</p>

            <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>{formatTime(timeSpent)}</span>
              </div>
              <div className="flex items-center gap-1">
                <BookmarkIcon className="w-4 h-4" />
                <span>{bookmarkedQuestions.size} bookmarked</span>
              </div>
              <div>
                <span>{wordCount} words</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>
                Question {currentQuestion + 1} of {questions.length}
              </span>
              <span>{Math.round(progressPercent)}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 sticky top-8">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <span>Questions</span>
                  <button
                    onClick={() => setShowBookmarks(!showBookmarks)}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      showBookmarks ? "bg-yellow-900 text-yellow-300" : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {showBookmarks ? "All" : "Bookmarked"}
                  </button>
                </h3>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {questions.map((_, index) => {
                    if (showBookmarks && !bookmarkedQuestions.has(index)) return null

                    return (
                      <button
                        key={index}
                        onClick={() => navigateToQuestion(index)}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                          index === currentQuestion
                            ? "bg-indigo-900 text-indigo-200 border-l-4 border-indigo-400"
                            : responses[index]
                              ? "bg-green-900 text-green-300 hover:bg-green-800"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        <span className="font-medium">{index + 1}</span>
                        {bookmarkedQuestions.has(index) && <BookmarkIcon className="w-3 h-3 text-yellow-400" />}
                        {responses[index] && <CheckIcon className="w-3 h-3 text-green-400" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Main Survey Card */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-8 mb-6">
                <div className={`transition-all duration-300 ease-in-out ${fadeClass}`}>
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-semibold text-white leading-relaxed flex-1 pr-4">
                      {questions[currentQuestion]}
                    </h2>
                    <button
                      onClick={toggleBookmark}
                      className={`p-2 rounded-lg transition-colors ${
                        bookmarkedQuestions.has(currentQuestion)
                          ? "bg-yellow-900 text-yellow-400 hover:bg-yellow-800"
                          : "bg-gray-700 text-gray-500 hover:bg-gray-600"
                      }`}
                      title="Bookmark this question"
                    >
                      <BookmarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Input Area */}
                  <div className="mb-6">
                    <textarea
                      ref={textareaRef}
                      className="w-full p-4 border-2 border-gray-600 bg-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none text-gray-100 placeholder-gray-500"
                      rows="8"
                      placeholder="Share your thoughts here... 

Tips:
• Press Enter to continue to next question
• Shift+Enter for new line
• Ctrl+← → to navigate between questions
• Ctrl+B to bookmark this question"
                      defaultValue={currentResponse}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                    />

                    <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                      <span>{wordCount} words</span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Auto-saving...
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                      {currentQuestion > 0 && (
                        <button
                          onClick={previousQuestion}
                          className="flex items-center gap-2 bg-gray-700 text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200 font-medium"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                          Previous
                        </button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {currentQuestion < questions.length - 1 ? (
                        <button
                          onClick={nextQuestion}
                          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          Next
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={finishSurvey}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Submitting...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              Complete Survey
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-3 mb-4">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`relative w-4 h-4 rounded-full transition-all duration-200 hover:scale-110 ${
                      index === currentQuestion
                        ? "bg-indigo-500 ring-4 ring-indigo-800"
                        : responses[index]
                          ? "bg-green-500 hover:bg-green-400"
                          : "bg-gray-600 hover:bg-gray-500"
                    }`}
                    title={`Question ${index + 1}${bookmarkedQuestions.has(index) ? " (Bookmarked)" : ""}`}
                  >
                    {bookmarkedQuestions.has(index) && (
                      <BookmarkIcon className="w-2 h-2 text-yellow-400 absolute -top-1 -right-1" />
                    )}
                  </button>
                ))}
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>Keyboard shortcuts: Enter (next) • Ctrl+← → (navigate) • Ctrl+B (bookmark)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Survey
