import { required } from "@vuelidate/validators"
import { createCheckoutStep } from "@shopware-pwa/composables"
import { CHECKOUT_STEPS } from "@/logic/checkout"

export const usePersonalDetailsStep = createCheckoutStep({
  stepNumber: CHECKOUT_STEPS.PERSONAL_DETAILS,
  stepFields: {
    salutationId: null,
    firstName: null,
    lastName: null,
    email: null,
  },
  stepDataUpdated: (updatedData) => {
    return updatedData
  },
})

export const usePersonalDetailsStepValidationRules = {
  salutationId: {
    required,
  },
  firstName: {
    required,
  },
  lastName: {
    required,
  },
}
