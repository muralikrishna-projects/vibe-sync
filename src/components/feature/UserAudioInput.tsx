"use client"

import { useState } from 'react'
import { AudioRecorder } from './AudioRecorder'
import { FileUpload } from './FileUpload'
import { useAudioStore } from '@/store/useAudioStore'
import { Mic, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export function UserAudioInput({ onCompare }: { onCompare: (file: File) => void }) {
    const [mode, setMode] = useState<'record' | 'upload'>('record')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const { recordedBlob, setRecordedBlob, isRecording, status, resetUser } = useAudioStore()

    // Handle File Upload for User Audio
    const handleFileSelect = (file: File) => {
        setSelectedFile(file)
    }

    const handleCompareClick = () => {
        if (selectedFile) {
            // setRecordedBlob(selectedFile) // Store update handled by parent or effect
            onCompare(selectedFile)
        }
    }

    // Determine currently showing file (Store > Local)
    // If analysis is done, store has the blob. If pending, local has it.
    const displayFile = (recordedBlob instanceof File ? recordedBlob : null) || selectedFile

    const isAnalyzing = status === 'analyzing'
    const showCompareButton = selectedFile && !isAnalyzing

    return (
        <div className="w-full flex flex-col gap-6 items-center">
            {/* Toggle Switch */}
            <div className="flex p-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 relative">
                <div
                    className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-indigo-500/20 transition-all duration-300 ease-out",
                        mode === 'record' ? "left-1" : "left-[calc(50%+4px)]"
                    )}
                />

                <button
                    onClick={() => {
                        resetUser()
                        setSelectedFile(null)
                        setMode('record')
                    }}
                    disabled={isRecording || isAnalyzing}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-full relative z-10 transition-colors duration-300 text-sm font-medium",
                        mode === 'record' ? "text-indigo-300" : "text-muted-foreground hover:text-white",
                        (isRecording || isAnalyzing) && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Mic className="w-4 h-4" />
                    Record
                </button>
                <button
                    onClick={() => {
                        resetUser()
                        setSelectedFile(null)
                        setMode('upload')
                    }}
                    disabled={isRecording || isAnalyzing}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-full relative z-10 transition-colors duration-300 text-sm font-medium",
                        mode === 'upload' ? "text-indigo-300" : "text-muted-foreground hover:text-white",
                        (isRecording || isAnalyzing) && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Upload className="w-4 h-4" />
                    Upload
                </button>
            </div>

            {/* Content Area */}
            <div className="w-full relative">

                <AnimatePresence mode="wait">
                    {mode === 'record' ? (
                        <motion.div
                            key="recorder"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <AudioRecorder />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="uploader"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <div className="w-full">
                                <FileUpload
                                    file={displayFile}
                                    onFileSelect={handleFileSelect}
                                    onClear={() => {
                                        setSelectedFile(null)
                                        setRecordedBlob(null)
                                    }}
                                    label="Upload Recording"
                                    subLabel="Upload your performance (MP3, WAV)"
                                />
                            </div>

                            {/* Compare Button & Loading State (Matched to AudioRecorder) */}
                            <AnimatePresence mode="wait">
                                {isAnalyzing ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-center gap-2 text-indigo-300 animate-pulse h-12"
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm font-medium">Analyzing Voice Match...</span>
                                    </motion.div>
                                ) : (
                                    showCompareButton && (
                                        <motion.div
                                            key="compare-btn"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            <Button
                                                size="lg"
                                                className="w-40 rounded-full bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                                                onClick={handleCompareClick}
                                            >
                                                Compare Audio
                                            </Button>
                                        </motion.div>
                                    )
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
