"use client"
import React, { use, useContext, useRef } from 'react';
import { useState } from 'react';
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
    SandpackFileExplorer,
    useSandpack
} from "@codesandbox/sandpack-react";
import Lookup from '@/data/Lookup';
import { MessagesContext } from '@/context/MessagesContext';
import axios from 'axios';
import Prompt from '@/data/Prompt';
import { generateAICode, createProject, updateProject, getProject } from '@/lib/fastapi-client';
import { useEffect } from 'react';
import { UpdateFiles } from '@/convex/workspace';
import { useConvex, useMutation } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Loader2Icon, Download } from 'lucide-react';
import JSZip from 'jszip';

// Component to listen for code changes and auto-save
function CodeChangeListener({ onFilesChange, projectId, currentProjectId }) {
    const { sandpack } = useSandpack();
    const [lastSavedFiles, setLastSavedFiles] = useState(null);
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        const currentFiles = sandpack.files;
        
        // Initialize lastSavedFiles if it's null
        if (lastSavedFiles === null) {
            setLastSavedFiles(JSON.parse(JSON.stringify(currentFiles))); // Deep copy
            return;
        }
        
        // Check if files have actually changed by comparing content
        const hasChanged = Object.keys(currentFiles).some(filePath => {
            const currentContent = currentFiles[filePath]?.code || '';
            const lastContent = lastSavedFiles[filePath]?.code || '';
            return currentContent !== lastContent;
        }) || Object.keys(lastSavedFiles).some(filePath => {
            // Check for deleted files
            return !currentFiles[filePath];
        });
        
        if (hasChanged) {
            console.log('Files changed, scheduling save...', {
                currentFileCount: Object.keys(currentFiles).length,
                lastSavedFileCount: Object.keys(lastSavedFiles).length
            });
            
            // Clear existing timeout
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            
            // Debounce the save operation to avoid too many API calls
            saveTimeoutRef.current = setTimeout(() => {
                console.log('Auto-saving files...', Object.keys(currentFiles));
                setLastSavedFiles(JSON.parse(JSON.stringify(currentFiles))); // Deep copy
                onFilesChange(currentFiles);
            }, 1500); // Save after 1.5 seconds of no changes
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [sandpack.files, lastSavedFiles, onFilesChange]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return null; // This component doesn't render anything
}

function CodeView() {

    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('code');
    const [files,setFiles]=useState(Lookup?.DEFAULT_FILE);
    const {messages,setMessages}=useContext(MessagesContext);
    const UpdateFiles=useMutation(api.workspace.UpdateFiles);
    const convex=useConvex();
    const [loading,setLoading]=useState(false);
    const [currentProjectId, setCurrentProjectId] = useState(null); // Track current project ID
    const [isSaving, setIsSaving] = useState(false); // Track auto-save status

    useEffect(() => {
        id&&GetFiles();
    }, [id])

    const GetFiles=async()=>{
        try {
            // Check if this is a project ID (starts with 'project-')
            if (id.startsWith('project-')) {
                const projectId = id.replace('project-', '');
                const project = await getProject(projectId);
                
                // Load project files
                if (project.files) {
                    const processedFiles = preprocessFiles(project.files);
                    const mergedFiles = {...Lookup.DEFAULT_FILE, ...processedFiles};
                    setFiles(mergedFiles);
                }
            } else {
                // This is a regular Convex workspace
                const result = await convex.query(api.workspace.GetWorkspace, {
                    workspaceId: id
                });
                // Preprocess and validate files before merging
                const processedFiles = preprocessFiles(result?.fileData || {});
                const mergedFiles = {...Lookup.DEFAULT_FILE, ...processedFiles};
                setFiles(mergedFiles);
            }
        } catch (error) {
            console.error('Error loading files:', error);
            // Keep default files if loading fails
            setFiles(Lookup.DEFAULT_FILE);
        }
    }

    // Add file preprocessing function
    const preprocessFiles = (files) => {
        const processed = {};
        Object.entries(files).forEach(([path, content]) => {
            // Ensure the file has proper content structure
            if (typeof content === 'string') {
                processed[path] = { code: content };
            } else if (content && typeof content === 'object') {
                if (!content.code && typeof content === 'object') {
                    processed[path] = { code: JSON.stringify(content, null, 2) };
                } else {
                    processed[path] = content;
                }
            }
        });
        return processed;
    }

    useEffect(() => {
            if (messages?.length > 0) {
                const role = messages[messages?.length - 1].role;
                if (role === 'user') {
                    GenerateAiCode();
                }
            }
        }, [messages])

    const GenerateAiCode=async()=>{
        setLoading(true);
        try {
            const PROMPT=JSON.stringify(messages)+" "+Prompt.CODE_GEN_PROMPT;
            const result = await generateAICode(PROMPT);
            
            // Preprocess AI-generated files
            const processedAiFiles = preprocessFiles(result?.files || {});
            const mergedFiles = {...Lookup.DEFAULT_FILE, ...processedAiFiles};
            setFiles(mergedFiles);

            // Only update Convex if this is a regular workspace, not a project
            if (!id.startsWith('project-')) {
                await UpdateFiles({
                    workspaceId:id,
                    files:result?.files
                });
            }

            // Auto-save project to FastAPI backend
            await saveProjectToBackend(result);
        } catch (error) {
            console.error('Error generating AI code:', error);
        }
        setLoading(false);
    }

    const saveProjectToBackend = async (aiResult) => {
        try {
            if (!aiResult || !aiResult.files) return;

            // Check if we're working on an existing project
            const isExistingProject = id.startsWith('project-');
            const existingProjectId = isExistingProject ? id.replace('project-', '') : null;

            // Extract project title from AI result or use first user message
            const projectTitle = aiResult.projectTitle || 
                (messages && messages.length > 0 ? 
                    messages.find(m => m.role === 'user')?.content?.substring(0, 50) + '...' : 
                    'Untitled Project');

            const projectDescription = aiResult.explanation || 
                'AI-generated project created from user prompt';

            const userPrompt = messages && messages.length > 0 ? 
                messages.find(m => m.role === 'user')?.content || '' : '';

            if (isExistingProject && existingProjectId) {
                // Update existing project (viewing from projects page)
                const updateData = {
                    title: projectTitle,
                    description: projectDescription,
                    files: aiResult.files,
                    thumbnail: null
                };
                
                await updateProject(existingProjectId, updateData);
                console.log('Project updated successfully');
            } else if (currentProjectId) {
                // Update project created in this session
                const updateData = {
                    title: projectTitle,
                    description: projectDescription,
                    files: aiResult.files,
                    thumbnail: null
                };
                
                await updateProject(currentProjectId, updateData);
                console.log('Session project updated successfully');
            } else {
                // Create new project and store its ID for future updates
                const projectData = {
                    title: projectTitle,
                    description: projectDescription,
                    prompt: userPrompt,
                    files: aiResult.files,
                    thumbnail: null
                };

                const newProject = await createProject(projectData);
                setCurrentProjectId(newProject.id); // Store the project ID for future updates
                console.log('New project created successfully:', newProject.id);
            }
        } catch (error) {
            console.error('Error saving project to backend:', error);
            // Don't show error to user as this is background functionality
        }
    }
    
    // Handle file changes from the code editor
    const handleFilesChange = async (updatedFiles) => {
        try {
            setIsSaving(true);
            
            // Update local state
            setFiles(updatedFiles);
            
            // Auto-save to backend
            await saveFilesToBackend(updatedFiles);
            
            setIsSaving(false);
        } catch (error) {
            console.error('Error handling file changes:', error);
            setIsSaving(false);
        }
    };

    // Save file changes to backend
    const saveFilesToBackend = async (updatedFiles) => {
        try {
            // Check if we're working on an existing project
            const isExistingProject = id.startsWith('project-');
            const existingProjectId = isExistingProject ? id.replace('project-', '') : null;

            if (isExistingProject && existingProjectId) {
                // Update existing project with new files
                const updateData = {
                    files: updatedFiles
                };
                
                await updateProject(existingProjectId, updateData);
                console.log('Project files updated successfully');
            } else if (currentProjectId) {
                // Update project created in this session
                const updateData = {
                    files: updatedFiles
                };
                
                await updateProject(currentProjectId, updateData);
                console.log('Session project files updated successfully');
            }
            // If no project exists yet, files will be saved when AI generates code
        } catch (error) {
            console.error('Error saving files to backend:', error);
        }
    };

    const downloadFiles = async () => {
        try {
            // Create a new JSZip instance
            const zip = new JSZip();
            
            // Add each file to the zip
            Object.entries(files).forEach(([filename, content]) => {
                // Handle the file content based on its structure
                let fileContent;
                if (typeof content === 'string') {
                    fileContent = content;
                } else if (content && typeof content === 'object') {
                    if (content.code) {
                        fileContent = content.code;
                    } else {
                        // If it's an object without code property, stringify it
                        fileContent = JSON.stringify(content, null, 2);
                    }
                }

                // Only add the file if we have content
                if (fileContent) {
                    // Remove leading slash if present
                    const cleanFileName = filename.startsWith('/') ? filename.slice(1) : filename;
                    zip.file(cleanFileName, fileContent);
                }
            });

            // Add package.json with dependencies
            const packageJson = {
                name: "generated-project",
                version: "1.0.0",
                private: true,
                dependencies: Lookup.DEPENDANCY,
                scripts: {
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview"
                }
            };
            zip.file("package.json", JSON.stringify(packageJson, null, 2));

            // Generate the zip file
            const blob = await zip.generateAsync({ type: "blob" });
            
            // Create download link and trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project-files.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading files:', error);
        }
    };

    return (
        <div className='relative'>
            <div className='bg-[#181818] w-full p-2 border'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center flex-wrap shrink-0 bg-black p-1 justify-center
                    w-[140px] gap-3 rounded-full'>
                        <h2 onClick={() => setActiveTab('code')}
                            className={`text-sm cursor-pointer 
                        ${activeTab == 'code' && 'text-blue-500 bg-blue-500 bg-opacity-25 p-1 px-2 rounded-full'}`}>
                            Code</h2>

                        <h2 onClick={() => setActiveTab('preview')}
                            className={`text-sm cursor-pointer 
                        ${activeTab == 'preview' && 'text-blue-500 bg-blue-500 bg-opacity-25 p-1 px-2 rounded-full'}`}>
                            Preview</h2>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Auto-save indicator */}
                        {isSaving && (
                            <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
                                <span>Saving...</span>
                            </div>
                        )}
                        
                        {/* Download Button */}
                        <button
                            onClick={downloadFiles}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition-colors duration-200"
                        >
                            <Download className="h-4 w-4" />
                            <span>Download Files</span>
                        </button>
                    </div>
                </div>
            </div>
            <SandpackProvider 
            files={files}
            template="react" 
            theme={'dark'}
            customSetup={{
                dependencies: {
                    ...Lookup.DEPENDANCY
                },
                entry: '/index.js'
            }}
            options={{
                externalResources: ['https://cdn.tailwindcss.com'],
                bundlerTimeoutSecs: 120,
                recompileMode: "immediate",
                recompileDelay: 300
            }}
            >
                <CodeChangeListener 
                    onFilesChange={handleFilesChange}
                    projectId={id}
                    currentProjectId={currentProjectId}
                />
                <div className="relative">
                    <SandpackLayout>
                        {activeTab=='code'?<>
                            <SandpackFileExplorer style={{ height: '80vh' }} />
                            <SandpackCodeEditor 
                            style={{ height: '80vh' }}
                            showTabs
                            showLineNumbers
                            showInlineErrors
                            wrapContent />
                        </>:
                        <>
                            <SandpackPreview 
                                style={{ height: '80vh' }} 
                                showNavigator={true}
                                showOpenInCodeSandbox={false}
                                showRefreshButton={true}
                            />
                        </>}
                    </SandpackLayout>
                </div>
            </SandpackProvider>

            {loading&&<div className='p-10 bg-gray-900 opacity-80 absolute top-0 
            rounded-lg w-full h-full flex items-center justify-center'>
                <Loader2Icon className='animate-spin h-10 w-10 text-white'/>
                <h2 className='text-white'> Generating files...</h2>
            </div>}
        </div>
    );
}

export default CodeView;