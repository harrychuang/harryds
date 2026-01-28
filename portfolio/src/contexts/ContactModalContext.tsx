import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PopupModal, Input, Dropdown } from 'hds';
import type { DropdownOption } from 'hds';
import { getContactBudgetOptions, getContactProjectTypeOptions } from '../utils/contactModalOptions';
import emailjs from '@emailjs/browser';

// 中文翻譯對照表（用於郵件內容）
const PROJECT_TYPE_ZH: Record<string, string> = {
  uiuxProduct: '產品 UI/UX 設計',
  webDesignDev: '網站設計與開發',
  frontendDev: '前端開發（React / Next.js）',
  designSystemBuild: '設計系統建置',
  designSystemTraining: '設計系統培訓與顧問',
  flexCollab: '彈性兼職或長期合作',
  other: '其他',
};

const BUDGET_ZH: Record<string, string> = {
  unsure: '不確定',
  flexibleCollab: '彈性兼職合作：NT$ 1,500 – 3,000 / 小時',
  oneTime: '一次性專案：NT$ 80,000 – 200,000+',
  monthlyConsulting: '月顧問（Design System / UX Strategy）：NT$ 80,000 – 180,000 / 月',
  frontendDev: '前端開發（React / Component）：NT$ 80,000 – 180,000+',
};

interface ContactModalContextValue {
  openContactModal: () => void;
  closeContactModal: () => void;
  isOpen: boolean;
}

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

export const useContactModal = () => {
  const context = useContext(ContactModalContext);
  if (!context) {
    throw new Error('useContactModal must be used within a ContactModalProvider');
  }
  return context;
};

interface ContactModalProviderProps {
  children: React.ReactNode;
}

export const ContactModalProvider: React.FC<ContactModalProviderProps> = ({ children }) => {
  const { t } = useTranslation('common');
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactProjectType, setContactProjectType] = useState('');
  const [contactBudget, setContactBudget] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 成功/錯誤 Modal 狀態
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Options
  const projectTypeOptions: DropdownOption[] = useMemo(
    () => getContactProjectTypeOptions(t),
    [t]
  );

  const budgetOptions: DropdownOption[] = useMemo(
    () => getContactBudgetOptions(t),
    [t]
  );

  const openContactModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeContactModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetForm = useCallback(() => {
    setContactName('');
    setContactEmail('');
    setContactProjectType('');
    setContactBudget('');
    setContactMessage('');
  }, []);

  const handleSubmit = useCallback(async () => {
    // 基本驗證
    if (!contactName.trim() || !contactEmail.trim()) {
      setErrorMessage(t('contactModal.validationError') || 'Please fill in all required fields');
      setIsErrorModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // EmailJS 配置
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.error('[Contact] EmailJS 配置缺失');
        setErrorMessage(t('contactModal.error') || 'Configuration error. Please try again later.');
        setIsErrorModalOpen(true);
        return;
      }

      // 將選項 key 轉換為中文顯示文字
      const projectTypeZh = contactProjectType 
        ? (PROJECT_TYPE_ZH[contactProjectType] || contactProjectType)
        : '未指定';
      const budgetZh = contactBudget 
        ? (BUDGET_ZH[contactBudget] || contactBudget)
        : '未指定';

      // 發送郵件
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: contactName,
          from_email: contactEmail,
          project_type: projectTypeZh,
          budget: budgetZh,
          message: contactMessage || '無訊息',
          reply_to: contactEmail,
        },
        publicKey
      );

      setIsOpen(false);
      resetForm();
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error('[Contact] 發送郵件失敗:', error);
      setErrorMessage(t('contactModal.error') || 'Failed to send message. Please try again.');
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [contactName, contactEmail, contactProjectType, contactBudget, contactMessage, t, resetForm]);

  const contextValue = useMemo(() => ({
    openContactModal,
    closeContactModal,
    isOpen,
  }), [openContactModal, closeContactModal, isOpen]);

  return (
    <ContactModalContext.Provider value={contextValue}>
      {children}
      
      {/* 共用的 Contact Modal */}
      <PopupModal
        isOpen={isOpen}
        onClose={closeContactModal}
        heading={t('contactModal.heading')}
        description={`${t('contactModal.description')}\n\n${t('contactModal.alternativeContact')}`}
        primaryButtonText={isSubmitting ? (t('contactModal.sending') || 'Sending...') : t('contactModal.send')}
        secondaryButtonText={t('contactModal.cancel')}
        onPrimaryClick={handleSubmit}
        primaryButtonDisabled={isSubmitting}
      >
        <Input
          label={t('contactModal.name')}
          placeholder={t('contactModal.namePlaceholder')}
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('contactModal.email')}
          placeholder={t('contactModal.emailPlaceholder')}
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <Dropdown
          label={t('contactModal.projectType')}
          options={projectTypeOptions}
          value={contactProjectType}
          onChange={(val) => {
            setContactProjectType(val);
            setContactBudget('');
          }}
          placeholder={t('contactModal.projectTypePlaceholder')}
          required
          disabled={isSubmitting}
        />
        <Dropdown
          key={`contact-budget-${contactProjectType || 'default'}`}
          label={t('contactModal.budget')}
          options={budgetOptions}
          value={contactBudget}
          onChange={(val) => setContactBudget(val)}
          placeholder={t('contactModal.budgetPlaceholder')}
          required
          disabled={isSubmitting}
        />
        <Input
          label={t('contactModal.message')}
          placeholder={t('contactModal.messagePlaceholder')}
          value={contactMessage}
          onChange={(e) => setContactMessage(e.target.value)}
          disabled={isSubmitting}
        />
      </PopupModal>

      {/* 成功 Modal */}
      <PopupModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        heading={t('contactModal.successHeading') || 'MESSAGE SENT!'}
        description={t('contactModal.success')}
        primaryButtonText={t('contactModal.ok') || 'OK'}
        onPrimaryClick={() => setIsSuccessModalOpen(false)}
      />

      {/* 錯誤 Modal */}
      <PopupModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        heading={t('contactModal.errorHeading') || 'OOPS!'}
        description={errorMessage}
        primaryButtonText={t('contactModal.ok') || 'OK'}
        onPrimaryClick={() => setIsErrorModalOpen(false)}
      />
    </ContactModalContext.Provider>
  );
};

export default ContactModalContext;

