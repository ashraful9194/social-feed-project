/**
 * Date formatting utilities
 */

/**
 * Formats a date string to a relative time (e.g., "2h", "3d", "Just now")
 */
export const formatTimeAgo = (isoDate: string): string => {
    const created = new Date(isoDate);
    const diffMs = Date.now() - created.getTime();
    const minutes = Math.floor(diffMs / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    
    return created.toLocaleDateString();
};

