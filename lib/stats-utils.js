/**
 * Stats Utilities
 *
 * Helper functions for organizing and categorizing SAT question statistics
 */

// Known Math domains
const MATH_DOMAINS = new Set([
  'Algebra',
  'Advanced Math',
  'Geometry',
  'Problem-Solving and Data Analysis',
  'Trigonometry',
]);

// Known Reading & Writing domains
const READING_WRITING_DOMAINS = new Set([
  'Information and Ideas',
  'Craft and Structure',
  'Expression of Ideas',
  'Standard English Conventions',
]);

/**
 * Infer the correct subject from a domain name
 *
 * @param {string} domain - The domain name (e.g., "Algebra", "Information and Ideas")
 * @param {string} storedSubject - The subject value from storage (might be incorrect)
 * @returns {string} - The correct subject: 'math' or 'reading-writing'
 */
export function inferSubjectFromDomain(domain, storedSubject = null) {
  // If no domain, return stored subject or default
  if (!domain || domain === 'Unknown') {
    return storedSubject || 'reading-writing';
  }

  // Check if it's a known math domain
  if (MATH_DOMAINS.has(domain)) {
    return 'math';
  }

  // Check if it's a known reading/writing domain
  if (READING_WRITING_DOMAINS.has(domain)) {
    return 'reading-writing';
  }

  // If domain is unknown, trust the stored subject
  return storedSubject || 'reading-writing';
}

/**
 * Normalize subject name to ensure consistency
 *
 * @param {string} subject - Raw subject value
 * @returns {string} - Normalized subject: 'math' or 'reading-writing'
 */
export function normalizeSubject(subject) {
  if (!subject) return 'reading-writing';

  const normalized = subject.toLowerCase().trim();

  if (normalized === 'math' || normalized === 'mathematics') {
    return 'math';
  }

  return 'reading-writing';
}

/**
 * Get the correct subject for a question based on available metadata
 *
 * @param {Object} metadata - Question metadata
 * @param {string} metadata.subject - Stored subject
 * @param {string} metadata.domain - Domain name
 * @param {string} metadata.primary_class_cd_desc - Alternative domain field
 * @returns {string} - The correct subject
 */
export function getCorrectSubject(metadata) {
  const domain = metadata.domain || metadata.primary_class_cd_desc;
  const storedSubject = metadata.subject;

  return inferSubjectFromDomain(domain, storedSubject);
}
