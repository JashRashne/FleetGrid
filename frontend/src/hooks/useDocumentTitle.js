import { useEffect } from 'react';

/**
 * Custom hook to dynamically update document.title with max 2-3 words.
 * @param {string} title - The concise page title (e.g. 'Dashboard · MileMint')
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title || 'MileMint ELD';

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}

export default useDocumentTitle;
