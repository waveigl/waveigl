export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Declaração para o TypeScript reconhecer o gtag global
declare global {
    interface Window {
        gtag: (
            command: 'event' | 'config' | 'set',
            targetId: string,
            config?: ControlParams | EventParams | CustomParams
        ) => void;
    }
}

type EventParams = {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
};

type ControlParams = {
    groups?: string | string[];
    send_to?: string | string[];
    event_callback?: () => void;
    event_timeout?: number;
};

type CustomParams = {
    [key: string]: any;
};

/**
 * Envia um evento personalizado para o Google Analytics
 */
export const trackEvent = (
    eventName: string,
    params?: EventParams
) => {
    if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
        window.gtag('event', eventName, {
            ...params,
            send_to: GA_MEASUREMENT_ID,
        });
    }
};

/**
 * Eventos pré-definidos para conveniência
 */
export const AnalyticsEvents = {
    PLAYER_SELECT: 'player_select',
    FORM_START: 'form_start',
    FORM_COMPLETE: 'form_complete',
    CHAT_INTERACTION: 'chat_interaction',
    SUB_INTENT: 'sub_intent',
    ACCOUNT_LINK: 'account_link',
} as const;
