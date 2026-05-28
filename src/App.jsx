import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const STR = {
  en: {
    demo: `Welcome to your teleprompter.

Paste or type your script here. Press the spacebar to start and pause the auto-scroll.

Use the up and down arrows to adjust the speed, and the + and - keys to change the font size.

Press E to edit the text, F for fullscreen, and R to go back to the top.

Happy recording!`,
    fileReadError: 'Could not read the file.',
    cameraUnsupported: 'This browser does not support camera access.',
    permissionDenied: 'Camera/microphone permission denied.',
    noCamera: 'No camera found.',
    cameraInUse: 'The camera is already in use by another app.',
    cameraError: 'Could not access the camera.',
    scriptFileName: 'script.txt',
    dropHint: 'Drop the text file to load',
    previewTitle: 'Recording preview',
    download: 'Download',
    close: 'Close',
    discard: 'Discard',
    pause: 'Pause',
    cancel: 'Cancel',
    start: 'Start',
    restart: 'Restart',
    edit: 'Edit',
    done: 'Done',
    load: 'Load',
    save: 'Save',
    speed: 'Speed',
    font: 'Font',
    lineHeight: 'Line height',
    margin: 'Margin',
    countdown: 'Countdown',
    beepLabel: 'Beep',
    beepTitle: 'Plays a beep every second of the countdown',
    textColor: 'Text',
    bgColor: 'Background',
    mirror: 'Mirror',
    fullscreen: 'Fullscreen',
    camera: 'Camera',
    turnOffCamera: 'Turn off camera',
    defaultCamera: 'Default camera',
    defaultMic: 'Default microphone',
    microphone: 'Microphone',
    record: 'Record',
    stop: 'Stop',
    viewRecording: 'View recording',
    recordShortcut: 'Shortcut: G',
    editorPlaceholder: 'Type or paste your script here...',
    endOfScript: '— end of script —',
    resizeTitle: 'Drag to resize',
    keySpace: 'Space',
    hintPlay: 'start (with countdown)/pause',
    hintSpeed: 'speed',
    hintFont: 'font',
    hintRestart: 'restart',
    hintEdit: 'edit',
    hintMirror: 'mirror',
    hintFullscreen: 'fullscreen',
    hintRecord: 'record/stop',
  },
  pt: {
    demo: `Bem-vindo ao seu teleprompter.

Cole ou digite o seu roteiro aqui. Pressione a barra de espaço para iniciar e pausar a rolagem automática.

Use as setas para cima e para baixo para ajustar a velocidade, e as teclas + e - para mudar o tamanho da fonte.

Pressione E para editar o texto, F para tela cheia e R para voltar ao início.

Boa gravação!`,
    fileReadError: 'Não foi possível ler o arquivo.',
    cameraUnsupported: 'Este navegador não suporta acesso à câmera.',
    permissionDenied: 'Permissão de câmera/microfone negada.',
    noCamera: 'Nenhuma câmera encontrada.',
    cameraInUse: 'A câmera já está em uso por outro app.',
    cameraError: 'Não foi possível acessar a câmera.',
    scriptFileName: 'roteiro.txt',
    dropHint: 'Solte o arquivo de texto para carregar',
    previewTitle: 'Pré-visualização da gravação',
    download: 'Baixar',
    close: 'Fechar',
    discard: 'Descartar',
    pause: 'Pausar',
    cancel: 'Cancelar',
    start: 'Iniciar',
    restart: 'Reiniciar',
    edit: 'Editar',
    done: 'Concluir',
    load: 'Carregar',
    save: 'Salvar',
    speed: 'Velocidade',
    font: 'Fonte',
    lineHeight: 'Entrelinha',
    margin: 'Margem',
    countdown: 'Contagem',
    beepLabel: 'Beep',
    beepTitle: 'Toca um beep a cada segundo da contagem',
    textColor: 'Texto',
    bgColor: 'Fundo',
    mirror: 'Espelhar',
    fullscreen: 'Tela cheia',
    camera: 'Câmera',
    turnOffCamera: 'Desligar câmera',
    defaultCamera: 'Câmera padrão',
    defaultMic: 'Microfone padrão',
    microphone: 'Microfone',
    record: 'Gravar',
    stop: 'Parar',
    viewRecording: 'Ver gravação',
    recordShortcut: 'Atalho: G',
    editorPlaceholder: 'Digite ou cole o seu roteiro aqui...',
    endOfScript: '— fim do roteiro —',
    resizeTitle: 'Arraste para redimensionar',
    keySpace: 'Espaço',
    hintPlay: 'iniciar (com contagem)/pausar',
    hintSpeed: 'velocidade',
    hintFont: 'fonte',
    hintRestart: 'reiniciar',
    hintEdit: 'editar',
    hintMirror: 'espelhar',
    hintFullscreen: 'tela cheia',
    hintRecord: 'gravar/parar',
  },
}

const DEMO_VALUES = [STR.en.demo, STR.pt.demo]

const getInitialLang = () => {
  try {
    return localStorage.getItem('lang') === 'pt' ? 'pt' : 'en'
  } catch {
    return 'en'
  }
}

const SPEED_MIN = 10
const SPEED_MAX = 400
const FONT_MIN = 24
const FONT_MAX = 140

const fmtTime = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function App() {
  const [lang, setLang] = useState(getInitialLang)
  const t = STR[lang]
  const [text, setText] = useState(() => STR[getInitialLang()].demo)
  const [editing, setEditing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(80) // pixels por segundo
  const [fontSize, setFontSize] = useState(56)
  const [lineHeight, setLineHeight] = useState(1.5)
  const [margin, setMargin] = useState(12) // % de margem lateral
  const [textColor, setTextColor] = useState('#ffffff')
  const [bgColor, setBgColor] = useState('#000000')
  const [mirror, setMirror] = useState(false)
  const [finished, setFinished] = useState(false)
  const [countdownSecs, setCountdownSecs] = useState(3)
  const [countdown, setCountdown] = useState(null)
  const [beepOn, setBeepOn] = useState(true)

  const [fileName, setFileName] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [stageSize, setStageSize] = useState({ w: 960, h: 540 })

  const [cameras, setCameras] = useState([])
  const [mics, setMics] = useState([])
  const [selectedCam, setSelectedCam] = useState('')
  const [selectedMic, setSelectedMic] = useState('')

  const scrollRef = useRef(null)
  const rafRef = useRef(null)
  const lastTimeRef = useRef(null)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const stageRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const recordedUrlRef = useRef(null)
  const audioCtxRef = useRef(null)
  const beepOnRef = useRef(beepOn)
  const tRef = useRef(t)
  const selectedCamRef = useRef('')
  const selectedMicRef = useRef('')
  // mantém a posição em ponto flutuante (scrollTop é arredondado pelo browser)
  const offsetRef = useRef(0)

  useEffect(() => {
    beepOnRef.current = beepOn
  }, [beepOn])

  useEffect(() => {
    tRef.current = t
    document.documentElement.lang = lang
  }, [t, lang])

  const changeLang = (next) => {
    setLang(next)
    try {
      localStorage.setItem('lang', next)
    } catch {
      /* ignora */
    }
    // troca a mensagem de demonstração só se o texto ainda é o original
    setText((cur) => (DEMO_VALUES.includes(cur) ? STR[next].demo : cur))
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (AC) audioCtxRef.current = new AC()
    }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }, [])

  const playBeep = useCallback(
    (freq = 800, duration = 0.12, volume = 0.2) => {
      if (!beepOnRef.current) return
      const ctx = ensureAudio()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const now = ctx.currentTime
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + duration + 0.02)
    },
    [ensureAudio],
  )

  const restart = useCallback(() => {
    offsetRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    setFinished(false)
  }, [])

  const loadTextFile = useCallback(
    async (file) => {
      if (!file) return
      setFileError(null)
      try {
        const content = await file.text()
        setPlaying(false)
        setCountdown(null)
        setEditing(false)
        setText(content)
        setFileName(file.name)
        restart()
      } catch {
        setFileError(tRef.current.fileReadError)
      }
    },
    [restart],
  )

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    // permite recarregar o mesmo arquivo depois
    e.target.value = ''
    loadTextFile(file)
  }

  const handleDragOver = (e) => {
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault()
      setDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    // só esconde quando o ponteiro realmente sai da janela
    if (e.relatedTarget === null) setDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files?.[0]
    loadTextFile(file)
  }

  const downloadText = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName?.trim() ? fileName : t.scriptFileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      setCameras(list.filter((d) => d.kind === 'videoinput'))
      setMics(list.filter((d) => d.kind === 'audioinput'))
    } catch {
      /* ignora */
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(tRef.current.cameraUnsupported)
      return
    }
    // encerra um stream anterior antes de abrir outro (troca de dispositivo)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    const camId = selectedCamRef.current
    const micId = selectedMicRef.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          ...(camId ? { deviceId: { exact: camId } } : {}),
        },
        audio: micId ? { deviceId: { exact: micId } } : true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCameraOn(true)
      refreshDevices() // agora com permissão, os rótulos vêm preenchidos
    } catch (err) {
      const tr = tRef.current
      const map = {
        NotAllowedError: tr.permissionDenied,
        NotFoundError: tr.noCamera,
        NotReadableError: tr.cameraInUse,
      }
      setCameraError(map[err?.name] || tr.cameraError)
    }
  }, [refreshDevices])

  const toggleCamera = useCallback(() => {
    if (cameraOn) stopCamera()
    else startCamera()
  }, [cameraOn, startCamera, stopCamera])

  const changeDevice = (kind, id) => {
    if (kind === 'cam') {
      setSelectedCam(id)
      selectedCamRef.current = id
    } else {
      setSelectedMic(id)
      selectedMicRef.current = id
    }
    // re-adquire o stream com o novo dispositivo (exceto durante a gravação)
    if (cameraOn && !recording) startCamera()
  }

  const pickMimeType = () => {
    const types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ]
    return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || ''
  }

  const startRecording = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current)
      recordedUrlRef.current = null
      setRecordedUrl(null)
    }
    chunksRef.current = []
    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: chunksRef.current[0]?.type || 'video/webm',
      })
      const url = URL.createObjectURL(blob)
      recordedUrlRef.current = url
      setRecordedUrl(url)
      setPreviewOpen(true) // abre o preview para revisão
    }
    recorder.start()
    recorderRef.current = recorder
    setElapsed(0)
    setRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    recorderRef.current = null
    setRecording(false)
  }, [])

  const toggleRecording = useCallback(() => {
    if (recording) stopRecording()
    else startRecording()
  }, [recording, startRecording, stopRecording])

  const downloadVideo = () => {
    if (!recordedUrl) return
    const ext = recordedUrl && chunksRef.current[0]?.type?.includes('mp4') ? 'mp4' : 'webm'
    const a = document.createElement('a')
    a.href = recordedUrl
    a.download = `gravacao-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const discardRecording = () => {
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current)
      recordedUrlRef.current = null
    }
    setRecordedUrl(null)
    setPreviewOpen(false)
  }

  // cronômetro da gravação
  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [recording])

  // para a gravação se a câmera for desligada
  useEffect(() => {
    if (!cameraOn && recording) stopRecording()
  }, [cameraOn, recording, stopRecording])

  // lista dispositivos no início e quando mudam (conectar/desconectar)
  useEffect(() => {
    refreshDevices()
    const md = navigator.mediaDevices
    md?.addEventListener?.('devicechange', refreshDevices)
    return () => md?.removeEventListener?.('devicechange', refreshDevices)
  }, [refreshDevices])

  // limpeza ao desmontar
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
      if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current)
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (editing) return
    if (playing) {
      setPlaying(false)
      return
    }
    if (countdown != null) {
      // cancela a contagem em andamento
      setCountdown(null)
      return
    }
    if (countdownSecs > 0) {
      ensureAudio() // desbloqueia o áudio dentro do gesto do usuário
      setCountdown(countdownSecs)
    } else {
      setPlaying(true)
    }
  }, [editing, playing, countdown, countdownSecs, ensureAudio])

  // tique da contagem regressiva (com beep)
  useEffect(() => {
    if (countdown == null) return
    if (countdown <= 0) {
      playBeep(1200, 0.28, 0.28) // tom final "vai!"
      setCountdown(null)
      setPlaying(true)
      return
    }
    playBeep(800, 0.12, 0.2) // tique a cada segundo
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, playBeep])

  // loop de rolagem
  useEffect(() => {
    if (!playing) {
      lastTimeRef.current = null
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    const step = (time) => {
      const el = scrollRef.current
      if (!el) return
      if (lastTimeRef.current == null) lastTimeRef.current = time
      const dt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      offsetRef.current += speed * dt
      el.scrollTop = offsetRef.current

      const maxScroll = el.scrollHeight - el.clientHeight
      if (offsetRef.current >= maxScroll) {
        offsetRef.current = maxScroll
        el.scrollTop = maxScroll
        setPlaying(false)
        setFinished(true)
        return
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, speed])

  // mantém offsetRef em sincronia se o usuário rolar manualmente enquanto pausado
  const handleManualScroll = () => {
    if (!playing && scrollRef.current) {
      offsetRef.current = scrollRef.current.scrollTop
    }
  }

  // atalhos de teclado
  useEffect(() => {
    const onKey = (e) => {
      // não captura atalhos enquanto edita o texto (exceto Escape)
      if (editing) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setEditing(false)
        }
        return
      }
      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowUp':
          e.preventDefault()
          setSpeed((s) => clamp(s + 10, SPEED_MIN, SPEED_MAX))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSpeed((s) => clamp(s - 10, SPEED_MIN, SPEED_MAX))
          break
        case '+':
        case '=':
          e.preventDefault()
          setFontSize((f) => clamp(f + 4, FONT_MIN, FONT_MAX))
          break
        case '-':
        case '_':
          e.preventDefault()
          setFontSize((f) => clamp(f - 4, FONT_MIN, FONT_MAX))
          break
        case 'r':
        case 'R':
          e.preventDefault()
          restart()
          break
        case 'e':
        case 'E':
          e.preventDefault()
          setPlaying(false)
          setCountdown(null)
          setEditing(true)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          setMirror((m) => !m)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'g':
        case 'G':
          e.preventDefault()
          if (cameraOn) toggleRecording()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, togglePlay, restart, cameraOn, toggleRecording])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  const onResizeStart = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startW = stageRef.current?.offsetWidth ?? stageSize.w
    const startH = stageRef.current?.offsetHeight ?? stageSize.h
    const onMove = (ev) => {
      setStageSize({
        w: Math.max(240, startW + (ev.clientX - startX)),
        h: Math.max(160, startH + (ev.clientY - startY)),
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className="app"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="drop-overlay">
          <div className="drop-box">📥 {t.dropHint}</div>
        </div>
      )}

      {previewOpen && recordedUrl && (
        <div className="preview-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="preview-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="preview-title">{t.previewTitle}</h3>
            <video className="preview-video" src={recordedUrl} controls autoPlay />
            <div className="preview-actions">
              <button className="btn primary" onClick={downloadVideo}>⬇ {t.download}</button>
              <button className="btn" onClick={() => setPreviewOpen(false)}>✕ {t.close}</button>
              <button className="btn danger" onClick={discardRecording}>🗑 {t.discard}</button>
            </div>
          </div>
        </div>
      )}
      <header className="toolbar">
        <h1 className="brand">
          <svg
            className="brand-icon"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
            <path d="m6.2 5.3 3.1 3.9" />
            <path d="m12.4 3.4 3.1 4" />
            <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          </svg>
          Tele-prompter.app
        </h1>
        <select
          className="lang-select"
          value={lang}
          onChange={(e) => changeLang(e.target.value)}
          aria-label="Language"
        >
          <option value="en">🌐 English</option>
          <option value="pt">🌐 Português</option>
        </select>
        {fileName && !fileError && <span className="file-name" title={fileName}>📄 {fileName}</span>}
        {fileError && <span className="file-error">{fileError}</span>}

        <div className="controls">
          <button
            className={`btn primary ${playing || countdown != null ? 'is-playing' : ''}`}
            onClick={togglePlay}
            disabled={editing}
          >
            {playing
              ? `❚❚ ${t.pause}`
              : countdown != null
                ? `✕ ${t.cancel} (${countdown})`
                : `▶ ${t.start}`}
          </button>
          <button className="btn" onClick={restart}>↺ {t.restart}</button>
          <button
            className={`btn ${editing ? 'active' : ''}`}
            onClick={() => {
              setPlaying(false)
              setCountdown(null)
              setEditing((v) => !v)
            }}
          >
            ✎ {editing ? t.done : t.edit}
          </button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            📁 {t.load}
          </button>
          <button className="btn" onClick={downloadText}>
            💾 {t.save}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.markdown,.text,text/plain,text/markdown"
            onChange={handleFileInput}
            hidden
          />

          <label className="field">
            {t.speed}
            <input
              type="range"
              min={SPEED_MIN}
              max={SPEED_MAX}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
            <span className="value">{speed}</span>
          </label>

          <label className="field">
            {t.font}
            <input
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
            <span className="value">{fontSize}px</span>
          </label>

          <label className="field">
            {t.lineHeight}
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.1}
              value={lineHeight}
              onChange={(e) => setLineHeight(Number(e.target.value))}
            />
            <span className="value">{lineHeight.toFixed(1)}</span>
          </label>

          <label className="field">
            {t.margin}
            <input
              type="range"
              min={0}
              max={35}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
            />
            <span className="value">{margin}%</span>
          </label>

          <label className="field">
            {t.countdown}
            <input
              type="range"
              min={0}
              max={10}
              value={countdownSecs}
              onChange={(e) => setCountdownSecs(Number(e.target.value))}
            />
            <span className="value">{countdownSecs === 0 ? 'off' : `${countdownSecs}s`}</span>
          </label>

          <label className="field checkbox" title={t.beepTitle}>
            <input type="checkbox" checked={beepOn} onChange={(e) => setBeepOn(e.target.checked)} />
            🔔 {t.beepLabel}
          </label>

          <label className="field color">
            {t.textColor}
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
          </label>

          <label className="field color">
            {t.bgColor}
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
          </label>

          <button className={`btn ${mirror ? 'active' : ''}`} onClick={() => setMirror((m) => !m)}>
            ⇄ {t.mirror}
          </button>
          <button className="btn" onClick={toggleFullscreen}>⛶ {t.fullscreen}</button>

          <span className="sep" />

          <button className={`btn ${cameraOn ? 'active' : ''}`} onClick={toggleCamera}>
            📷 {cameraOn ? t.turnOffCamera : t.camera}
          </button>

          {cameraOn && (
            <>
              <select
                className="device-select"
                value={selectedCam}
                onChange={(e) => changeDevice('cam', e.target.value)}
                disabled={recording}
                title={t.camera}
              >
                <option value="">{t.defaultCamera}</option>
                {cameras.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `${t.camera} ${i + 1}`}
                  </option>
                ))}
              </select>
              <select
                className="device-select"
                value={selectedMic}
                onChange={(e) => changeDevice('mic', e.target.value)}
                disabled={recording}
                title={t.microphone}
              >
                <option value="">{t.defaultMic}</option>
                {mics.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `${t.microphone} ${i + 1}`}
                  </option>
                ))}
              </select>
            </>
          )}

          <button
            className={`btn rec ${recording ? 'is-recording' : ''}`}
            onClick={toggleRecording}
            disabled={!cameraOn}
            title={t.recordShortcut}
          >
            {recording ? `⏹ ${t.stop} (${fmtTime(elapsed)})` : `⏺ ${t.record}`}
          </button>
          {recordedUrl && !recording && !previewOpen && (
            <button className="btn primary" onClick={() => setPreviewOpen(true)}>
              🎬 {t.viewRecording}
            </button>
          )}
          {cameraError && <span className="file-error">{cameraError}</span>}
        </div>
      </header>

      <div className={`stage-wrap ${cameraOn ? 'resizable' : ''}`}>
      <main
        ref={stageRef}
        className="stage"
        style={
          cameraOn
            ? { background: bgColor, width: stageSize.w, height: stageSize.h }
            : { background: bgColor }
        }
      >
        <video
          ref={videoRef}
          className={`camera-bg ${cameraOn ? 'on' : ''} ${mirror ? 'mirror' : ''}`}
          autoPlay
          muted
          playsInline
        />
        {recording && (
          <div className="rec-badge">● REC {fmtTime(elapsed)}</div>
        )}
        {countdown != null && countdown > 0 && (
          <div className="countdown-overlay">
            <span key={countdown} className="countdown-number">{countdown}</span>
          </div>
        )}
        {editing ? (
          <textarea
            className="editor"
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            placeholder={t.editorPlaceholder}
          />
        ) : (
          <>
            <div className="reading-line" aria-hidden />
            <div
              ref={scrollRef}
              className="prompter"
              onScroll={handleManualScroll}
              style={{ color: textColor }}
            >
              <div
                className="prompter-text"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight,
                  paddingInline: `${margin}%`,
                  transform: mirror ? 'scaleX(-1)' : 'none',
                }}
              >
                {text.split('\n').map((line, i) => (
                  <p key={i}>{line === '' ? ' ' : line}</p>
                ))}
              </div>
              {finished && <div className="end-flag">{t.endOfScript}</div>}
            </div>
          </>
        )}
        {cameraOn && (
          <div
            className="resize-handle"
            onPointerDown={onResizeStart}
            title={t.resizeTitle}
          />
        )}
      </main>
      </div>

      <footer className="hints">
        <span><kbd>{t.keySpace}</kbd> {t.hintPlay}</span>
        <span><kbd>↑</kbd><kbd>↓</kbd> {t.hintSpeed}</span>
        <span><kbd>+</kbd><kbd>−</kbd> {t.hintFont}</span>
        <span><kbd>R</kbd> {t.hintRestart}</span>
        <span><kbd>E</kbd> {t.hintEdit}</span>
        <span><kbd>M</kbd> {t.hintMirror}</span>
        <span><kbd>F</kbd> {t.hintFullscreen}</span>
        <span><kbd>G</kbd> {t.hintRecord}</span>
      </footer>
    </div>
  )
}

export default App
