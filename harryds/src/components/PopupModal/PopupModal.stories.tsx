import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PopupModal } from './PopupModal';
import { Input } from '../Input';
import { Dropdown, DropdownOption } from '../Dropdown';

const meta: Meta<typeof PopupModal> = {
  title: 'Components/Feedback/PopupModal',
  component: PopupModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '是否顯示 Modal',
    },
    heading: {
      control: 'text',
      description: '標題',
    },
    description: {
      control: 'text',
      description: '描述文字',
    },
    primaryButtonText: {
      control: 'text',
      description: '主要按鈕文字',
    },
    secondaryButtonText: {
      control: 'text',
      description: '次要按鈕文字',
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: '點擊背景是否關閉',
    },
    closeOnEsc: {
      control: 'boolean',
      description: '按 ESC 是否關閉',
    },
    showCloseButton: {
      control: 'boolean',
      description: '是否顯示關閉按鈕',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PopupModal>;

// 基本範例
const BasicTemplate = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Open Modal
      </button>
      <PopupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        heading="Welcome!"
        description="This is a basic popup modal with heading, description and buttons."
        primaryButtonText="Confirm"
        secondaryButtonText="Cancel"
        onPrimaryClick={() => {
          alert('Confirmed!');
          setIsOpen(false);
        }}
      />
    </>
  );
};

export const Default: Story = {
  render: () => <BasicTemplate />,
};

// 帶表單的 Modal
const FormTemplate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');

  const countryOptions: DropdownOption[] = [
    { value: 'tw', label: '台灣 Taiwan' },
    { value: 'jp', label: '日本 Japan' },
    { value: 'us', label: '美國 United States' },
    { value: 'uk', label: '英國 United Kingdom' },
  ];

  const handleSubmit = () => {
    alert(`Name: ${name}\nEmail: ${email}\nCountry: ${country}`);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Open Form Modal
      </button>
      <PopupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        heading="Create Account"
        description="Please fill in the form below to create your account."
        primaryButtonText="Submit"
        secondaryButtonText="Cancel"
        onPrimaryClick={handleSubmit}
      >
        <Input
          label="Name"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          placeholder="Enter your email..."
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Dropdown
          label="Country"
          options={countryOptions}
          value={country}
          onChange={(val) => setCountry(val)}
          placeholder="Select country..."
          required
        />
      </PopupModal>
    </>
  );
};

export const WithForm: Story = {
  render: () => <FormTemplate />,
};

// 確認對話框
const ConfirmTemplate = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
          background: '#f03fa6',
          color: '#fff',
          border: 'none',
        }}
      >
        Delete Item
      </button>
      <PopupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        heading="Delete Item?"
        description="Are you sure you want to delete this item? This action cannot be undone."
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onPrimaryClick={() => {
          alert('Item deleted!');
          setIsOpen(false);
        }}
      />
    </>
  );
};

export const ConfirmDialog: Story = {
  render: () => <ConfirmTemplate />,
};

// 只有標題和內容
const SimpleTemplate = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Open Simple Modal
      </button>
      <PopupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        heading="Information"
        description="This modal only has heading and description, with no action buttons. Click the close button or press ESC to close."
      />
    </>
  );
};

export const SimpleModal: Story = {
  render: () => <SimpleTemplate />,
};

// 無關閉按鈕
const NoCloseButtonTemplate = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        Open Modal (No Close Button)
      </button>
      <PopupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        heading="Terms of Service"
        description="You must accept the terms of service to continue."
        primaryButtonText="Accept"
        showCloseButton={false}
        closeOnOverlayClick={false}
        closeOnEsc={false}
        onPrimaryClick={() => setIsOpen(false)}
      />
    </>
  );
};

export const NoCloseButton: Story = {
  render: () => <NoCloseButtonTemplate />,
};

// Contact Modal - 工作室聯繫表單
const ContactTemplate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState('');
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');

  const projectTypeOptions: DropdownOption[] = [
    { value: 'brand', label: 'Brand Identity' },
    { value: 'web', label: 'Web Design' },
    { value: 'uiux', label: 'UI/UX Design' },
    { value: 'dev', label: 'Development' },
    { value: 'other', label: 'Other' },
  ];

  const budgetOptions: DropdownOption[] = [
    { value: 'unsure', label: 'Not Sure' },
    { value: 'under20k', label: '< $600' },
    { value: '20k-100k', label: '$600 - $3,000' },
    { value: '100k-200k', label: '$3,000 - $6,000' },
    { value: '200k+', label: '$6,000+' },
  ];

  const handleSubmit = () => {
    console.log({
      name,
      email,
      projectType,
      budget,
      message,
    });
    alert(`Thank you, ${name}! We'll get back to you soon.`);
    setIsOpen(false);
    // Reset form
    setName('');
    setEmail('');
    setProjectType('');
    setBudget('');
    setMessage('');
  };

  const isFormValid = name && email;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '16px 32px',
          fontSize: '16px',
          cursor: 'pointer',
          background: '#171717',
          color: '#fff',
          border: 'none',
          fontFamily: "'PublicPixel', monospace",
          textTransform: 'uppercase',
        }}
      >
        Let's Work Together
      </button>
      <PopupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        heading="Let's Work Together"
        description="Tell us about your project and we'll get back to you within 24 hours."
        primaryButtonText="Send Message"
        secondaryButtonText="Cancel"
        onPrimaryClick={handleSubmit}
      >
        <Input
          label="Name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          placeholder="your@email.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Dropdown
          label="Project Type"
          options={projectTypeOptions}
          value={projectType}
          onChange={(val) => setProjectType(val)}
          placeholder="Select project type..."
        />
        <Dropdown
          label="Budget"
          options={budgetOptions}
          value={budget}
          onChange={(val) => setBudget(val)}
          placeholder="Select budget range..."
        />
        <Input
          label="Message"
          placeholder="Tell us about your project..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </PopupModal>
    </>
  );
};

export const ContactModal: Story = {
  render: () => <ContactTemplate />,
};

