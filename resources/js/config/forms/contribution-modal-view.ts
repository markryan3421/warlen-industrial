import type { ViewFieldConfig } from "@/components/custom-modal-view";

export const ContributionModalConfig = {
  title: 'Contribution Details',
  description: 'Viewing contribution details.',
  fields: [
    {
      key: 'salary_from',
      label: 'Salary Range',
      type: 'integer',
      fullWidth: true,
    },
    {
      key: 'employee_share',
      label: 'Employee Share',
      type: 'decimal',
      fullWidth: true,
    },
    {
      key: 'employer_share',
      label: 'Employer Share',
      type: 'decimal',
    },
    {
      key: 'effective_from',
      label: 'Effective From',
      type: 'date',
    },
  ] satisfies ViewFieldConfig[],
};
