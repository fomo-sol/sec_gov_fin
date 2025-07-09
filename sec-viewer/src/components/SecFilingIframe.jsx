import React, { useEffect, useState } from 'react';

export default function SecHtmlViewer({ txtUrl }) {
    const [htmlContent, setHtmlContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!txtUrl) {
            setHtmlContent('');
            setError(null);
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);
        setError(null);

        async function fetchHtml() {
            try {
                const res = await fetch(txtUrl);
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const text = await res.text();

                if (isMounted) setHtmlContent(text);
            } catch (e) {
                if (isMounted) setError(e.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchHtml();

        return () => {
            isMounted = false;
        };
    }, [txtUrl]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
    if (!htmlContent) return <div>No content found</div>;

    return (
        <div
            style={{ padding: 20, maxWidth: '100%', margin: 'auto', fontFamily: 'Arial, sans-serif' }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
}
