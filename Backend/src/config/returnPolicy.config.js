/**
 * OMIZON Returns & Refunds Policy Configuration
 *
 * Configurable business rules, return windows, reasons, and state transitions.
 */

const DEFAULT_RETURN_WINDOW_DAYS = parseInt(process.env.RETURN_WINDOW_DAYS || '15', 10);

const VALID_RETURN_REASONS = [
    {
        code: 'DEFECTIVE_DAMAGED',
        label: 'Defective, damaged, or broken item',
        requiresEvidence: true
    },
    {
        code: 'WRONG_ITEM',
        label: 'Wrong item or size delivered',
        requiresEvidence: true
    },
    {
        code: 'NOT_AS_DESCRIBED',
        label: 'Item does not match website description or pictures',
        requiresEvidence: false
    },
    {
        code: 'QUALITY_UNSATISFACTORY',
        label: 'Quality of material/product is unsatisfactory',
        requiresEvidence: false
    },
    {
        code: 'SIZE_FIT_ISSUE',
        label: 'Size or fit does not suit me',
        requiresEvidence: false
    },
    {
        code: 'MISSING_PARTS',
        label: 'Missing accessories, parts, or manuals',
        requiresEvidence: true
    },
    {
        code: 'ARRIVED_LATE',
        label: 'Arrived too late / No longer needed',
        requiresEvidence: false
    }
];

const VALID_RETURN_STATUSES = [
    'requested',
    'under_review',
    'approved',
    'rejected',
    'pickup_scheduled',
    'in_transit',
    'received',
    'inspected',
    'disputed',
    'completed',
    'cancelled'
];

const VALID_REFUND_STATUSES = [
    'none',
    'pending',
    'processing',
    'completed',
    'failed'
];

const VALID_INSPECTION_CONDITIONS = [
    'uninspected',
    'passed_resellable',
    'damaged_unsellable',
    'wrong_item_returned',
    'counterfeit'
];

const VALID_DISPOSITIONS = [
    'pending',
    'restocked',
    'scrapped',
    'disputed',
    'held'
];

const MAX_EVIDENCE_FILES = 5;
const MAX_EVIDENCE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

module.exports = {
    DEFAULT_RETURN_WINDOW_DAYS,
    VALID_RETURN_REASONS,
    VALID_RETURN_STATUSES,
    VALID_REFUND_STATUSES,
    VALID_INSPECTION_CONDITIONS,
    VALID_DISPOSITIONS,
    MAX_EVIDENCE_FILES,
    MAX_EVIDENCE_FILE_SIZE_BYTES,
    ALLOWED_IMAGE_TYPES
};
