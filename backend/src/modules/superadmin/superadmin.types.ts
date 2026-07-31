export interface CreateSubscriptionPlanInput {
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  employeeLimit: number;
  storageLimit: number;
  features?: any;
  isPopular?: boolean;
}

export interface CreateIntegrationInput {
  category: string;
  provider: string;
  config: any;
}
