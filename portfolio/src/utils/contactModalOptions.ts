import type { DropdownOption } from 'hds';
import type { TFunction } from 'i18next';

type TranslationOptions = Parameters<TFunction>[1];

const projectTypeOptionConfigs: Array<{ value: string; labelKey: string }> = [
  { value: 'uiuxProduct', labelKey: 'contactModal.projectTypes.uiuxProduct' },
  { value: 'webDesignDev', labelKey: 'contactModal.projectTypes.webDesignDev' },
  { value: 'frontendDev', labelKey: 'contactModal.projectTypes.frontendDev' },
  { value: 'designSystemBuild', labelKey: 'contactModal.projectTypes.designSystemBuild' },
  { value: 'designSystemTraining', labelKey: 'contactModal.projectTypes.designSystemTraining' },
  { value: 'flexCollab', labelKey: 'contactModal.projectTypes.flexCollab' },
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
  t: TFunction,
  options?: TranslationOptions
): DropdownOption[] =>
  projectTypeOptionConfigs.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey, options),
  }));

export const getContactBudgetOptions = (
  t: TFunction,
  options?: TranslationOptions
): DropdownOption[] =>
  budgetOptionConfigs.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey, options),
  }));

