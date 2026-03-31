export const trackEvent = (event: string, data?: object) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    if (data) {
      (window as any).fbq('track', event, data);
    } else {
      (window as any).fbq('track', event);
    }
  }
};

export const trackRegistration = () => {
  trackEvent('CompleteRegistration');
};

export const trackLeagueCreated = (plan: string) => {
  trackEvent('Lead', { content_name: `Liga_${plan}` });
};

export const trackPurchase = (amount: number, plan: string) => {
  trackEvent('Purchase', {
    value: amount,
    currency: 'COP',
    content_name: plan
  });
};

export const trackPrediction = () => {
  trackEvent('CustomEvent', { event_name: 'Prediction' });
};

export const trackInitiateCheckout = () => {
  trackEvent('InitiateCheckout');
};
