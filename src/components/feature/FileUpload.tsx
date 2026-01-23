"use client"

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Music, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface FileUploadProps {
    file: File | null
    onFileSelect: (file: File) => void
    onClear: () => void
    label?: string
    subLabel?: string
    accept?: Record<string, string[]>
}

export function FileUpload({
    file,
    onFileSelect,
    onClear,
    label = "Upload Audio",
    subLabel = "Drag & drop or click to browse",
    accept = { 'audio/*': ['.mp3', '.wav', '.m4a'] }
}: FileUploadProps) {

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.[0]) {
            onFileSelect(acceptedFiles[0])
        }
    }, [onFileSelect])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxFiles: 1,
        disabled: !!file
    })

    return (
        <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Card
                            {...getRootProps()}
                            className={cn(
                                "relative group cursor-pointer border-dashed border-2 transition-all duration-300 flex flex-col items-center justify-center p-12 text-center h-64 overflow-hidden backdrop-blur-md bg-white/5 border-white/20 hover:border-indigo-400/50 hover:bg-white/10",
                                isDragActive && "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20"
                            )}
                        >
                            <input {...getInputProps()} />
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="p-4 rounded-full bg-white/5 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                                    <Upload className="w-8 h-8 text-indigo-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-medium text-white">{label}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {subLabel}
                                    </p>
                                </div>
                            </div>

                            {/* Decorative Mesh in Card */}
                            <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent" />
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Card className="flex items-center gap-4 p-4 border bg-white/5 backdrop-blur-md border-white/10">
                            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                                <Music className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onClear()
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
