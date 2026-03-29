"use client"

import { useEffect, useRef, useState } from "react"
import WaveSurfer from "wavesurfer.js"
import { useAudioStore } from "@/store/useAudioStore"
import { Play, Pause } from "lucide-react"

export function AudioVisualizer() {
    const { referenceFile, recordedBlob } = useAudioStore()
    const containerRef = useRef<HTMLDivElement>(null)
    const waveSurferRef1 = useRef<WaveSurfer | null>(null)
    const waveSurferRef2 = useRef<WaveSurfer | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    useEffect(() => {
        if (!containerRef.current) return

        // Initialize Reference Waveform (Background/Top Layer)
        waveSurferRef1.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: 'rgba(255, 255, 255, 0.2)',
            progressColor: 'rgba(255, 255, 255, 0.5)',
            cursorColor: 'transparent',
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 100,
            interact: false,
        })

        // Initialize User Waveform (Foreground/Bottom Layer overlapping)
        waveSurferRef2.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: 'rgba(99, 102, 241, 0.4)', // Indigo
            progressColor: 'rgba(99, 102, 241, 0.8)',
            cursorColor: 'rgba(255, 255, 255, 0.8)',
            cursorWidth: 2,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 100,
        })

        // Overlay the second waveform exactly on top of the first using CSS injected via JS
        // Because WaveSurfer 7 creates absolute/relative wrappers, we force the second instance to lay over
        const div2 = containerRef.current.children[1] as HTMLElement
        if (div2) {
            div2.style.position = 'absolute'
            div2.style.top = '0'
            div2.style.left = '0'
            div2.style.width = '100%'
            div2.style.height = '100%'
        }

        const ws1 = waveSurferRef1.current
        const ws2 = waveSurferRef2.current

        // Load Audio
        if (referenceFile) {
            ws1.loadBlob(referenceFile)
        }
        if (recordedBlob) {
            ws2.loadBlob(recordedBlob)
        }

        // Sync Playback exactly
        ws2.on('play', () => {
            setIsPlaying(true)
            ws1.play()
        })
        ws2.on('pause', () => {
            setIsPlaying(false)
            ws1.pause()
        })
        ws2.on('seeking', (currentTime) => {
            ws1.setTime(currentTime)
        })

        // Prevent overflow errors on destroy
        return () => {
            ws1?.destroy()
            ws2?.destroy()
        }
    }, [referenceFile, recordedBlob])

    const togglePlayback = () => {
        if (waveSurferRef2.current) {
            waveSurferRef2.current.isPlaying() ? waveSurferRef2.current.pause() : waveSurferRef2.current.play()
        }
    }

    if (!referenceFile || !recordedBlob) return null

    return (
        <div className="w-full mt-12 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white tracking-wide">Audio Overlay Visualization</h3>
                <button
                    onClick={togglePlayback}
                    className="w-12 h-12 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-colors shadow-md"
                >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
            </div>

            <div className="relative w-full h-[100px]" ref={containerRef}>
                {/* WaveSurfer injects instances here */}
            </div>

            <div className="flex gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/50"></div>
                    <span className="text-white/70">Reference Track</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                    <span className="text-white/70">Your Recording</span>
                </div>
            </div>
        </div>
    )
}
