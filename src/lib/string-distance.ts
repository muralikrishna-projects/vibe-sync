export const levenshteinDistance = (s: string, t: string): number => {
    if (!s.length) return t.length;
    if (!t.length) return s.length;

    const arr = [];
    for (let i = 0; i <= t.length; i++) {
        arr[i] = [i];
        for (let j = 1; j <= s.length; j++) {
            arr[i][j] =
                i === 0
                    ? j
                    : Math.min(
                        arr[i - 1][j] + 1,
                        arr[i][j - 1] + 1,
                        arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
                    );
        }
    }
    return arr[t.length][s.length];
};

export const calculateAccuracy = (reference: string, user: string): number => {
    const refClean = reference.toLowerCase().replace(/[^a-z0-9 ]/g, '')
    const userClean = user.toLowerCase().replace(/[^a-z0-9 ]/g, '')

    if (!refClean || !userClean) return 0

    const distance = levenshteinDistance(refClean, userClean)
    const maxLength = Math.max(refClean.length, userClean.length)

    const accuracy = ((maxLength - distance) / maxLength) * 100
    return Math.max(0, Math.min(100, accuracy))
}
