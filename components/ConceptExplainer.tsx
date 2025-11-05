import React, { useState, useCallback } from 'react';
import { explainMathConcept } from '../services/geminiService';
import AudioPlayer from './AudioPlayer';

const Spinner = () => (
    <div className="flex justify-center items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        <span className="text-slate-500 dark:text-slate-400">Explaining...</span>
    </div>
);

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    return (
        <div className="prose prose-slate dark:prose-invert max-w-none text-left" style={{ whiteSpace: 'pre-wrap' }}>
            {content}
        </div>
    );
};


const ConceptExplainer: React.FC = () => {
    const [concept, setConcept] = useState('');
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = useCallback(async () => {
        if (!concept.trim()) {
            setError('Please enter a math concept.');
            return;
        }
        setError('');
        setExplanation('');
        setLoading(true);

        try {
            const result = await explainMathConcept(concept);
            setExplanation(result);
        } catch (err) {
            setError('Sorry, something went wrong. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [concept]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
            <div>
                <label htmlFor="concept-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    What math concept do you want to understand?
                </label>
                <div className="flex space-x-2">
                    <input
                        id="concept-input"
                        type="text"
                        value={concept}
                        onChange={(e) => setConcept(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="e.g., Pythagorean Theorem, Standard Deviation"
                        className="flex-grow w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    />
                     <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-sky-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-sky-600 transition-colors duration-300 disabled:bg-sky-300 disabled:cursor-not-allowed"
                    >
                        {loading ? '...' : 'Explain'}
                    </button>
                </div>
            </div>
            
            {(loading || error || explanation) && (
                <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    {loading && <Spinner />}
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {explanation && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white text-left">Explanation:</h3>
                                <AudioPlayer text={explanation} />
                            </div>
                            <MarkdownRenderer content={explanation} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConceptExplainer;