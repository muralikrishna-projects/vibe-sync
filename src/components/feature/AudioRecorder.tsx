"use client"

import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAudioStore } from '@/store/useAudioStore'
import { cn } from '@/lib/utils'

export function AudioRecorder() {
    const { isRecording, setIsRecording, setRecordedBlob, isAnalyzing } = useAudioStore()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyzerRef = useRef<AnalyserNode | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const animationFrameRef = useRef<number>()

    const startRecording = async () => {
        try {
            setRecordedBlob(null) // Clear previous recording
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Audio Context Setup for Visualizer
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const analyzer = audioContext.createAnalyser()
            const source = audioContext.createMediaStreamSource(stream)

            source.connect(analyzer)
            analyzer.fftSize = 256

            audioContextRef.current = audioContext
            analyzerRef.current = analyzer
            sourceRef.current = source

            // MediaRecorder Setup
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setRecordedBlob(blob)
                stream.getTracks().forEach(track => track.stop())
                if (audioContext.state !== 'closed') audioContext.close()
                cancelAnimationFrame(animationFrameRef.current!)
            }

            mediaRecorder.start()
            setIsRecording(true)
            drawVisualizer()
        } catch (err) {
            console.error("Error accessing microphone:", err)
            alert("Could not access microphone. Please allow permissions.")
        }
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop()
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close()
            }
            if (sourceRef.current) {
                sourceRef.current.disconnect()
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            // Stop all tracks in the stream
            if (mediaRecorderRef.current?.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const drawVisualizer = () => {
        const canvas = canvasRef.current
        const analyzer = analyzerRef.current
        if (!canvas || !analyzer) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const bufferLength = analyzer.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw)
            analyzer.getByteFrequencyData(dataArray)

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const barWidth = (canvas.width / bufferLength) * 2.5
            let barHeight
            let x = 0

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2

                // Dynamic gradient color
                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
                gradient.addColorStop(0, '#6366f1') // Indigo-500
                gradient.addColorStop(1, '#a855f7') // Purple-500

                ctx.fillStyle = gradient
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

                x += barWidth + 1
            }
        }

        draw()
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <Card className="p-6 bg-white/5 backdrop-blur-md border-white/10 flex flex-col items-center gap-6">
                <div className="relative w-full h-32 bg-black/20 rounded-lg overflow-hidden border border-white/5">
                    <canvas
                        ref={canvasRef}
                        width={400}
                        height={128}
                        className="w-full h-full"
                    />
                    {!isRecording && !isAnalyzing && (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 text-sm">
                            Visualizer Ready
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    {!isRecording ? (
                        <Button
                            size="lg"
                            className="w-40 rounded-full bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                            onClick={startRecording}
                            disabled={isAnalyzing}
                        >
                            <Mic className="w-5 h-5 mr-2" />
                            Record
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            variant="destructive"
                            className="w-40 rounded-full shadow-lg shadow-red-500/20 transition-all hover:scale-105"
                            onClick={stopRecording}
                        >
                            <Square className="w-5 h-5 mr-2 fill-current" />
                            Stop
                        </Button>
                    )}
                </div>
            </Card>

            {isAnalyzing && (
                <div className="flex items-center justify-center gap-2 text-indigo-300 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">Analyzing Voice Match...</span>
                </div>
            )}
        </div>
    )
}
