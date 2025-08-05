import React from 'react';
import { Code, Sparkles, Folder, Home } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

function Header() {
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (path) => pathname === path;

    return (
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Title */}
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                            <Code className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white">
                            AI Powered Website Builder
                        </h1>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center space-x-6">
                        <nav className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                    isActive('/') 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                            >
                                <Home className="h-4 w-4" />
                                <span>Home</span>
                            </button>
                            <button
                                onClick={() => router.push('/projects')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                    isActive('/projects') 
                                        ? 'bg-blue-500/20 text-blue-400' 
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                            >
                                <Folder className="h-4 w-4" />
                                <span>Projects</span>
                            </button>
                        </nav>

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
                            <Sparkles className="h-4 w-4" />
                            <span>AI Ready</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;