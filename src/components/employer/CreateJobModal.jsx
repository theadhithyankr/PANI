import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, FileText } from 'lucide-react';
import Button from '../common/Button';
import JobFormModal from './JobFormModal';

const CreateJobModal = ({ isOpen, onClose, onCreateManual, onCreateWithAI, isLoading }) => {
  const { t } = useTranslation('employer');
  const [showJobForm, setShowJobForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);

  const handleCreateManually = () => {
    setShowJobForm(true);
  };

  const handleCreateWithAI = () => {
    setShowAIForm(true);
    // We'll implement the AI conversation flow later
  };

  const handleJobSubmit = async (jobData) => {
    try {
      await onCreateManual(jobData);
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  if (showJobForm) {
    return (
      <JobFormModal
        isOpen={true}
        onClose={() => {
          setShowJobForm(false);
          onClose();
        }}
        onSubmit={handleJobSubmit}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" onClick={onClose} />

        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
          <div className="px-6 py-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {t('createJobModal.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manual Creation */}
              <button
                onClick={handleCreateManually}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('createJobModal.createManually')}</h3>
                <p className="text-sm text-gray-500 text-center">
                  {t('createJobModal.createManuallyDesc')}
                </p>
              </button>

              {/* AI-Assisted Creation */}
              <button
                onClick={handleCreateWithAI}
                className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200">
                  <Bot className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('createJobModal.createWithAI')}</h3>
                <p className="text-sm text-gray-500 text-center">
                  {t('createJobModal.createWithAIDesc')}
                </p>
                <span className="mt-2 text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  {t('createJobModal.comingSoon')}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {t('createJobModal.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;
