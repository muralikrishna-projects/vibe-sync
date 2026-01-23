import toWav from 'audiobuffer-to-wav'

// Helper: Decode File/Blob to AudioBuffer
async function decodeAudio(file: Blob, ctx: AudioContext): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer()
    return await ctx.decodeAudioData(arrayBuffer)
}

// Helper: Convert AudioBuffer to WAV Blob
function bufferToWavBlob(buffer: AudioBuffer): Blob {
    const wav = toWav(buffer)
    return new Blob([wav], { type: 'audio/wav' })
}

// Main Analysis Function
export async function analyzeAudio(referenceBlob: File | null, userBlob: Blob | null): Promise<{ rhythm: number, dynamics: number, intonation: number }> {
    if (!referenceBlob || !userBlob) throw new Error("Missing audio files")

    // 1. Convert inputs to uniform WAV format on the client side
    // This utilizes the Browser's native decoders (ffmpeg built-in) to handle MP3/WebM/M4A
    // and sends clean WAV files to the backend, avoiding codec issues on the server.
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    try {
        const [refBuffer, userBuffer] = await Promise.all([
            decodeAudio(referenceBlob, ctx),
            decodeAudio(userBlob, ctx)
        ])

        const refWav = bufferToWavBlob(refBuffer)
        const userWav = bufferToWavBlob(userBuffer)

        // 2. Upload WAVs to Backend (via Next.js Proxy)
        const formData = new FormData()
        formData.append('reference', refWav, 'reference.wav')
        formData.append('user', userWav, 'user.wav')

        console.log("Sending analysis request directly to backend...")
        // Bypass Next.js Proxy to debug 500 error/hang
        // This requires CORS enabled in backend (which we did)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Analysis Request Failed:", response.status, errorText)
            throw new Error(`Analysis failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
            throw new Error(data.error)
        }

        return {
            rhythm: data.rhythm_precision,
            dynamics: data.dynamics_match,
            intonation: data.intonation_accuracy
        }

    } catch (e) {
        console.error("Backend Analysis Failed", e)
        throw e
    } finally {
        ctx.close()
    }
}
