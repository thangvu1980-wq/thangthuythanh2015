// Fix for SpeechRecognition API not being in standard TypeScript lib
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { solveMathProblem } from '../services/geminiService';
import AudioPlayer from './AudioPlayer';

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: { readonly transcript: string };
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

declare var SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
};

declare global {
    interface Window {
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof SpeechRecognition;
    }
}

const Spinner = () => (
    <div className="flex justify-center items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="text-slate-500 dark:text-slate-400">Thinking...</span>
    </div>
);

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none text-left" style={{ whiteSpace: 'pre-wrap' }}>
            {content}
        </div>
    );
};

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const data = result.split(',')[1];
            resolve({ mimeType: file.type, data });
        };
        reader.onerror = error => reject(error);
    });
};

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 10.15V16a1 1 0 11-2 0v-1.85A5.002 5.002 0 015 9V7a1 1 0 012 0v2a3 3 0 006 0V7a1 1 0 112 0v2a5.002 5.002 0 01-5 5.15z" clipRule="evenodd" />
    </svg>
);


const ProblemSolver: React.FC = () => {
    const [problem, setProblem] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [solution, setSolution] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const [speechSupported, setSpeechSupported] = useState(false);

    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognitionAPI();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setProblem(prev => prev ? `${prev.trim()} ${finalTranscript.trim()}` : finalTranscript.trim());
                }
            };
            
            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition not supported in this browser.");
        }
    }, []);

    const handleToggleRecording = () => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
            setIsRecording(true);
        }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!problem && !image) {
            setError('Please enter a problem or upload an image.');
            return;
        }
        setError('');
        setSolution('');
        setLoading(true);

        try {
            let imagePart = null;
            if (image) {
                imagePart = await fileToBase64(image);
            }
            const result = await solveMathProblem(problem, imagePart);
            setSolution(result);
        } catch (err) {
            setError('Sorry, something went wrong. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [problem, image]);
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
            <div>
                <label htmlFor="problem-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Type your math problem or use your voice
                </label>
                <div className="relative">
                    <textarea
                        id="problem-input"
                        rows={4}
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        placeholder="e.g., Find the integral of x^2 from 0 to 1"
                        className="w-full p-3 pr-12 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    />
                    {speechSupported && (
                        <button
                            onClick={handleToggleRecording}
                            type="button"
                            className={`absolute bottom-2.5 right-2.5 p-2 rounded-full transition-all duration-300 ${
                                isRecording 
                                ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                                : 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-300'
                            }`}
                            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                        >
                            <MicrophoneIcon />
                        </button>
                    )}
                </div>
            </div>
            
            <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-sm">OR</span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Upload an image of the problem
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        {!imagePreview ? (
                        <>
                            <ImageIcon />
                            <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer bg-white dark:bg-slate-800 rounded-md font-medium text-sky-600 dark:text-sky-400 hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-sky-500 dark:focus-within:ring-offset-slate-800"
                                >
                                <span>Upload a file</span>
                                <input id="file-upload" ref={fileInputRef} name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-500">PNG, JPG, GIF up to 10MB</p>
                        </>
                        ) : (
                            <div className="relative">
                                <img src={imagePreview} alt="Problem preview" className="max-h-40 rounded-lg"/>
                                <button onClick={removeImage} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition">
                                    <TrashIcon/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex justify-center bg-sky-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-sky-600 transition-colors duration-300 disabled:bg-sky-300 disabled:cursor-not-allowed"
            >
                {loading ? 'Solving...' : 'Get Solution'}
            </button>
            
            {(loading || error || solution) && (
                <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    {loading && <Spinner />}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {solution && (
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white text-left">Solution:</h3>
                                <AudioPlayer text={solution} />
                            </div>
                            <MarkdownRenderer content={solution} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProblemSolver;