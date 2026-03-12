"""
Aplica las pronunciaciones corregidas al archivo data/lessons.ts
"""
import json
import re

# Cargar pronunciaciones corregidas
with open('/home/ubuntu/gemlish/scripts/fixed_pronunciations.json') as f:
    fixed = json.load(f)

print(f"Pronunciaciones disponibles: {len(fixed)}")

# Leer el archivo de lecciones
with open('/home/ubuntu/gemlish/data/lessons.ts') as f:
    content = f.read()

# Reemplazar cada pronunciación
replaced = 0
not_found = []

for word, new_pron in fixed.items():
    # Escapar caracteres especiales para regex
    word_escaped = re.escape(word)
    
    # Buscar el bloque que contiene esta palabra y su pronunciación
    # Patrón: word: "WORD", ... pronunciation: "OLD_PRON"
    # Necesitamos encontrar la pronunciación asociada a esta palabra específica
    
    # Estrategia: buscar "word: "WORD"" y luego la siguiente "pronunciation:" en las siguientes líneas
    pattern = r'(word:\s*["\']' + word_escaped + r'["\'][^}]*?pronunciation:\s*["\'])([^"\']+)(["\'])'
    
    def replace_pron(m):
        return m.group(1) + new_pron + m.group(3)
    
    new_content, count = re.subn(pattern, replace_pron, content, flags=re.DOTALL)
    
    if count > 0:
        content = new_content
        replaced += count
    else:
        not_found.append(word)

print(f"Reemplazadas: {replaced}")
if not_found:
    print(f"No encontradas ({len(not_found)}):")
    for w in not_found[:20]:
        print(f"  - {w}")

# Guardar el archivo modificado
with open('/home/ubuntu/gemlish/data/lessons.ts', 'w') as f:
    f.write(content)

print("✅ Archivo guardado correctamente")

# Verificar algunas pronunciaciones clave
print("\nVerificación de correcciones clave:")
checks = ['Gym', 'General', 'Giant', 'Giraffe', 'Juice', 'Jump', 'Job', 'January', 'June', 'July']
for word in checks:
    if word in fixed:
        # Buscar en el contenido actualizado
        pattern = r'word:\s*["\']' + re.escape(word) + r'["\'][^}]*?pronunciation:\s*["\']([^"\']+)["\']'
        m = re.search(pattern, content, re.DOTALL)
        if m:
            print(f"  {word}: {m.group(1)}")
        else:
            print(f"  {word}: NO ENCONTRADO en archivo")
