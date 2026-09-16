import './App.css'
import { useState } from 'react'
import VoiceInput from './components/VoiceInput'
import DecisionTimeline from './components/DecisionTimeline'
import AnswerCard from './components/AnswerCard'
import AudioPlayer from './components/AudioPlayer'
import { getAnswer } from './api/services'
import { getUserFacingError } from './api/errors'
import { mockMeetings } from './mocks'
import type { Evidence, FinalAnswerOutput } from './types'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<FinalAnswerOutput | null>(null)
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAsk = async (nextQuestion: string) => {
    setQuestion(nextQuestion)
    setIsLoading(true)
    setError(null)
    setSelectedEvidence(null)

    try {
      const nextAnswer = await getAnswer(nextQuestion)
      setAnswer(nextAnswer)
    } catch (requestError) {
      console.error(requestError)
      setAnswer(null)
      setError(getUserFacingError(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  const selectedMeeting = selectedEvidence
    ? mockMeetings.find((meeting) => meeting.meeting_id === selectedEvidence.meeting_id)
    : undefined

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="AlphaForge home">
            <span className="brand-mark" aria-hidden="true">AF</span>
            <span>AlphaForge</span>
          </a>
          <div className="header-context">
            <span className="connection-dot" aria-hidden="true" />
            Mock memory online
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="intro-block">
          <div>
            <div className="eyebrow">Conversation memory / 01</div>
            <h1>Find the thread<br /><em>behind the decision.</em></h1>
          </div>
          <p>Ask a natural question about your meetings. AlphaForge connects the final answer to the moments that shaped it.</p>
        </section>

        <div className="workspace-grid">
          <VoiceInput question={question} isLoading={isLoading} onQuestionChange={setQuestion} onSubmit={handleAsk} />
          <div className="results-column">
            {isLoading && <div className="loading-state" role="status"><span className="loading-line" /> Searching meeting memory...</div>}
            {error && <div className="error-state" role="alert"><strong>Could not complete the search.</strong><span>{error}</span></div>}
            <AnswerCard answer={answer} />
            <DecisionTimeline evidence={answer?.evidence || []} selectedEvidence={selectedEvidence} onSelect={setSelectedEvidence} />
            <AudioPlayer url={selectedMeeting?.audio_url || undefined} seekTo={selectedEvidence?.start_time} meetingTitle={selectedEvidence?.meeting_title} />
          </div>
        </div>
      </main>
      <footer className="site-footer">AlphaForge / Conversation Memory Voice Agent <span>Contract-aligned prototype</span></footer>
    </div>
  )
}

export default App
