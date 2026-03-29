"use client"

import { useAudioStore } from "@/store/useAudioStore"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function ProgressRing({ score, label, colorClass }: { score: number; label: string; colorClass: string }) {
    const radius = 50
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        className="text-white/5"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className={cn("transition-all duration-1000 ease-out", colorClass)}
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-bold text-white tabular-nums">{Math.round(score)}%</span>
                </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center px-2">{label}</span>
        </div>
    )
}

export function ComparisonDashboard() {
    const {
        rhythmPrecision,
        timbreSimilarity,
        pitchAccuracy,
        status,
        errorMessage
    } = useAudioStore()

    const isError = status === 'error'

    if (status === 'idle' || status === 'recording') return null

    if (isError) {
        return (
            <div className="w-full max-w-4xl mx-auto mt-12 p-6 bg-red-500/10 rounded-2xl border border-red-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-8">
                <div className="text-center text-red-200">
                    <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
                    <p className="text-sm opacity-80">{errorMessage || "Unable to connect to the analysis engine. Please ensure the backend server is running."}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <ProgressRing score={rhythmPrecision} label="Rhythmic Alignment" colorClass="text-emerald-400" />
                <ProgressRing score={timbreSimilarity} label="Timbre Similarity" colorClass="text-indigo-400" />
                <ProgressRing score={pitchAccuracy} label="Pitch Accuracy" colorClass="text-purple-400" />
            </div>

            <div className="mt-8 text-center text-muted-foreground text-sm max-w-2xl mx-auto">
                <p>
                    {timbreSimilarity > 80 && pitchAccuracy > 80
                        ? "Outstanding! Your vocal timbre and pitch perfectly match the reference."
                        : "Keep practicing. Focus on matching the exact pitch curves and tone color of the original."}
                </p>
            </div>
        </div>
    )
}
