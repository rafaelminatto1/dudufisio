/**
 * FisioFlow Polish Components and Utilities Index
 * Exports all UI polish, Brazilian localization, and UX components
 */

// Loading and Skeleton Components (T073)
export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonForm,
  SkeletonAvatar,
  SkeletonText,
  SkeletonChart,
} from '@/src/components/ui/skeleton'

export {
  Loading,
  LoadingPage,
  LoadingButton,
  LoadingCard,
  LoadingTable,
  LoadingDashboard,
  LOADING_MESSAGES,
} from '@/src/components/ui/loading'

// Toast Notifications with Portuguese Messages (T074)
export {
  toast,
  TOAST_MESSAGES,
} from '@/src/components/ui/toast'

export { Toaster } from '@/src/components/ui/sonner'

// Responsive Mobile Layout Components (T075)
export {
  MobileLayout,
  MobileHeader,
  MobileBottomNav,
  MobileCard,
  MobileForm,
  MobileContainer,
  MobileStack,
  MobileGrid,
  MobileDrawer,
  FISIOFLOW_NAV_ITEMS,
} from '@/src/components/ui/mobile-layout'

export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveStack,
  ResponsiveText,
  ResponsiveSpacing,
  ShowOn,
  HideOn,
} from '@/src/components/ui/responsive'

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/src/components/ui/sheet'

// Brazilian Form Components (T076)
export {
  BrazilianFormField,
  CPFInput,
  PhoneInput,
  CEPInput,
  BrazilianDateInput,
  BrazilianAddressForm,
  PatientPersonalDataForm,
  formatCPF,
  formatPhone,
  formatCEP,
  formatBrazilianDate as formatBrazilianDateForm,
} from '@/src/components/ui/brazilian-forms'

// Portuguese Date/Time Formatting (T077)
export {
  formatBrazilianDate,
  formatBrazilianTime,
  getRelativeTime,
  calculateAge,
  formatAge,
  getDayOfWeek,
  getMonthName,
  isToday,
  isTomorrow,
  isYesterday,
  formatDateWithContext,
  parseBrazilianDate,
  getBrazilianTimezone,
  utcToBrazilianTime,
  formatDuration,
  getPeriodOfDay,
  HEALTHCARE_DATE_UTILS,
  DATE_FORMATS,
  MONTHS,
  MONTHS_SHORT,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  BUSINESS_HOURS,
} from '@/src/lib/utils/brazilian-formatting'

// Brazilian Currency Formatting (T078)
export {
  formatCurrency,
  parseCurrency,
  formatCurrencyInput,
  formatPercentage,
  calculateInstallment,
  formatInstallment,
  formatPaymentMethod,
  calculatePriceAdjustment,
  formatDiscount,
  isValidCurrency,
  HEALTHCARE_CURRENCY_UTILS,
  PAYMENT_METHODS,
  INSTALLMENT_PERIODS,
  createCurrencyMask,
} from '@/src/lib/utils/brazilian-currency'

export { CurrencyInput } from '@/src/components/ui/currency-input'

// Portuguese Validation Messages (T079)
export {
  VALIDATION_MESSAGES,
  BRAZILIAN_VALIDATION_MESSAGES,
  HEALTHCARE_VALIDATION_MESSAGES,
  PROFESSIONAL_VALIDATION_MESSAGES,
  ALL_VALIDATION_MESSAGES,
  getValidationMessage,
  formatFieldName,
} from '@/src/lib/validation/portuguese-messages'

export {
  validateCPF,
  validateCNPJ,
  validateBrazilianPhone,
  validateCEP,
  validateBrazilianDate,
  validateBrazilianTime,
  validateCREFITO,
  validateAge,
  BrazilianSchemas,
  HealthcareSchemas,
  BrazilianAddressSchema,
} from '@/src/lib/validation/brazilian-validators'

export type {
  PatientFormData,
  AppointmentFormData,
  SessionFormData,
  ExerciseFormData,
  PaymentFormData,
  ProfessionalFormData,
  AddressFormData,
} from '@/src/lib/validation/brazilian-validators'

// Portuguese Accessibility Features (T080)
export {
  ARIA_LABELS,
  HEALTHCARE_ARIA_LABELS,
  SCREEN_READER_ANNOUNCEMENTS,
  KEYBOARD_INSTRUCTIONS,
  ACCESSIBILITY_HELPERS,
  FOCUS_MANAGEMENT,
  VISUAL_ACCESSIBILITY,
} from '@/src/lib/accessibility/portuguese-labels'

export {
  SkipLinks,
  AccessibleFormField,
  AccessibleButton,
  AccessibleTable,
  AccessibleModal,
  LiveRegion,
  AccessibleProgress,
  AccessibleTabs,
  StatusBadge,
} from '@/src/components/ui/accessible-components'

export type {
  AriaLabel,
  HealthcareAriaLabel,
  ScreenReaderAnnouncement,
} from '@/src/lib/accessibility/portuguese-labels'

// Combined utilities for easy import
// Note: Commented out to allow build completion - some components may need fixing
// export const FisioFlowUI = {
//   // Loading states
//   Loading,
//   LoadingButton,
//   LoadingDashboard,
//   Skeleton,
//   SkeletonCard,

//   // Mobile components
//   MobileLayout,
//   MobileHeader,
//   MobileBottomNav,
//   ResponsiveContainer,
//   ResponsiveGrid,

//   // Brazilian forms
//   BrazilianFormField,
//   CPFInput,
//   PhoneInput,
//   CEPInput,
//   CurrencyInput,

//   // Accessible components
//   AccessibleButton,
//   AccessibleFormField,
//   AccessibleModal,
//   StatusBadge,

//   // Notifications
//   toast,
// } as const

// export const FisioFlowUtils = {
//   // Date/time
//   formatBrazilianDate,
//   formatBrazilianTime,
//   getRelativeTime,
//   calculateAge,

//   // Currency
//   formatCurrency,
//   parseCurrency,
//   formatInstallment,

//   // Validation
//   validateCPF,
//   validateCNPJ,
//   validateBrazilianPhone,
//   validateCEP,

//   // Accessibility
//   getFieldLabel: ACCESSIBILITY_HELPERS.getFieldLabel,
//   getLiveAnnouncement: ACCESSIBILITY_HELPERS.getLiveAnnouncement,
// } as const