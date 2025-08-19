/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 0;
  
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[s2.length][s1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1.0 : 1.0 - distance / maxLength;
}

/**
 * Find fuzzy matches for a query in a list of candidates
 */
export function findFuzzyMatches(
  query: string,
  candidates: string[],
  threshold: number = 0.6,
  maxResults: number = 10
): Array<{ text: string; score: number }> {
  const matches = candidates
    .map(candidate => ({
      text: candidate,
      score: calculateSimilarity(query, candidate),
    }))
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
  
  return matches;
}

/**
 * Calculate Jaccard similarity between two strings (based on n-grams)
 */
export function jaccardSimilarity(str1: string, str2: string, n: number = 2): number {
  const getNGrams = (str: string, n: number): Set<string> => {
    const ngrams = new Set<string>();
    const normalized = str.toLowerCase().replace(/\s+/g, "");
    for (let i = 0; i <= normalized.length - n; i++) {
      ngrams.add(normalized.slice(i, i + n));
    }
    return ngrams;
  };
  
  const ngrams1 = getNGrams(str1, n);
  const ngrams2 = getNGrams(str2, n);
  
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Combined similarity score using multiple algorithms
 */
export function combinedSimilarity(str1: string, str2: string): number {
  const levenshteinScore = calculateSimilarity(str1, str2);
  const jaccardScore = jaccardSimilarity(str1, str2);
  
  // Weight Levenshtein more heavily for exact matches
  return (levenshteinScore * 0.7) + (jaccardScore * 0.3);
}
