export const calculateDTW = (seq1: number[], seq2: number[]): number => {
    const n = seq1.length;
    const m = seq2.length;

    // Create distance matrix initialized with Infinity
    const dtw = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
    dtw[0][0] = 0;

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const cost = Math.abs(seq1[i - 1] - seq2[j - 1]);
            dtw[i][j] = cost + Math.min(
                dtw[i - 1][j],    // insertion
                dtw[i][j - 1],    // deletion
                dtw[i - 1][j - 1] // match
            );
        }
    }

    // Normalize by path length to be independent of duration
    return dtw[n][m] / (n + m);
};
