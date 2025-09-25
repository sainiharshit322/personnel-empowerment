import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronRightIcon, CheckIcon, ChevronLeftIcon } from "@heroicons/react/24/outline"


const Survey = () => {
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState([])
  const [useServerSaving, setUseServerSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showThankYou, setShowThankYou] = useState(false)
  const [fadeClass, setFadeClass] = useState("")
  const [surveyStats, setSurveyStats] = useState({
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
      await Promise.all([loadQuestions(), checkServerAvailability()])


      const savedResponses = localStorage.getItem("surveyResponses")
      const savedStats = localStorage.getItem("surveyStats")


      if (savedResponses) {
        setResponses(JSON.parse(savedResponses))
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


  const saveCurrentResponse = useCallback(() => {
    const answer = textareaRef.current?.value.trim() || ""


    const newResponses = [...responses]
    const questionTime = questionStartTimeRef.current ? Date.now() - questionStartTimeRef.current : 0


    newResponses[currentQuestion] = {
      questionNumber: currentQuestion + 1,
      question: questions[currentQuestion],
      answer: answer,
      timeSpent: questionTime,
      timestamp: new Date().toISOString(),
    }


    setResponses(newResponses)
    localStorage.setItem("surveyResponses", JSON.stringify(newResponses))


    const newStats = { ...surveyStats }
    newStats.timePerQuestion[currentQuestion] = questionTime
    setSurveyStats(newStats)
    localStorage.setItem("surveyStats", JSON.stringify(newStats))
  }, [currentQuestion, questions, responses, surveyStats])


  const handleInputChange = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }


    autoSaveTimeoutRef.current = setTimeout(() => {
      saveCurrentResponse()
    }, 1000)
  }, [saveCurrentResponse])


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


    const surveyData = {
      surveyId: generateSurveyId(),
      completedAt: new Date().toISOString(),
      totalQuestions: questions.length,
      responses: completedResponses,
      statistics: surveyStats,
    }


    if (useServerSaving) {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/save-survey", {
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
        localStorage.setItem("completedSurvey", JSON.stringify(surveyData))
      }
    } else {
      localStorage.setItem("completedSurvey", JSON.stringify(surveyData))
      console.log("Survey data saved locally:", surveyData)
    }
  }


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
    }
  }


  // Prevent data loss on page refresh
  useEffect(() => {
    const handleBeforeUnload = () => saveCurrentResponse()
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [saveCurrentResponse])


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


          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-indigo-400 mb-2">{completedResponses.length}</div>
            <div className="text-lg text-gray-300">Questions Answered</div>
            <div className="text-sm text-gray-400 mt-4">
              Completion rate: {Math.round((completedResponses.length / questions.length) * 100)}%
            </div>
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
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
              Interactive Survey
            </h1>
            <p className="text-gray-300 text-lg">Share your thoughts and experiences with us</p>
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


          {/* Main Survey Card */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-8 mb-6">
            <div className={`transition-all duration-300 ease-in-out ${fadeClass}`}>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-white leading-relaxed">
                  {questions[currentQuestion]}
                </h2>
              </div>


              {/* Input Area */}
              <div className="mb-6">
                <textarea
                  ref={textareaRef}
                  className="w-full p-4 border-2 border-gray-600 bg-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none text-gray-100 placeholder-gray-500"
                  rows="8"
                  placeholder="Your Answer"
                  defaultValue={currentResponse}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />


                <div className="flex justify-end items-center mt-2 text-sm text-gray-400">
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
                className={`w-4 h-4 rounded-full transition-all duration-200 hover:scale-110 ${
                  index === currentQuestion
                    ? "bg-indigo-500 ring-4 ring-indigo-800"
                    : responses[index]
                      ? "bg-green-500 hover:bg-green-400"
                      : "bg-gray-600 hover:bg-gray-500"
                }`}
                title={`Question ${index + 1}`}
              />
            ))}
          </div>


          <div className="text-center text-xs text-gray-500">
            <p>Keyboard shortcuts: Enter (next) • Ctrl+← → (navigate)</p>
          </div>
        </div>
      </div>
    </div>
  )
}


export default Survey
