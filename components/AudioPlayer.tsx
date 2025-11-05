import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateSpeech } from '../services/geminiService';

// Audio decoding utilities as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// Icons
const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9 9 0 0119 10a9 9 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7 7 0 0017 10a7 7 0 00-2.343-5.657 1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5 5 0 0115 10a5 5 0 01-1.757 3.536 1 1 0 01-1.415-1.414A3 3 0 0013 10a3 3 0 00-.757-2.121 1 1 0 010-1.415z" clipRule="evenodd" />
    </svg>
);
const StopIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);
const MiniSpinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-500"></div>;


const AudioPlayer: React.FC<{ text: string }> = ({ text }) => {
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState('');

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    useEffect(() => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                setError("Audio playback is not supported on this browser.");
            }
        }
        
        return () => {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
        };
    }, []);
    
    // When text changes, invalidate old audio buffer
    useEffect(() => {
        audioBufferRef.current = null;
        if(audioSourceRef.current) {
            audioSourceRef.current.stop();
        }
        setIsPlaying(false);
    }, [text]);

    const playAudio = useCallback(() => {
        if (!audioBufferRef.current || !audioContextRef.current) return;
        
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            audioSourceRef.current = null;
        };
        source.start();
        audioSourceRef.current = source;
        setIsPlaying(true);

    }, []);

    const handleTogglePlayback = useCallback(async () => {
        setError('');
        if (isPlaying) {
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }
            setIsPlaying(false);
            return;
        }

        if (audioBufferRef.current) {
            playAudio();
        } else {
            setIsGeneratingAudio(true);
            try {
                const base64Audio = await generateSpeech(text);
                const audioBytes = decode(base64Audio);
                if (!audioContextRef.current) throw new Error("AudioContext not available");
                const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
                audioBufferRef.current = audioBuffer;
                playAudio();
            } catch (e) {
                console.error(e);
                setError('Could not generate audio.');
            } finally {
                setIsGeneratingAudio(false);
            }
        }
    }, [isPlaying, text, playAudio]);
    
    if (error) {
        return <span className="text-xs text-red-500">{error}</span>
    }

    return (
        <button
            onClick={handleTogglePlayback}
            disabled={isGeneratingAudio}
            className="flex items-center space-x-2 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-500 disabled:opacity-50 disabled:cursor-wait"
            aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
        >
            {isGeneratingAudio ? <MiniSpinner /> : (isPlaying ? <StopIcon /> : <SpeakerIcon />)}
            <span className="font-medium">{isGeneratingAudio ? 'Generating...' : (isPlaying ? 'Stop' : 'Listen')}</span>
        </button>
    );
};

export default AudioPlayer;
