import { useState, useRef, useCallback, useEffect } from 'react'
import Icon from '../Icon'
import AiSymbol from './AiSymbol'

/**
 * Chat composer strip with optional quick suggestions, send control, sources affordance, and privacy disclaimer.
 *
 * When `onVoiceToggle` is provided, the mic button records via MediaRecorder
 * and transcribes through the dev-time `/api/transcribe` proxy (which calls
 * ElevenLabs Scribe). Click the mic to start recording, click again to stop;
 * the resulting transcript is appended into the textarea so the user can
 * edit before sending. `voiceActive` / `onVoiceToggle` are kept on the public
 * API for backwards compatibility — the parent's voiceActive prop is honored
 * for visual state when the user is NOT actively recording, but the live
 * recording / transcribing states drive the icon during a session.
 *
 * @param {Object} props - Composer configuration and callbacks for the AI footer region.
 * @param {function(string): void} [props.onSend] - Called with trimmed message text when sending from textarea, Enter, or a suggestion chip.
 * @param {boolean} [props.disabled=false] - Disables the textarea and send affordance when true.
 * @param {boolean} [props.processing=false] - When true, replaces the input row with a processing state and hides suggestions.
 * @param {string[]} [props.suggestions=[]] - Quick-reply strings rendered as chips above the composer when not processing.
 * @param {string} [props.placeholder='Ask AI Assistant'] - Placeholder for the auto-growing message textarea.
 * @param {boolean} [props.voiceActive=false] - Optional parent-controlled "voice on" visual state (purely cosmetic when not recording).
 * @param {function(boolean): void} [props.onVoiceToggle] - When provided, enables the mic button. Called with `true` when recording starts and `false` when it stops, so the parent can mirror state if needed.
 * @param {boolean} [props.fillContainer=false] - Removes composer width caps so the footer fills its parent.
 * @param {string} [props.className=''] - Extra classes merged onto the root `ai-footer` container.
 * @param {string} [props.initialText] - Optional value pushed into the textarea whenever `prefillKey` changes. Use together with a parent-controlled key bump (e.g. an incrementing counter) to drop a fresh prompt into the composer without hijacking the user's in-progress edits.
 * @param {string|number} [props.prefillKey] - Sentinel that tells the composer to replace its current text with `initialText`. Each unique value triggers exactly one prefill, so parents can re-trigger the same prompt by bumping the key.
 * @example
 * <AiFooter onSend={(msg) => console.log(msg)} suggestions={['Summarize', 'Next steps']} />
 */
function AiFooter({
  onSend,
  disabled = false,
  processing = false,
  suggestions = [],
  placeholder = 'Ask AI Assistant',
  voiceActive = false,
  onVoiceToggle,
  fillContainer = false,
  className = '',
  initialText = '',
  prefillKey,
}) {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef(null)

  /* Watch for parent-driven prefill triggers. A bumped `prefillKey`
     replaces whatever's in the textarea with the latest `initialText` so
     features like a "Load example" button can drop a prompt into the
     composer on demand. We compare against the previous key (rather than
     re-running on every `initialText` change) so editing the controlled
     prompt elsewhere doesn't repeatedly clobber the user's typing. */
  const previousPrefillKeyRef = useRef(prefillKey)
  useEffect(() => {
    if (prefillKey !== undefined && prefillKey !== previousPrefillKeyRef.current) {
      setText(initialText)
      previousPrefillKeyRef.current = prefillKey
    }
  }, [prefillKey, initialText])

  /* Live mic state. Held inside AiFooter so the recording lifecycle is
     centralized — every place that mounts AiFooter (chat composer, form
     landing, side-panel mini-assistant) gets the same behavior for free. */
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [voiceError, setVoiceError] = useState('')

  const mediaRecorderRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioStreamRef = useRef(null)

  const autoResize = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [])

  useEffect(autoResize, [text, autoResize])

  /* Always release the mic if the component unmounts mid-recording, so
     the browser's tab indicator clears and we don't leak a hot stream. */
  useEffect(() => {
    return () => {
      try {
        speechRecognitionRef.current?.stop()
      } catch {
        /* SpeechRecognition.stop can throw after it has already ended; ignore. */
      }
      speechRecognitionRef.current = null
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop()
        }
      } catch {
        /* MediaRecorder.stop can throw if state transitioned mid-call; ignore. */
      }
      audioStreamRef.current?.getTracks().forEach((t) => t.stop())
      audioStreamRef.current = null
    }
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled || processing) return
    onSend?.(trimmed)
    setText('')
  }, [text, disabled, processing, onSend])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  /* Pick a MediaRecorder mimeType the browser actually supports. Chrome
     prefers audio/webm with Opus; Safari needs audio/mp4. Defaulting to
     `''` lets MediaRecorder pick its own default if neither matches. */
  const pickRecorderMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return ''
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ]
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported?.(c)) return c
    }
    return ''
  }, [])

  const stopMicTracks = useCallback(() => {
    audioStreamRef.current?.getTracks().forEach((t) => t.stop())
    audioStreamRef.current = null
  }, [])

  const transcribeBlob = useCallback(async (blob) => {
    const chatApiUrl = import.meta.env.VITE_CHAT_API_URL
    const transcribeApiUrl =
      import.meta.env.VITE_TRANSCRIBE_API_URL ||
      (chatApiUrl ? `${chatApiUrl.replace(/\/$/, '')}/transcribe` : '/api/transcribe')

    const res = await fetch(transcribeApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/webm' },
      body: blob,
    })

    if (!res.ok) {
      let message = `Transcription failed (${res.status})`
      try {
        const data = await res.json()
        if (data?.error) message = data.error
      } catch {
        /* response wasn't JSON; keep the generic message */
      }
      throw new Error(message)
    }

    const data = await res.json()
    return typeof data.text === 'string' ? data.text.trim() : ''
  }, [])

  const startBrowserSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)

    if (!SpeechRecognition) return false

    let recognition
    try {
      recognition = new SpeechRecognition()
    } catch {
      return false
    }

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-US'

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results ?? [])
        .map((result) => result?.[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (transcript) {
        setText((prev) => (prev ? `${prev.replace(/\s+$/, '')} ${transcript}` : transcript))
      }
    }

    recognition.onerror = (event) => {
      const message = event?.error === 'not-allowed'
        ? 'Microphone permission denied.'
        : 'Voice input failed. Please try again.'
      setVoiceError(message)
    }

    recognition.onend = () => {
      speechRecognitionRef.current = null
      setIsRecording(false)
      onVoiceToggle?.(false)
    }

    speechRecognitionRef.current = recognition
    setIsRecording(true)
    onVoiceToggle?.(true)

    try {
      recognition.start()
    } catch {
      speechRecognitionRef.current = null
      setIsRecording(false)
      onVoiceToggle?.(false)
      setVoiceError('Voice input failed. Please try again.')
      return false
    }

    return true
  }, [onVoiceToggle])

  const handleMicClick = useCallback(async () => {
    if (disabled || processing || isTranscribing) return

    /* Click while recording: stop the recorder. The actual upload + text
       insertion happens in the `onstop` handler below — keeping it there
       (instead of awaiting `mr.stop()`) lets the recorder finish flushing
       its final dataavailable event before we read the blob. */
    if (isRecording) {
      try {
        speechRecognitionRef.current?.stop()
        speechRecognitionRef.current = null
      } catch {
        /* already stopped */
      }
      try {
        mediaRecorderRef.current?.stop()
      } catch {
        /* already stopped */
      }
      return
    }

    /* Click while idle: request mic permission and start a fresh session. */
    setVoiceError('')

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      if (!startBrowserSpeechRecognition()) {
        setVoiceError('Microphone is not available in this browser.')
      }
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      if (!startBrowserSpeechRecognition()) {
        setVoiceError('Recording is not supported in this browser.')
      }
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      const reason =
        err && typeof err === 'object' && 'name' in err && err.name === 'NotAllowedError'
          ? 'Microphone permission denied.'
          : 'Could not access the microphone.'
      setVoiceError(reason)
      return
    }

    audioStreamRef.current = stream
    audioChunksRef.current = []

    const mimeType = pickRecorderMimeType()
    let mr
    try {
      mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch {
      stopMicTracks()
      if (!startBrowserSpeechRecognition()) {
        setVoiceError('Recording is not supported in this browser.')
      }
      return
    }
    mediaRecorderRef.current = mr

    mr.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mr.onerror = () => {
      stopMicTracks()
      setIsRecording(false)
      setVoiceError('Recording error. Please try again.')
      onVoiceToggle?.(false)
    }

    mr.onstop = async () => {
      stopMicTracks()
      const chunks = audioChunksRef.current
      audioChunksRef.current = []

      setIsRecording(false)
      onVoiceToggle?.(false)

      if (chunks.length === 0) return

      const blobType = mr.mimeType || mimeType || 'audio/webm'
      const blob = new Blob(chunks, { type: blobType })

      /* Some platforms emit empty blobs on very short presses; skip the
         network round-trip in that case so we don't spam ElevenLabs. */
      if (blob.size < 1024) {
        setVoiceError('Recording was too short to transcribe.')
        return
      }

      setIsTranscribing(true)
      try {
        const transcript = await transcribeBlob(blob)
        if (transcript) {
          /* Append to existing text with a single space separator, so a
             user can dictate multiple utterances back-to-back without
             losing typed content in between. */
          setText((prev) => (prev ? `${prev.replace(/\s+$/, '')} ${transcript}` : transcript))
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transcription failed.'
        setVoiceError(message)
      } finally {
        setIsTranscribing(false)
      }
    }

    try {
      mr.start()
    } catch {
      stopMicTracks()
      if (!startBrowserSpeechRecognition()) {
        setVoiceError('Recording is not supported in this browser.')
      }
      return
    }

    setIsRecording(true)
    onVoiceToggle?.(true)
  }, [
    disabled,
    processing,
    isTranscribing,
    isRecording,
    pickRecorderMimeType,
    stopMicTracks,
    transcribeBlob,
    startBrowserSpeechRecognition,
    onVoiceToggle,
  ])

  const fillContainerStyle = fillContainer
    ? { boxSizing: 'border-box', maxWidth: 'none', width: '100%', paddingLeft: 0, paddingRight: 0 }
    : undefined
  const groupStyle = fillContainer
    ? { alignItems: 'stretch', boxSizing: 'border-box', width: '100%' }
    : undefined
  const inputRowStyle = fillContainer
    ? { alignSelf: 'stretch', boxSizing: 'border-box', flexBasis: '100%', maxWidth: 'none', minWidth: '100%', width: '100%' }
    : undefined

  /* Visual state for the mic button cascades: recording > transcribing >
     parent-controlled voiceActive > idle. The icon and aria-label match
     whichever state is current so screen readers stay in sync. */
  const showRecording = isRecording
  const showTranscribing = isTranscribing && !isRecording
  const showActive = !showRecording && !showTranscribing && voiceActive

  let micIcon = 'microphone-bold'
  if (showRecording) micIcon = 'stop-circle-bold'
  else if (showTranscribing) micIcon = 'microphone-bold'
  else if (showActive) micIcon = 'microphone-on-bold'

  let micAria = 'Start voice input'
  if (showRecording) micAria = 'Stop recording'
  else if (showTranscribing) micAria = 'Transcribing\u2026'
  else if (showActive) micAria = 'Turn voice input off'

  const micClassName = [
    'ai-footer__voice-btn',
    showActive ? 'ai-footer__voice-btn--active' : '',
    showRecording ? 'ai-footer__voice-btn--recording' : '',
    showTranscribing ? 'ai-footer__voice-btn--transcribing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`ai-footer ${className}`} style={fillContainerStyle}>
      {suggestions.length > 0 && !processing && (
        <div className="ai-footer__suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="ai-footer__suggestion"
              onClick={() => onSend?.(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="ai-footer__group" style={groupStyle}>
        {processing ? (
          <div className="ai-footer__input-row" style={{ ...inputRowStyle, alignItems: 'center', justifyContent: 'center' }}>
            <AiSymbol size={24} state="processing" />
            <span style={{ color: 'var(--text-secondary)', fontSize: 14, marginLeft: 8 }}>Processing...</span>
          </div>
        ) : (
          <div className="ai-footer__input-row" style={inputRowStyle}>
            <div className="ai-footer__type-area">
              <textarea
                ref={textareaRef}
                className="ai-footer__textarea"
                placeholder={isRecording ? 'Listening\u2026' : isTranscribing ? 'Transcribing\u2026' : placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={disabled || isTranscribing}
              />
            </div>
            <div className="ai-footer__action-bar">
              {voiceError && (
                /* Inline error sits immediately to the left of the mic
                   button so it's clearly tied to the mic action without
                   pushing the textarea height around. Auto-clears the
                   next time the user starts a recording (handleMicClick
                   resets `voiceError`). */
                <span
                  className="ai-footer__voice-error"
                  role="status"
                  title={voiceError}
                >
                  {voiceError}
                </span>
              )}
              {onVoiceToggle && (
                <button
                  type="button"
                  className={micClassName}
                  aria-label={micAria}
                  aria-pressed={showRecording || showActive}
                  disabled={disabled || isTranscribing}
                  onClick={handleMicClick}
                >
                  <Icon name={micIcon} size={16} />
                </button>
              )}
              <button
                type="button"
                className="ai-footer__send-btn"
                aria-label="Send"
                disabled={!text.trim() || disabled || isTranscribing}
                onClick={handleSend}
              >
                <Icon name="send-bold" size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="ai-footer__disclaimer">
          Assistant can make mistakes. Verify responses. Learn how the AI Assistant handles personal data at{' '}
          <a href="#">AI Assistant Data Privacy</a>.
        </div>
      </div>
    </div>
  )
}

export default AiFooter
