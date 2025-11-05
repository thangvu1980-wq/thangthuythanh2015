
import React, { useState } from 'react';
import ProblemSolver from './components/ProblemSolver';
import ConceptExplainer from './components/ConceptExplainer';

type Tab = 'solver' | 'explainer';

const CalculatorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 00-1 1v1a1 1 0 001 1h6a1 1 0 001-1V5a1 1 0 00-1-1H7zM6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h2a1 1 0 100-2H7zm4 0a1 1 0 100 2h2a1 1 0 100-2h-2z" clipRule="evenodd" />
    </svg>
);

const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 100 2h.01a1 1 0 100-2H11zM10 1a1 1 0 011 1v1a1 1 0 11-2 0V2a1 1 0 011-1zM9 15a1 1 0 112 0v2a1 1 0 11-2 0v-2zM4.929 7.929a1 1 0 011.414 0L7.05 8.636a1 1 0 11-1.414 1.414l-1.414-1.414a1 1 0 010-1.414zM12.95 8.636a1 1 0 011.414-1.414l.707.707a1 1 0 01-1.414 1.414l-.707-.707zM3 11a1 1 0 100 2h1.01a1 1 0 100-2H3zM15 11a1 1 0 100 2h.01a1 1 0 100-2H15zM7.05 12.05a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM12.243 12.95a1 1 0 01.707-.707l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-.707.707z" />
        <path d="M10 6a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
);

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('solver');

    const tabClasses = (tabName: Tab) => 
        `flex items-center justify-center w-full px-4 py-3 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800 focus:ring-sky-500 ${
            activeTab === tabName 
                ? 'bg-sky-500 text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
        }`;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        AI Math Teacher Assistant
                    </h1>
                    <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Your personal guide to solving problems and understanding concepts.
                    </p>
                </header>

                <main>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg mb-8 max-w-md mx-auto">
                        <div className="flex space-x-2">
                            <button onClick={() => setActiveTab('solver')} className={tabClasses('solver')}>
                                <CalculatorIcon />
                                Problem Solver
                            </button>
                            <button onClick={() => setActiveTab('explainer')} className={tabClasses('explainer')}>
                                <LightbulbIcon />
                                Concept Explainer
                            </button>
                        </div>
                    </div>

                    <div className="transition-all duration-500">
                        {activeTab === 'solver' && <ProblemSolver />}
                        {activeTab === 'explainer' && <ConceptExplainer />}
                    </div>
                </main>
                
                <footer className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
                    <p>Powered by Gemini API. Designed for educational purposes.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
