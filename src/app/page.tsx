"use client"

import { useEffect, useState } from "react"
import { FileUpload } from "@/components/feature/FileUpload"
import { UserAudioInput } from "@/components/feature/UserAudioInput"
import { ComparisonDashboard } from "@/components/feature/ComparisonDashboard"
import { AudioVisualizer } from "@/components/feature/AudioVisualizer"
import { useAudioStore } from "@/store/useAudioStore"
import { analyzeAudio } from "@/lib/audio-analysis"
import { AnimatePresence, motion } from "framer-motion"

export default function Home() {
  const {
    referenceFile,
    recordedBlob,
    status,
    setStatus,
    setAnalysisResults,
    setReferenceFile
  } = useAudioStore()

  // Explicit Analysis Handler
  const runAnalysis = async (userAudio: Blob | File) => {
    if (!referenceFile) return

    // Update store
    useAudioStore.getState().setRecordedBlob(userAudio)
    setStatus('analyzing')

    try {
      const { rhythm, timbre, pitch } = await analyzeAudio(referenceFile, userAudio)
      setAnalysisResults(rhythm, timbre, pitch)
      setStatus('completed')
    } catch (error) {
      console.error(error)
      useAudioStore.getState().setError(error instanceof Error ? error.message : "Unknown error")
      setStatus('idle') // Reset on error so they can try again
    }
  }

  // Effect for Auto-triggering ONLY for AudioRecorder (which sets recordedBlob directly)
  // We identify this by checking if recordedBlob exists but we are 'idle' AND it wasn't a manual file upload (we can check blob type or infer)
  // Actually, AudioRecorder usage pattern: it calls setRecordedBlob.
  // We can just watch recordedBlob. If it changes and it's NOT a File (it's a Blob from recorder), trigger.
  // OR, we can just pass `runAnalysis` to UserAudioInput? No, AudioRecorder is deep inside.

  // Let's keep the Effect but make it selective.
  // The Manual Upload now calls runAnalysis directly.
  // The Recorder sets recordedBlob. We watch that.
  useEffect(() => {
    if (referenceFile && recordedBlob && status === 'idle' && !useAudioStore.getState().isAnalyzing) {
      // If it is a File object, it likely came from the Upload flow, which now handles its own trigger.
      // BUT, for Recording, it comes as a Blob.
      // So, ONLY trigger automatically if it is NOT a File (i.e. it is a raw Blob from recorder).
      if (!(recordedBlob instanceof File)) {
        runAnalysis(recordedBlob)
      }
    }
  }, [recordedBlob, referenceFile, status])

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-8 pb-20 gap-16 w-full">
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-200 drop-shadow-sm">
            VibeSync
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
            Compare your vocals to the original track with AI-powered accuracy.
          </p>
        </div>

        <div className="w-full max-w-4xl flex flex-col gap-12 items-center">
          {/* Step 1: Upload */}
          <div className="w-full transition-all duration-500">
            <FileUpload
              file={referenceFile}
              onFileSelect={setReferenceFile}
              onClear={() => setReferenceFile(null)}
              label="Upload Reference Audio"
              subLabel="The original track you want to mimic"
            />
          </div>

          {/* Step 2: Input (Record or Upload) */}
          <AnimatePresence>
            {referenceFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full"
              >
                <UserAudioInput onCompare={runAnalysis} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 3: Results */}
          <ComparisonDashboard />
          {status === 'completed' && (
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full"
              >
                  <AudioVisualizer />
              </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground/60 w-full">
        <p>© {new Date().getFullYear()} VibeSync. All rights reserved.</p>
        <p>Created by <span className="text-indigo-400 font-medium">A. Murali Krishna</span></p>
      </footer>
    </div>
  );
}
