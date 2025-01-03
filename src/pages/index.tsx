// src/pages/index.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { uploadDocument, listDocuments, deleteDocument, listApprovedUsers, approveUser, removeUserApproval } from '@/lib/api';
import { useAuth } from '@/lib/auth/AuthContext';
import { Document } from '@/types';

// Import all our components
import { DocumentHeader } from '@/components/home/DocumentHeader';
import { DocumentSelector } from '@/components/home/DocumentSelector';
import { UploadHandler } from '@/components/home/UploadHandler';
import { AdminPanel } from '@/components/home/AdminPanel';
import ExplainerSection from '@/components/home/ExplainerSection';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import { UploadProgressModal } from '@/components/modals/UploadProgressModal';
import ApprovalRequestModal from '@/components/modals/ApprovalRequestModal';
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

export default function Home() {
  const router = useRouter();
  const { user, token, login, authError } = useAuth();
  const [selectedText, setSelectedText] = useState<Document | null>(null);
  const [userDocuments, setUserDocuments] = useState<Document[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDemo, setIsDemo] = useState(!user);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Admin state
  const [approvedUsers, setApprovedUsers] = useState<Array<{ id: string; email: string; name: string; created_at: string; last_login: string | null; }>>([]);
  const [newApprovalEmail, setNewApprovalEmail] = useState('');
  const [isLoadingApprovedUsers, setIsLoadingApprovedUsers] = useState(false);

  const { trackEvent } = useGoogleAnalytics();

  useEffect(() => {
    if (authError) {
      setIsModalOpen(true);
    }
  }, [authError]);

  // Keep all your existing useEffects exactly the same
  useEffect(() => {
    // Only handle the initial Google sign-in
    if (!user) {
      const googleToken = localStorage.getItem('google_token');
      if (googleToken && googleToken !== 'undefined') {
        login(googleToken)
          .catch((error) => {
            setIsModalOpen(true);
            console.error('Login error:', error);
            localStorage.removeItem('google_token');
          });
      }
    }
  }, [user, login]);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await listDocuments(token, !user);
        setUserDocuments(docs);
        setSelectedText(null);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    };
    loadDocuments();
  }, [token, user]);

  useEffect(() => {
    setIsDemo(!user);
  }, [user]);

  useEffect(() => {
    const fetchApprovedUsers = async () => {
      if (!user?.is_admin || !token) return;
      
      setIsLoadingApprovedUsers(true);
      try {
        const data = await listApprovedUsers(token);
        setApprovedUsers(data);
      } catch (error) {
        console.error('Failed to fetch approved users:', error);
      } finally {
        setIsLoadingApprovedUsers(false);
      }
    };
  
    fetchApprovedUsers();
  }, [user, token]);

  // Keep all your existing handlers exactly the same
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) {
      if (!token) {
        console.log('No token available, please log in');
      }
      return;
    }
  
    trackEvent('Authenticated', 'upload_started');
    setIsUploading(true);
    setUploadSuccess(false);
  
    try {
      // Start the upload and get the document ID directly from the response
      const response = await uploadDocument(file, token);
      const documentId = response.document_id;
  
      console.log('Upload successful, document ID:', documentId);
  
      // Fetch the updated list of documents
      const docs = await listDocuments(token);
      setUserDocuments(docs);
  
      // Find and select the new document
      const newDoc = docs.find((doc) => doc.id === documentId);
      if (newDoc) {
        setSelectedText(newDoc);
        setUploadSuccess(true);
  
        // Redirect to the new document
        router.push(`/documents/${newDoc.id}`);
      } else {
        console.error('Uploaded document not found in updated document list.');
        setUploadSuccess(false);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadSuccess(false);
    } finally {
      setIsUploading(false);
    }
  };
  
  

  const handleApproveUser = async () => {
    if (!token || !newApprovalEmail) return;
  
    try {
      await approveUser(newApprovalEmail, token);
      
      // Refresh the list
      const updatedData = await listApprovedUsers(token);
      setApprovedUsers(updatedData);
      
      // Clear input
      setNewApprovalEmail('');
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const handleRemoveApproval = async (email: string) => {
    if (!token) return;
  
    try {
      await removeUserApproval(email, token);
      setApprovedUsers(prev => prev.filter(user => user.email !== email));
    } catch (error) {
      console.error('Failed to remove approval:', error);
    }
  };

  const handleTryItOut = () => {
    if (!selectedText) return;

    trackEvent(
      isDemo ? 'Demo' : 'Authenticated',
      'analyze_clicked',
      selectedText.id
    );
    
    // Redirect to the document page with the selected document ID
    router.push(`/documents/${selectedText.id}`);
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!token || !user) return;
    
    try {
      await deleteDocument(doc.id, token);
      
      // Refresh documents list
      const docs = await listDocuments(token, false);
      setUserDocuments(docs);
      
      // Clear deletion state
      setDocumentToDelete(null);
      
      // If the deleted document was selected, clear selection
      if (selectedText?.id === doc.id) {
        setSelectedText(null);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      throw error;
    }
  };

  return (
    <>
      <ApprovalRequestModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
      />
      
      {/* First section with normal width */}
      <div className="max-w-6xl mx-auto">
        <DocumentHeader />
        <section className="px-4">
          <div className="bg-card-bg backdrop-blur-lg rounded-3xl p-12 max-w-3xl mx-auto 
                        shadow-2xl shadow-sand-900/5 dark:shadow-sand-900/20 
                        border border-card-border">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                {isDemo ? "Try Our Example Documents" : user ? "Your Documents" : "Try Our Example Documents"}
              </h2>
              <p className="text-sand-600 dark:text-sand-400">
                {isDemo ? "No sign in needed to try an example document!" : user ? "Select or upload a document to analyze" : "No sign in needed to try an example document!"}
              </p>
            </div>
            <div className="space-y-6">
              {isDemo || user ? (
                <>
                  <DocumentSelector
                    userDocuments={userDocuments}
                    selectedText={selectedText}
                    setSelectedText={setSelectedText}
                    isDropdownOpen={isDropdownOpen}
                    setIsDropdownOpen={setIsDropdownOpen}
                    isDemo={isDemo}
                    user={user}
                    setDocumentToDelete={setDocumentToDelete}
                  />
                  {user && !isDemo && (
                    <UploadHandler
                      onUpload={handleFileUpload}
                      isUploading={isUploading}
                    />
                  )}
                  {selectedText && (
                    <button
                      onClick={handleTryItOut}
                      className="mt-6 w-full px-6 py-4 bg-button-analyze-bg hover:bg-button-analyze-hover text-button-analyze-text font-medium rounded-xl 
                               transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 text-lg"
                    >
                      <span>Analyze this document</span>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </section>
      </div>
  
      {/* Separate container for ExplainerSection with full width */}
      <div className="w-full">
        <section className="mt-28">
          <ExplainerSection />
        </section>
      </div>
  
      {/* Back to normal width for admin panel */}
      <div className="max-w-6xl mx-auto">
        {user?.is_admin && (
          <AdminPanel
            approvedUsers={approvedUsers}
            newApprovalEmail={newApprovalEmail}
            setNewApprovalEmail={setNewApprovalEmail}
            isLoadingApprovedUsers={isLoadingApprovedUsers}
            onApproveUser={handleApproveUser}
            onRemoveApproval={handleRemoveApproval}
          />
        )}
      </div>
  
      <UploadProgressModal
        isOpen={isUploading}
        uploadSuccess={uploadSuccess}
      />

  
      <DeleteConfirmationModal
        document={documentToDelete}
        userEmail={user?.email}
        onConfirm={handleDeleteDocument}
        onClose={() => setDocumentToDelete(null)}
      />
    </>
  );
}