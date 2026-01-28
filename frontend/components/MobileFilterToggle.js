"use client";
import { useState, useEffect } from 'react';

export default function MobileFilterToggle() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Sync state with DOM attribute
        const root = document.documentElement;
        const check = () => setIsOpen(root.getAttribute('data-filters-open') === 'true');
        check();

        const onToggle = (e) => setIsOpen(!!e.detail?.open);
        window.addEventListener('filters:toggle', onToggle);
        return () => window.removeEventListener('filters:toggle', onToggle);
    }, []);

    const toggle = () => {
        const root = document.documentElement;
        const next = !isOpen;
        setIsOpen(next);
        root.setAttribute('data-filters-open', String(next));
        window.dispatchEvent(new CustomEvent('filters:toggle', { detail: { open: next } }));
    };

    return (
        <button
            onClick={toggle}
            className="lg:hidden mb-4 w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 py-2.5 rounded-lg transition-colors font-medium"
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 3H2l8 9v7l4 2v-9l8-9z" />
            </svg>
            {isOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
    );
}
