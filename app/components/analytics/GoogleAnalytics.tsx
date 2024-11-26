// app/components/analytics/GoogleAnalytics.tsx
import React from 'react';
import Script from 'next/script';

const GOOGLE_ANALYTICS_ID = 'G-R2LNF9NDSM';

const GoogleAnalytics = () => {
    return (
        <>
            <Script
                strategy='lazyOnload'
                src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
            />

            <Script id='google-analytics-tag' strategy='lazyOnload'>
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${GOOGLE_ANALYTICS_ID}', {
                        page_path: window.location.pathname,
                    });
                `}
            </Script>
        </>
    );
};

export default GoogleAnalytics;