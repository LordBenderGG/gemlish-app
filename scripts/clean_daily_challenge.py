"""Remove dead daily challenge code from index.tsx"""
import re

path = 'app/(tabs)/index.tsx'
content = open(path).read()

# 1. Remove the import line
content = content.replace(
    "import { getOrCreateDailyChallenge, completeDailyChallenge, type DailyChallenge } from '@/lib/daily-challenge';\n",
    ''
)

# 2. Remove the entire daily challenge hooks section using regex
# From "// ─── Desafío del día" up to (but not including) "const showUnlockAnimation"
pattern = r'  // ─── Desafío del día ─+\n.*?(?=  const showUnlockAnimation)'
content = re.sub(pattern, '', content, flags=re.DOTALL)

# 3. Remove loadDailyChallenge from useFocusEffect deps
content = content.replace(
    '      loadDailyChallenge();\n    }, [maxUnlockedLevel, showUnlockAnimation, loadDailyChallenge])',
    '    }, [maxUnlockedLevel, showUnlockAnimation])'
)

# 4. Remove the "// Recargar desafío del día al volver al mapa" comment + loadDailyChallenge() call
content = content.replace(
    '      // Recargar desafío del día al volver al mapa\n      loadDailyChallenge();\n',
    ''
)

open(path, 'w').write(content)
print("Done. Remaining references to dailyChallenge:")
for i, line in enumerate(content.split('\n'), 1):
    if 'dailyChallenge' in line or 'DailyChallenge' in line or 'getOrCreateDaily' in line:
        print(f"  Line {i}: {line.strip()}")
