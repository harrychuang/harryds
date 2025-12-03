import type { DropdownOption } from 'hds';

const projectTypeOptionConfigs: Array<{ value: string; labelKey: string }> = [
  { value: 'flexCollab', labelKey: 'contactModal.projectTypes.flexCollab' },
  { value: 'uiuxProduct', labelKey: 'contactModal.projectTypes.uiuxProduct' },
  { value: 'webDesignDev', labelKey: 'contactModal.projectTypes.webDesignDev' },
  { value: 'frontendDev', labelKey: 'contactModal.projectTypes.frontendDev' },
  { value: 'designSystemBuild', labelKey: 'contactModal.projectTypes.designSystemBuild' },
  { value: 'designSystemTraining', labelKey: 'contactModal.projectTypes.designSystemTraining' },
  { value: 'other', labelKey: 'contactModal.projectTypes.other' },
];

const budgetOptionConfigs: Array<{ value: string; labelKey: string }> = [
  { value: 'flexibleCollab', labelKey: 'contactModal.budgets.flexibleCollab' },
  { value: 'oneTime', labelKey: 'contactModal.budgets.oneTime' },
  { value: 'monthlyConsulting', labelKey: 'contactModal.budgets.monthlyConsulting' },
  { value: 'frontendDev', labelKey: 'contactModal.budgets.frontendDev' },
  { value: 'unsure', labelKey: 'contactModal.budgets.unsure' },
];

export const getContactProjectTypeOptions = (
  t: (key: string, options?: Record<string, unknown>) => string,
  options?: Record<string, unknown>
): DropdownOption[] =>
  projectTypeOptionConfigs.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey, options),
  }));

export const getContactBudgetOptions = (
  t: (key: string, options?: Record<string, unknown>) => string,
  options?: Record<string, unknown>
): DropdownOption[] =>
  budgetOptionConfigs.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey, options),
  }));

